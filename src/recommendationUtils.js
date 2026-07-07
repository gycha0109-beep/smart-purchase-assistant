export function calculateRecommendation(item) {
  const avgDailySales = item.recent7dSalesTotal / 7;
  const daysCover = avgDailySales > 0 ? item.currentStock / avgDailySales : Infinity;
  const expectedNeed = avgDailySales * item.leadTimeDays;
  const targetStock = expectedNeed + item.safetyStock;
  const rawOrderQty = targetStock - item.currentStock;
  
  let recommendedOrderQty = Math.ceil(rawOrderQty / item.moq) * item.moq;
  if (recommendedOrderQty <= 0) {
    recommendedOrderQty = 0;
  }
  
  return {
    avgDailySales,
    daysCover,
    expectedNeed,
    targetStock,
    rawOrderQty,
    recommendedOrderQty
  };
}
