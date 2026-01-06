export function calculateBill(
  items: any[],
  gstEnabled: boolean,
  discountPercent: number
) {
  let subTotal = 0;
  let profit = 0;

  items.forEach((item) => {
    subTotal += item.sellingPrice * item.qty;
    profit += (item.sellingPrice - item.buyingPrice) * item.qty;
  });

  const discountAmount =
    discountPercent > 0
      ? (subTotal * discountPercent) / 100
      : 0;

  const discountedSubTotal = subTotal - discountAmount;

  const gstAmount = gstEnabled
    ? discountedSubTotal * (items[0]?.gstPercent || 0) / 100
    : 0;

  return {
    subTotal,
    discountPercent,
    discountAmount,
    discountedSubTotal,
    gstAmount,
    grandTotal: discountedSubTotal + gstAmount,
    profit,
  };
}