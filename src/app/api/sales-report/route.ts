import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import Medicine from "@/src/models/Medicine";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch bills within the date range (excluding return records)
    const bills = await Bill.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      isReturn: { $ne: true }
    }).lean();

    // Calculate total sales and profit
    let totalSales = 0;
    let totalProfit = 0;
    const medicineQuantities: Record<string, { quantity: number; revenue: number; profit: number }> = {};

    // Get all unique medicine IDs from bills to fetch their buying prices
    const medicineIds = new Set<string>();
    bills.forEach((bill: any) => {
      bill.items.forEach((item: any) => {
        medicineIds.add(item.name); // Using name to identify medicine
      });
    });

    // Fetch buying prices for all medicines in the bills
    const medicineMap = new Map<string, any>();
    if (medicineIds.size > 0) {
      // Since we only have name in the bill items, we need to get medicine by name
      // In a real system, you'd want to store the medicine ID in the bill items
      const medicines = await Medicine.find({ name: { $in: Array.from(medicineIds) } }).lean();
      medicines.forEach((med: any) => {
        medicineMap.set(med.name, med);
      });
    }

    bills.forEach((bill: any) => {
      // Calculate net quantities and totals for this bill (excluding returned items)
      let netSubTotal = 0;
      const netItems = bill.items.map((item: any) => {
        const netQty = item.qty - (item.returnedQty || 0);
        const itemSubTotal = item.sellingPrice * netQty;
        netSubTotal += itemSubTotal;
        return {
          ...item,
          netQty,
          itemSubTotal
        };
      });

      const discountPercent = bill.discountPercent || 0;
      const netDiscountAmount = netSubTotal * (discountPercent / 100);
      const netSubTotalAfterDiscount = netSubTotal - netDiscountAmount;

      const gstPercent = bill.gstPercent || 0;
      const netGstAmount = bill.gstEnabled ? (netSubTotalAfterDiscount * (gstPercent / 100)) : 0;
      const netGrandTotal = Math.round(netSubTotalAfterDiscount + netGstAmount);

      totalSales += netGrandTotal;

      netItems.forEach((item: any) => {
        if (item.netQty <= 0) return;

        if (!medicineQuantities[item.name]) {
          medicineQuantities[item.name] = { quantity: 0, revenue: 0, profit: 0 };
        }

        medicineQuantities[item.name].quantity += item.netQty;

        // Calculate net revenue for this item (sellingPrice * netQty minus its share of discount)
        const itemOriginalTotal = item.sellingPrice * item.netQty;
        let discountedItemTotal = itemOriginalTotal;
        if (netSubTotal > 0 && netDiscountAmount > 0) {
          const discountRatio = netDiscountAmount / netSubTotal;
          const itemDiscount = itemOriginalTotal * discountRatio;
          discountedItemTotal = itemOriginalTotal - itemDiscount;
        }

        medicineQuantities[item.name].revenue += discountedItemTotal;

        // Profit Calculation
        let costPerUnit = 0;
        if (item.buyingPrice !== undefined) {
          costPerUnit = item.buyingPrice;
        } else {
          // Old Bills: fallback to current inventory buying price
          const medicine = medicineMap.get(item.name);
          if (medicine) {
            if (item.unitType === 'strip') {
              costPerUnit = medicine.buyingPricePerStrip || 0;
            } else {
              costPerUnit = (medicine.buyingPricePerStrip || 0) / (medicine.tabletsPerStrip || 1);
            }
          }
        }

        const totalCost = costPerUnit * item.netQty;
        const itemProfit = discountedItemTotal - totalCost;
        medicineQuantities[item.name].profit += itemProfit;
        totalProfit += itemProfit;
      });

      // Factor in rounding adjustment for this bill's overall profit
      const roundingAdjustment = netGrandTotal - (netSubTotalAfterDiscount + netGstAmount);
      totalProfit += roundingAdjustment;
    });

    // Find most and least sold medicines
    let mostSoldMedicine = null;
    let leastSoldMedicine = null;
    let maxQty = -1;
    let minQty = Infinity;

    for (const [name, data] of Object.entries(medicineQuantities)) {
      if (data.quantity > maxQty) {
        maxQty = data.quantity;
        mostSoldMedicine = { name, quantity: data.quantity };
      }
      if (data.quantity < minQty) {
        minQty = data.quantity;
        leastSoldMedicine = { name, quantity: data.quantity };
      }
    }

    // Get top and least selling medicines by quantity
    const sortedMedicinesByQuantity = Object.entries(medicineQuantities)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue, profit: data.profit }))
      .sort((a, b) => b.quantity - a.quantity);

    const topSellingMedicines = sortedMedicinesByQuantity.slice(0, 5);
    const leastSellingMedicines = sortedMedicinesByQuantity.slice().reverse().slice(0, 5);

    // Calculate daily sales
    const dailySalesMap: Record<string, { sales: number; profit: number }> = {};
    bills.forEach((bill: any) => {
      const date = new Date(bill.createdAt).toDateString();
      if (!dailySalesMap[date]) {
        dailySalesMap[date] = { sales: 0, profit: 0 };
      }

      // Calculate net quantities and totals for this bill (excluding returned items)
      let netSubTotal = 0;
      const netItems = bill.items.map((item: any) => {
        const netQty = item.qty - (item.returnedQty || 0);
        const itemSubTotal = item.sellingPrice * netQty;
        netSubTotal += itemSubTotal;
        return {
          ...item,
          netQty,
          itemSubTotal
        };
      });

      const discountPercent = bill.discountPercent || 0;
      const netDiscountAmount = netSubTotal * (discountPercent / 100);
      const netSubTotalAfterDiscount = netSubTotal - netDiscountAmount;

      const gstPercent = bill.gstPercent || 0;
      const netGstAmount = bill.gstEnabled ? (netSubTotalAfterDiscount * (gstPercent / 100)) : 0;
      const netGrandTotal = Math.round(netSubTotalAfterDiscount + netGstAmount);

      dailySalesMap[date].sales += netGrandTotal;

      let dailyProfit = 0;
      netItems.forEach((item: any) => {
        if (item.netQty <= 0) return;

        let costPerUnit = 0;
        if (item.buyingPrice !== undefined) {
          costPerUnit = item.buyingPrice;
        } else {
          const medicine = medicineMap.get(item.name);
          if (medicine) {
            if (item.unitType === 'strip') {
              costPerUnit = medicine.buyingPricePerStrip || 0;
            } else {
              costPerUnit = (medicine.buyingPricePerStrip || 0) / (medicine.tabletsPerStrip || 1);
            }
          }
        }

        const totalCost = costPerUnit * item.netQty;

        // Calculate net revenue for this item
        const itemOriginalTotal = item.sellingPrice * item.netQty;
        let discountedItemTotal = itemOriginalTotal;
        if (netSubTotal > 0 && netDiscountAmount > 0) {
          const discountRatio = netDiscountAmount / netSubTotal;
          const itemDiscount = itemOriginalTotal * discountRatio;
          discountedItemTotal = itemOriginalTotal - itemDiscount;
        }

        const itemProfit = discountedItemTotal - totalCost;
        dailyProfit += itemProfit;
      });
      dailySalesMap[date].profit += dailyProfit;
    });

    const dailySales = Object.entries(dailySalesMap)
      .map(([date, data]) => ({ date, sales: data.sales, profit: data.profit }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      totalSales,
      totalProfit,
      totalTransactions: bills.length,
      mostSoldMedicine,
      leastSoldMedicine,
      topSellingMedicines,
      leastSellingMedicines,
      dailySales,
    });
  } catch (error) {
    console.error("SALES REPORT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales report" },
      { status: 500 }
    );
  }
}