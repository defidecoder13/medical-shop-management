import Account from "@/src/models/Account";
import JournalEntry from "@/src/models/JournalEntry";

export async function createSaleJournalEntry(bill: any) {
  try {
    const cashAcc = await Account.findOne({ name: 'Cash' });
    const salesRevAcc = await Account.findOne({ name: 'Sales Revenue' });
    const cogsAcc = await Account.findOne({ name: 'Cost of Goods Sold' });
    const inventoryAcc = await Account.findOne({ name: 'Inventory Asset' });
    
    // Dynamically create Tax Payable account if it doesn't exist
    let taxAcc = await Account.findOne({ name: 'Sales Tax Payable' });
    if (!taxAcc) {
      taxAcc = await Account.create({ name: 'Sales Tax Payable', type: 'Liability', balance: 0 });
    }

    if (!cashAcc || !salesRevAcc || !cogsAcc || !inventoryAcc) {
        console.warn("Accounting accounts missing, skipping journal entry.");
        return;
    }

    const grandTotal = bill.grandTotal;
    const gstAmount = bill.gstAmount || 0;
    const netRevenue = grandTotal - gstAmount;
    
    // Calculate COGS
    let totalCogs = 0;
    for (const item of bill.items) {
      totalCogs += (item.qty * (item.buyingPrice || 0));
    }

    const entries = [
      { accountId: cashAcc._id, type: 'Debit', amount: grandTotal },
      { accountId: salesRevAcc._id, type: 'Credit', amount: netRevenue },
      { accountId: cogsAcc._id, type: 'Debit', amount: totalCogs },
      { accountId: inventoryAcc._id, type: 'Credit', amount: totalCogs },
    ];

    if (gstAmount > 0) {
      entries.push({ accountId: taxAcc._id, type: 'Credit', amount: gstAmount });
    }

    const journal = new JournalEntry({
      description: `Sale Invoice #${bill._id.toString().slice(-6)}`,
      referenceType: 'Bill',
      referenceId: bill._id,
      entries: entries
    });

    await journal.save();

    // Update balances
    cashAcc.balance += grandTotal; 
    salesRevAcc.balance += netRevenue; 
    cogsAcc.balance += totalCogs; 
    inventoryAcc.balance -= totalCogs; 
    if (gstAmount > 0) taxAcc.balance += gstAmount; // Liability increases with Credit

    const saves = [
      cashAcc.save(),
      salesRevAcc.save(),
      cogsAcc.save(),
      inventoryAcc.save(),
      taxAcc.save()
    ];
    await Promise.all(saves);

  } catch (err) {
    console.error("Failed to create journal entry for sale:", err);
  }
}

export async function createReturnJournalEntry(returnBill: any) {
  try {
    const cashAcc = await Account.findOne({ name: 'Cash' });
    const salesRevAcc = await Account.findOne({ name: 'Sales Revenue' });
    const cogsAcc = await Account.findOne({ name: 'Cost of Goods Sold' });
    const inventoryAcc = await Account.findOne({ name: 'Inventory Asset' });
    let taxAcc = await Account.findOne({ name: 'Sales Tax Payable' });

    if (!cashAcc || !salesRevAcc || !cogsAcc || !inventoryAcc || !taxAcc) return;

    // returnBill.grandTotal is negative, so let's get absolute
    const refundAmount = Math.abs(returnBill.grandTotal);
    const gstRefunded = Math.abs(returnBill.gstAmount || 0);
    const netRevenueRefunded = refundAmount - gstRefunded;
    
    // Calculate COGS reversed
    let totalCogsReversed = 0;
    for (const item of returnBill.items) {
      totalCogsReversed += (item.qty * (item.buyingPrice || 0));
    }

    const entries = [
      { accountId: salesRevAcc._id, type: 'Debit', amount: netRevenueRefunded }, // Reduce Revenue
      { accountId: cashAcc._id, type: 'Credit', amount: refundAmount }, // Reduce Cash
      { accountId: inventoryAcc._id, type: 'Debit', amount: totalCogsReversed }, // Increase Inventory
      { accountId: cogsAcc._id, type: 'Credit', amount: totalCogsReversed }, // Reduce COGS
    ];

    if (gstRefunded > 0) {
      entries.push({ accountId: taxAcc._id, type: 'Debit', amount: gstRefunded }); // Reduce Tax Liability
    }

    const journal = new JournalEntry({
      description: `Customer Return #${returnBill._id.toString().slice(-6)}`,
      referenceType: 'Bill',
      referenceId: returnBill._id,
      entries: entries
    });

    await journal.save();

    cashAcc.balance -= refundAmount; 
    salesRevAcc.balance -= netRevenueRefunded; 
    cogsAcc.balance -= totalCogsReversed; 
    inventoryAcc.balance += totalCogsReversed; 
    if (gstRefunded > 0) taxAcc.balance -= gstRefunded;

    await Promise.all([
      cashAcc.save(),
      salesRevAcc.save(),
      cogsAcc.save(),
      inventoryAcc.save(),
      taxAcc.save()
    ]);

  } catch (err) {
    console.error("Failed to create journal entry for return:", err);
  }
}

export async function createSupplierReturnJournalEntry(supplierReturn: any) {
  try {
    const cashAcc = await Account.findOne({ name: 'Cash' });
    const inventoryAcc = await Account.findOne({ name: 'Inventory Asset' });

    if (!cashAcc || !inventoryAcc) return;

    const refundAmount = supplierReturn.totalRefundAmount;

    const journal = new JournalEntry({
      description: `Supplier Return to ${supplierReturn.supplierName}`,
      referenceType: 'SupplierReturn',
      referenceId: supplierReturn._id,
      entries: [
        { accountId: cashAcc._id, type: 'Debit', amount: refundAmount }, // Cash received from supplier
        { accountId: inventoryAcc._id, type: 'Credit', amount: refundAmount }, // Inventory reduced
      ]
    });

    await journal.save();

    cashAcc.balance += refundAmount; 
    inventoryAcc.balance -= refundAmount; 

    await Promise.all([
      cashAcc.save(),
      inventoryAcc.save()
    ]);

  } catch (err) {
    console.error("Failed to create journal entry for supplier return:", err);
  }
}
