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

    // Fetch bills within the date range
    const bills = await Bill.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
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
      totalSales += bill.grandTotal;
      
      // Calculate the discount ratio to apply to individual items
      const originalSubtotal = bill.subTotal; // This is the total before discount
      const discountPercent = bill.discountPercent || 0;
      const discountAmount = bill.discountAmount || 0;
      
      // For each item in the bill, calculate revenue and actual profit
      bill.items.forEach((item: any) => {
        if (!medicineQuantities[item.name]) {
          medicineQuantities[item.name] = { quantity: 0, revenue: 0, profit: 0 };
        }
        
        medicineQuantities[item.name].quantity += item.qty;
        medicineQuantities[item.name].revenue += item.total;
        
        // Calculate actual profit based on buying price
        const medicine = medicineMap.get(item.name);
        if (medicine) {
          let costPerUnit = 0;
          if (item.unitType === 'strip') {
            costPerUnit = medicine.buyingPricePerStrip;
          } else {
            // If unit is tablet, calculate cost per tablet
            costPerUnit = medicine.buyingPricePerStrip / medicine.tabletsPerStrip;
          }
          
          const totalCost = costPerUnit * item.qty;
          
          // Apply proportional discount to this item's selling price
          let discountedItemTotal = item.total; // Default to the stored total
          if (originalSubtotal > 0) {
            // Calculate the discount ratio and apply it proportionally to this item
            const itemOriginalTotal = item.sellingPrice * item.qty; // Original total before discount
            const discountRatio = discountAmount / originalSubtotal; // How much discount was applied overall
            const itemDiscount = itemOriginalTotal * discountRatio; // Discount for this item
            discountedItemTotal = itemOriginalTotal - itemDiscount;
          }
          
          const itemProfit = discountedItemTotal - totalCost; // Actual profit = discounted selling price - cost price
          medicineQuantities[item.name].profit += itemProfit;
          totalProfit += itemProfit;
        }
      });
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
      dailySalesMap[date].sales += bill.grandTotal;
      
      // Calculate actual profit for the day based on items sold
      let dailyProfit = 0;
      
      // Calculate the discount ratio to apply to individual items
      const originalSubtotal = bill.subTotal; // This is the total before discount
      const discountAmount = bill.discountAmount || 0;
      
      bill.items.forEach((item: any) => {
        const medicine = medicineMap.get(item.name);
        if (medicine) {
          let costPerUnit = 0;
          if (item.unitType === 'strip') {
            costPerUnit = medicine.buyingPricePerStrip;
          } else {
            // If unit is tablet, calculate cost per tablet
            costPerUnit = medicine.buyingPricePerStrip / medicine.tabletsPerStrip;
          }
          
          const totalCost = costPerUnit * item.qty;
          
          // Apply proportional discount to this item's selling price
          let discountedItemTotal = item.total; // Default to the stored total
          if (originalSubtotal > 0) {
            // Calculate the discount ratio and apply it proportionally to this item
            const itemOriginalTotal = item.sellingPrice * item.qty; // Original total before discount
            const discountRatio = discountAmount / originalSubtotal; // How much discount was applied overall
            const itemDiscount = itemOriginalTotal * discountRatio; // Discount for this item
            discountedItemTotal = itemOriginalTotal - itemDiscount;
          }
          
          const itemProfit = discountedItemTotal - totalCost; // Actual profit = discounted selling price - cost price
          dailyProfit += itemProfit;
        }
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