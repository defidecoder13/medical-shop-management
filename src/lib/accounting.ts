import Account from "@/src/models/Account";
import JournalEntry from "@/src/models/JournalEntry";

export async function createSaleJournalEntry(bill: any, session?: any) {
  try {
    const paymentMethod = bill.paymentMethod || "Cash";
    const findAcc = (name: string) => session ? Account.findOne({ name }).session(session) : Account.findOne({ name });
    const createAcc = (data: any) => session ? Account.create([data], { session }).then(res => res[0]) : Account.create(data);

    let assetAcc;
    if (paymentMethod === "UPI" || paymentMethod === "Card") {
      assetAcc = await findAcc('Bank');
      if (!assetAcc) {
        assetAcc = await createAcc({ name: 'Bank', type: 'Asset', balance: 0 });
      }
    } else {
      assetAcc = await findAcc('Cash');
    }

    const salesRevAcc = await findAcc('Sales Revenue');
    const cogsAcc = await findAcc('Cost of Goods Sold');
    const inventoryAcc = await findAcc('Inventory Asset');
    
    let taxAcc = await findAcc('Sales Tax Payable');
    if (!taxAcc) {
      taxAcc = await createAcc({ name: 'Sales Tax Payable', type: 'Liability', balance: 0 });
    }

    let roundingAcc = await findAcc('Rounding Adjustment');
    if (!roundingAcc) {
      roundingAcc = await createAcc({ name: 'Rounding Adjustment', type: 'Expense', balance: 0 });
    }

    if (!assetAcc || !salesRevAcc || !cogsAcc || !inventoryAcc) {
        console.warn("Accounting accounts missing, skipping journal entry.");
        return;
    }

    const grandTotal = bill.grandTotal;
    const gstAmount = bill.gstAmount || 0;
    const roundingAdjustment = bill.roundingAdjustment || 0;
    const netRevenue = grandTotal - gstAmount - roundingAdjustment;
    
    // Calculate COGS
    let totalCogs = 0;
    for (const item of bill.items) {
      totalCogs += (item.qty * (item.buyingPrice || 0));
    }

    const entries = [
      { accountId: assetAcc._id, type: 'Debit', amount: grandTotal },
      { accountId: salesRevAcc._id, type: 'Credit', amount: netRevenue },
      { accountId: cogsAcc._id, type: 'Debit', amount: totalCogs },
      { accountId: inventoryAcc._id, type: 'Credit', amount: totalCogs },
    ];

    if (gstAmount > 0) {
      entries.push({ accountId: taxAcc._id, type: 'Credit', amount: gstAmount });
    }

    if (roundingAdjustment !== 0) {
      entries.push({
        accountId: roundingAcc._id,
        type: roundingAdjustment < 0 ? 'Debit' : 'Credit',
        amount: Math.abs(roundingAdjustment)
      });
    }

    const journal = new JournalEntry({
      description: `Sale Invoice #${bill._id.toString().slice(-6)}`,
      referenceType: 'Bill',
      referenceId: bill._id,
      entries: entries
    });

    if (session) {
      await journal.save({ session });
    } else {
      await journal.save();
    }

    // Update balances
    assetAcc.balance += grandTotal; 
    salesRevAcc.balance += netRevenue; 
    cogsAcc.balance += totalCogs; 
    inventoryAcc.balance -= totalCogs; 
    if (gstAmount > 0) taxAcc.balance += gstAmount;
    if (roundingAdjustment !== 0) {
      if (roundingAdjustment < 0) {
        roundingAcc.balance += Math.abs(roundingAdjustment);
      } else {
        roundingAcc.balance -= Math.abs(roundingAdjustment);
      }
    }

    const saves = [
      assetAcc.save(session ? { session } : undefined),
      salesRevAcc.save(session ? { session } : undefined),
      cogsAcc.save(session ? { session } : undefined),
      inventoryAcc.save(session ? { session } : undefined),
      taxAcc.save(session ? { session } : undefined),
      roundingAcc.save(session ? { session } : undefined)
    ];
    await Promise.all(saves);

  } catch (err) {
    console.error("Failed to create journal entry for sale:", err);
    throw err;
  }
}

export async function createReturnJournalEntry(returnBill: any, session?: any) {
  try {
    const paymentMethod = returnBill.paymentMethod || "Cash";
    const findAcc = (name: string) => session ? Account.findOne({ name }).session(session) : Account.findOne({ name });
    const createAcc = (data: any) => session ? Account.create([data], { session }).then(res => res[0]) : Account.create(data);

    let assetAcc;
    if (paymentMethod === "UPI" || paymentMethod === "Card") {
      assetAcc = await findAcc('Bank');
      if (!assetAcc) {
        assetAcc = await createAcc({ name: 'Bank', type: 'Asset', balance: 0 });
      }
    } else {
      assetAcc = await findAcc('Cash');
    }

    const salesRevAcc = await findAcc('Sales Revenue');
    const cogsAcc = await findAcc('Cost of Goods Sold');
    const inventoryAcc = await findAcc('Inventory Asset');
    let taxAcc = await findAcc('Sales Tax Payable');

    let roundingAcc = await findAcc('Rounding Adjustment');
    if (!roundingAcc) {
      roundingAcc = await createAcc({ name: 'Rounding Adjustment', type: 'Expense', balance: 0 });
    }

    if (!assetAcc || !salesRevAcc || !cogsAcc || !inventoryAcc || !taxAcc) return;

    const refundAmount = Math.abs(returnBill.grandTotal);
    const gstRefunded = Math.abs(returnBill.gstAmount || 0);
    const roundingAdjustment = returnBill.roundingAdjustment || 0;
    const netRevenueRefunded = refundAmount - gstRefunded + roundingAdjustment;
    
    let totalCogsReversed = 0;
    for (const item of returnBill.items) {
      totalCogsReversed += (item.qty * (item.buyingPrice || 0));
    }

    const entries = [
      { accountId: salesRevAcc._id, type: 'Debit', amount: netRevenueRefunded }, 
      { accountId: assetAcc._id, type: 'Credit', amount: refundAmount }, 
      { accountId: inventoryAcc._id, type: 'Debit', amount: totalCogsReversed }, 
      { accountId: cogsAcc._id, type: 'Credit', amount: totalCogsReversed }, 
    ];

    if (gstRefunded > 0) {
      entries.push({ accountId: taxAcc._id, type: 'Debit', amount: gstRefunded }); 
    }

    if (roundingAdjustment !== 0) {
      entries.push({
        accountId: roundingAcc._id,
        type: roundingAdjustment < 0 ? 'Debit' : 'Credit',
        amount: Math.abs(roundingAdjustment)
      });
    }

    const journal = new JournalEntry({
      description: `Customer Return #${returnBill._id.toString().slice(-6)}`,
      referenceType: 'Bill',
      referenceId: returnBill._id,
      entries: entries
    });

    if (session) await journal.save({ session });
    else await journal.save();

    assetAcc.balance -= refundAmount; 
    salesRevAcc.balance -= netRevenueRefunded; 
    cogsAcc.balance -= totalCogsReversed; 
    inventoryAcc.balance += totalCogsReversed; 
    if (gstRefunded > 0) taxAcc.balance -= gstRefunded;
    if (roundingAdjustment !== 0) {
      if (roundingAdjustment < 0) {
        roundingAcc.balance += Math.abs(roundingAdjustment);
      } else {
        roundingAcc.balance -= Math.abs(roundingAdjustment);
      }
    }

    await Promise.all([
      assetAcc.save(session ? { session } : undefined),
      salesRevAcc.save(session ? { session } : undefined),
      cogsAcc.save(session ? { session } : undefined),
      inventoryAcc.save(session ? { session } : undefined),
      taxAcc.save(session ? { session } : undefined),
      roundingAcc.save(session ? { session } : undefined)
    ]);

  } catch (err) {
    console.error("Failed to create journal entry for return:", err);
    throw err;
  }
}

export async function createSupplierReturnJournalEntry(supplierReturn: any, session?: any) {
  try {
    const findAcc = (name: string) => session ? Account.findOne({ name }).session(session) : Account.findOne({ name });
    
    const cashAcc = await findAcc('Cash');
    const inventoryAcc = await findAcc('Inventory Asset');

    if (!cashAcc || !inventoryAcc) return;

    const refundAmount = supplierReturn.totalRefundAmount;

    const journal = new JournalEntry({
      description: `Supplier Return to ${supplierReturn.supplierName}`,
      referenceType: 'SupplierReturn',
      referenceId: supplierReturn._id,
      entries: [
        { accountId: cashAcc._id, type: 'Debit', amount: refundAmount }, 
        { accountId: inventoryAcc._id, type: 'Credit', amount: refundAmount }, 
      ]
    });

    if (session) await journal.save({ session });
    else await journal.save();

    cashAcc.balance += refundAmount; 
    inventoryAcc.balance -= refundAmount; 

    await Promise.all([
      cashAcc.save(session ? { session } : undefined),
      inventoryAcc.save(session ? { session } : undefined)
    ]);

  } catch (err) {
    console.error("Failed to create journal entry for supplier return:", err);
    throw err;
  }
}

export async function createPurchaseJournalEntry(purchase: any, session?: any) {
  try {
    const findAcc = (name: string) => session ? Account.findOne({ name }).session(session) : Account.findOne({ name });
    const createAcc = (data: any) => session ? Account.create([data], { session }).then(res => res[0]) : Account.create(data);

    let accountsPayable = await findAcc('Accounts Payable');
    if (!accountsPayable) {
      accountsPayable = await createAcc({ name: 'Accounts Payable', type: 'Liability', balance: 0 });
    }
    
    let inventoryAcc = await findAcc('Inventory Asset');
    if (!inventoryAcc) {
      inventoryAcc = await createAcc({ name: 'Inventory Asset', type: 'Asset', balance: 0 });
    }

    let gstInputAcc = await findAcc('GST Input Tax');
    if (!gstInputAcc) {
      gstInputAcc = await createAcc({ name: 'GST Input Tax', type: 'Asset', balance: 0 });
    }

    const totalCost = purchase.subTotal - (purchase.discountAmount || 0);
    const gstAmount = purchase.gstAmount || 0;
    const amountToPay = purchase.grandTotal;

    const entries = [
      { accountId: inventoryAcc._id, type: 'Debit', amount: totalCost },
      { accountId: accountsPayable._id, type: 'Credit', amount: amountToPay },
    ];

    if (gstAmount > 0) {
      entries.push({ accountId: gstInputAcc._id, type: 'Debit', amount: gstAmount });
    }

    const journal = new JournalEntry({
      description: `Purchase Invoice #${purchase.invoiceNumber} from ${purchase.supplierName}`,
      referenceType: 'PurchaseOrder',
      referenceId: purchase._id,
      entries: entries
    });

    if (session) await journal.save({ session });
    else await journal.save();

    inventoryAcc.balance += totalCost;
    accountsPayable.balance += amountToPay;
    if (gstAmount > 0) gstInputAcc.balance += gstAmount;

    await Promise.all([
      inventoryAcc.save(session ? { session } : undefined),
      accountsPayable.save(session ? { session } : undefined),
      gstInputAcc.save(session ? { session } : undefined)
    ]);

  } catch (err) {
    console.error("Failed to create journal entry for purchase:", err);
    throw err;
  }
}

export async function createSupplierPaymentEntry(payment: { supplierName: string, amount: number, method: string, referenceId: any }, session?: any) {
  try {
    const paymentMethod = payment.method || "Cash";
    const findAcc = (name: string) => session ? Account.findOne({ name }).session(session) : Account.findOne({ name });
    const createAcc = (data: any) => session ? Account.create([data], { session }).then(res => res[0]) : Account.create(data);

    let assetAcc;
    if (paymentMethod === "Bank Transfer" || paymentMethod === "UPI" || paymentMethod === "Cheque") {
      assetAcc = await findAcc('Bank');
      if (!assetAcc) {
        assetAcc = await createAcc({ name: 'Bank', type: 'Asset', balance: 0 });
      }
    } else {
      assetAcc = await findAcc('Cash');
      if (!assetAcc) {
        assetAcc = await createAcc({ name: 'Cash', type: 'Asset', balance: 0 });
      }
    }

    let accountsPayable = await findAcc('Accounts Payable');
    if (!accountsPayable) {
      accountsPayable = await createAcc({ name: 'Accounts Payable', type: 'Liability', balance: 0 });
    }

    const journal = new JournalEntry({
      description: `Payment to ${payment.supplierName} via ${paymentMethod}`,
      referenceType: 'SupplierPayment',
      referenceId: payment.referenceId,
      entries: [
        { accountId: accountsPayable._id, type: 'Debit', amount: payment.amount }, 
        { accountId: assetAcc._id, type: 'Credit', amount: payment.amount }, 
      ]
    });

    if (session) await journal.save({ session });
    else await journal.save();

    accountsPayable.balance -= payment.amount;
    assetAcc.balance -= payment.amount;

    await Promise.all([
      accountsPayable.save(session ? { session } : undefined),
      assetAcc.save(session ? { session } : undefined)
    ]);

  } catch (err) {
    console.error("Failed to create journal entry for supplier payment:", err);
    throw err;
  }
}
