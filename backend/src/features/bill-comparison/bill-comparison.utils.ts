/**
 * Bill Comparison Utilities
 * Parsing and calculation functions for Story 12.3
 */

import {
  MatchedItem,
  ComparisonMetrics,
  CategorizedItems,
  SummaryInsights,
  ItemChange,
  BillData,
  ExtractedItem,
} from './bill-comparison.types';

// Price change tolerance for "unchanged" classification (±$0.05)
const UNCHANGED_TOLERANCE = 0.05;

/**
 * Round a number to specified decimal places
 * Uses precise decimal math to avoid floating point errors
 */
export function roundTo(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate percentage change between two values
 * Returns 0 if original value is 0 to avoid division by zero
 */
export function calculatePercentChange(original: number, current: number): number {
  if (original === 0) return current === 0 ? 0 : 100;
  const change = ((current - original) / original) * 100;
  return roundTo(change, 1);
}

/**
 * Calculate difference between two prices
 */
export function calculateDifference(price1: number, price2: number): number {
  return roundTo(price2 - price1, 2);
}

/**
 * Validate that a value is a valid number
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Safely get a number value, returning 0 if invalid
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (isValidNumber(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isValidNumber(parsed)) return parsed;
  }
  return defaultValue;
}

/**
 * Categorize matched items by price change
 * - Increased: items that got more expensive
 * - Decreased: items that got cheaper
 * - Unchanged: items within ±$0.05 tolerance
 */
export function categorizeItems(matchedItems: MatchedItem[]): CategorizedItems {
  const increased: MatchedItem[] = [];
  const decreased: MatchedItem[] = [];
  const unchanged: MatchedItem[] = [];

  for (const item of matchedItems) {
    const difference = safeNumber(item.difference, 0);

    if (Math.abs(difference) <= UNCHANGED_TOLERANCE) {
      unchanged.push(item);
    } else if (difference > 0) {
      increased.push(item);
    } else {
      decreased.push(item);
    }
  }

  // Sort each category by absolute difference (largest first)
  increased.sort((a, b) => b.difference - a.difference);
  decreased.sort((a, b) => a.difference - b.difference);

  return { increased, decreased, unchanged };
}

/**
 * Calculate comparison metrics from matched items
 */
export function calculateMetrics(
  matchedItems: MatchedItem[],
  unmatchedBill1: ExtractedItem[],
  unmatchedBill2: ExtractedItem[]
): ComparisonMetrics {
  // Calculate average inflation rate
  let totalPercentChange = 0;
  let validPercentCount = 0;

  for (const item of matchedItems) {
    const percentChange = safeNumber(item.percentChange);
    if (isValidNumber(percentChange) && item.price1 > 0) {
      totalPercentChange += percentChange;
      validPercentCount++;
    }
  }

  const averageInflationRate = validPercentCount > 0
    ? roundTo(totalPercentChange / validPercentCount, 1)
    : 0;

  // Find biggest increase and decrease
  let biggestIncrease: ItemChange | null = null;
  let biggestDecrease: ItemChange | null = null;

  for (const item of matchedItems) {
    const itemChange: ItemChange = {
      item: item.item,
      price1: safeNumber(item.price1),
      price2: safeNumber(item.price2),
      difference: safeNumber(item.difference),
      percentChange: safeNumber(item.percentChange),
    };

    // Check for biggest increase
    if (itemChange.difference > 0) {
      if (!biggestIncrease || itemChange.difference > biggestIncrease.difference) {
        biggestIncrease = itemChange;
      }
    }

    // Check for biggest decrease
    if (itemChange.difference < 0) {
      if (!biggestDecrease || itemChange.difference < biggestDecrease.difference) {
        biggestDecrease = itemChange;
      }
    }
  }

  return {
    averageInflationRate,
    biggestIncrease,
    biggestDecrease,
    totalItemsCompared: matchedItems.length + unmatchedBill1.length + unmatchedBill2.length,
    matchedCount: matchedItems.length,
    unmatchedBill1Count: unmatchedBill1.length,
    unmatchedBill2Count: unmatchedBill2.length,
  };
}

/**
 * Format currency amount as string
 */
function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  return `$${absAmount.toFixed(2)}`;
}

/**
 * Format percentage as string
 */
function formatPercent(percent: number): string {
  const absPercent = Math.abs(percent);
  return `${absPercent.toFixed(1)}%`;
}

/**
 * Generate human-readable summary insights
 */
export function generateSummaryInsights(
  totalDifference: number,
  percentageChange: number,
  categorizedItems: CategorizedItems,
  metrics: ComparisonMetrics
): SummaryInsights {
  // Total change message
  let totalChangeMessage: string;
  const absDiff = Math.abs(totalDifference);
  const absPercent = Math.abs(percentageChange);

  if (totalDifference > 0.01) {
    totalChangeMessage = `Your total increased by ${formatCurrency(absDiff)} (${formatPercent(absPercent)})`;
  } else if (totalDifference < -0.01) {
    totalChangeMessage = `Your total decreased by ${formatCurrency(absDiff)} (${formatPercent(absPercent)}) - you saved money!`;
  } else {
    totalChangeMessage = `Your total stayed about the same`;
  }

  // Item changes summary
  const increasedCount = categorizedItems.increased.length;
  const decreasedCount = categorizedItems.decreased.length;
  const unchangedCount = categorizedItems.unchanged.length;

  let itemChangesSummary: string;
  if (increasedCount === 0 && decreasedCount === 0) {
    itemChangesSummary = `All ${unchangedCount} matched items stayed the same price`;
  } else {
    const parts: string[] = [];
    if (increasedCount > 0) {
      parts.push(`${increasedCount} item${increasedCount !== 1 ? 's' : ''} got more expensive`);
    }
    if (decreasedCount > 0) {
      parts.push(`${decreasedCount} got cheaper`);
    }
    itemChangesSummary = parts.join(', ');
  }

  // Average inflation message
  const avgInflation = metrics.averageInflationRate;
  let averageInflationMessage: string;
  if (Math.abs(avgInflation) < 0.5) {
    averageInflationMessage = `Average price change: 0% (stable)`;
  } else {
    averageInflationMessage = `Average inflation rate: ${avgInflation >= 0 ? '+' : ''}${avgInflation.toFixed(1)}%`;
  }

  // Biggest increase message
  let biggestIncreaseMessage = 'No price increases detected';
  if (metrics.biggestIncrease) {
    const inc = metrics.biggestIncrease;
    biggestIncreaseMessage = `Biggest increase: ${inc.item} (+${formatCurrency(inc.difference)}, +${formatPercent(inc.percentChange)})`;
  }

  // Biggest decrease message (best deal)
  let biggestDecreaseMessage = 'No price decreases detected';
  if (metrics.biggestDecrease) {
    const dec = metrics.biggestDecrease;
    biggestDecreaseMessage = `Best deal: ${dec.item} (-${formatCurrency(Math.abs(dec.difference))}, -${formatPercent(Math.abs(dec.percentChange))})`;
  }

  return {
    totalChangeMessage,
    itemChangesSummary,
    averageInflationMessage,
    biggestIncreaseMessage,
    biggestDecreaseMessage,
  };
}

/**
 * Validate and sanitize bill data from AI response
 */
export function validateBillData(bill: any): BillData {
  return {
    total: safeNumber(bill?.total, 0),
    date: bill?.date && typeof bill.date === 'string' ? bill.date : null,
    vendor: bill?.vendor && typeof bill.vendor === 'string' ? bill.vendor : null,
    items: Array.isArray(bill?.items)
      ? bill.items.map((item: any) => ({
          name: item?.name || 'Unknown Item',
          price: safeNumber(item?.price, 0),
          quantity: safeNumber(item?.quantity, 1),
        }))
      : [],
  };
}

/**
 * Validate and sanitize matched items from AI response
 */
export function validateMatchedItems(items: any[]): MatchedItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item: any) => {
    const price1 = safeNumber(item?.price1, 0);
    const price2 = safeNumber(item?.price2, 0);
    const difference = calculateDifference(price1, price2);
    const percentChange = calculatePercentChange(price1, price2);

    return {
      item: item?.item || item?.name || 'Unknown Item',
      price1: roundTo(price1, 2),
      price2: roundTo(price2, 2),
      difference,
      percentChange,
    };
  });
}

/**
 * Validate and sanitize unmatched items from AI response
 */
export function validateExtractedItems(items: any[]): ExtractedItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item: any) => ({
    name: item?.name || 'Unknown Item',
    price: roundTo(safeNumber(item?.price, 0), 2),
    quantity: safeNumber(item?.quantity, 1),
  }));
}

/**
 * Process raw AI response and build complete comparison result
 */
export function processAIResponse(rawResult: any): {
  bill1: BillData;
  bill2: BillData;
  matchedItems: MatchedItem[];
  unmatchedBill1: ExtractedItem[];
  unmatchedBill2: ExtractedItem[];
  totalDifference: number;
  percentageChange: number;
  metrics: ComparisonMetrics;
  categorizedItems: CategorizedItems;
  summaryInsights: SummaryInsights;
} {
  // Validate and sanitize bill data
  const bill1 = validateBillData(rawResult?.bill1);
  const bill2 = validateBillData(rawResult?.bill2);

  // Validate matched items and recalculate differences
  const matchedItems = validateMatchedItems(rawResult?.matchedItems);

  // Validate unmatched items
  const unmatchedBill1 = validateExtractedItems(rawResult?.unmatchedBill1);
  const unmatchedBill2 = validateExtractedItems(rawResult?.unmatchedBill2);

  // Calculate total difference
  const totalDifference = roundTo(bill2.total - bill1.total, 2);
  const percentageChange = calculatePercentChange(bill1.total, bill2.total);

  // Calculate metrics
  const metrics = calculateMetrics(matchedItems, unmatchedBill1, unmatchedBill2);

  // Categorize items
  const categorizedItems = categorizeItems(matchedItems);

  // Generate summary insights
  const summaryInsights = generateSummaryInsights(
    totalDifference,
    percentageChange,
    categorizedItems,
    metrics
  );

  return {
    bill1,
    bill2,
    matchedItems,
    unmatchedBill1,
    unmatchedBill2,
    totalDifference,
    percentageChange,
    metrics,
    categorizedItems,
    summaryInsights,
  };
}
