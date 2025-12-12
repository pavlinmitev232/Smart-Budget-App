/**
 * Bill Comparison Types
 */

export interface BillComparison {
  id: number;
  userId: number;
  title: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultSummary: string | null;
  resultData: ComparisonResult | null;
  createdAt: string;
  completedAt: string | null;
  images?: BillImage[];
}

export interface BillImage {
  id: number;
  userId: number;
  comparisonId: number | null;
  imageData: string; // base64 encoded
  fileName: string;
  fileSize: number;
  mimeType: string;
  imageOrder: 1 | 2 | null;
  uploadedAt: string;
}

export interface ComparisonResult {
  bill1: BillData;
  bill2: BillData;
  matchedItems: MatchedItem[];
  unmatchedBill1: ExtractedItem[];
  unmatchedBill2: ExtractedItem[];
  totalDifference: number;
  percentageChange: number;
  insights: string;
  tokensUsed: number;
  provider: string;
  // Enhanced metrics from Story 12.3
  metrics: ComparisonMetrics;
  categorizedItems: CategorizedItems;
  summaryInsights: SummaryInsights;
}

export interface ComparisonMetrics {
  averageInflationRate: number;
  biggestIncrease: ItemChange | null;
  biggestDecrease: ItemChange | null;
  totalItemsCompared: number;
  matchedCount: number;
  unmatchedBill1Count: number;
  unmatchedBill2Count: number;
}

export interface ItemChange {
  item: string;
  price1: number;
  price2: number;
  difference: number;
  percentChange: number;
}

export interface CategorizedItems {
  increased: MatchedItem[];
  decreased: MatchedItem[];
  unchanged: MatchedItem[];
}

export interface SummaryInsights {
  totalChangeMessage: string;
  itemChangesSummary: string;
  averageInflationMessage: string;
  biggestIncreaseMessage: string;
  biggestDecreaseMessage: string;
}

export interface BillData {
  total: number;
  date: string | null;
  vendor: string | null;
  items: ExtractedItem[];
}

export interface ExtractedItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface MatchedItem {
  item: string;
  price1: number;
  price2: number;
  difference: number;
  percentChange: number;
}

// Legacy interface for backward compatibility
export interface ComparisonItem {
  name: string;
  oldPrice: number | null;
  newPrice: number | null;
  difference: number;
  percentageChange: number;
  isNew: boolean;
  isRemoved: boolean;
}

export interface UploadImageRequest {
  imageData: string; // base64 encoded
  fileName: string;
  mimeType: string;
}

export interface CreateComparisonRequest {
  title?: string;
  imageIds: number[];
}

// Tier limits for comparisons
export const COMPARISON_LIMITS = {
  free: 1,      // 1 comparison per day
  basic: 10,    // 10 comparisons per day
  pro: -1,      // Unlimited (-1)
} as const;

// Image constraints
export const IMAGE_CONSTRAINTS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  minDimension: 200,
  maxDimension: 4000,
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['.jpg', '.jpeg', '.png'],
} as const;
