import React, { useState, useMemo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Store,
  ChevronUp,
  ChevronDown,
  Filter,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';

// Types
interface BillData {
  total: number;
  date: string | null;
  vendor: string | null;
  items: ExtractedItem[];
}

interface ExtractedItem {
  name: string;
  price: number;
  quantity?: number;
}

interface MatchedItem {
  item: string;
  price1: number;
  price2: number;
  difference: number;
  percentChange: number;
}

interface ItemChange {
  item: string;
  price1: number;
  price2: number;
  difference: number;
  percentChange: number;
}

interface ComparisonMetrics {
  averageInflationRate: number;
  biggestIncrease: ItemChange | null;
  biggestDecrease: ItemChange | null;
  totalItemsCompared: number;
  matchedCount: number;
  unmatchedBill1Count: number;
  unmatchedBill2Count: number;
}

interface CategorizedItems {
  increased: MatchedItem[];
  decreased: MatchedItem[];
  unchanged: MatchedItem[];
}

interface SummaryInsights {
  totalChangeMessage: string;
  itemChangesSummary: string;
  averageInflationMessage: string;
  biggestIncreaseMessage: string;
  biggestDecreaseMessage: string;
}

interface ComparisonResult {
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
  metrics: ComparisonMetrics;
  categorizedItems: CategorizedItems;
  summaryInsights: SummaryInsights;
}

interface ComparisonResultsProps {
  result: ComparisonResult | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onUploadNew?: () => void;
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return `$${Math.abs(amount).toFixed(2)}`;
};

const formatPercent = (percent: number): string => {
  return `${Math.abs(percent).toFixed(1)}%`;
};

// Sort options for matched items table
type SortField = 'item' | 'difference' | 'percentChange';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'increased' | 'decreased' | 'unchanged';

// Sub-components
const BillSummaryCard: React.FC<{ bill: BillData; label: string; billNumber: 1 | 2 }> = ({
  bill,
  label,
  billNumber,
}) => (
  <div className={`p-4 rounded-lg border ${billNumber === 1 ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
    <h4 className={`font-semibold mb-3 ${billNumber === 1 ? 'text-blue-700' : 'text-purple-700'}`}>
      {label}
    </h4>
    <div className="space-y-2">
      {bill.vendor && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Store className="w-4 h-4" />
          <span>{bill.vendor}</span>
        </div>
      )}
      {bill.date && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{bill.date}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <DollarSign className="w-5 h-5" />
        <span>{formatCurrency(bill.total)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <ShoppingCart className="w-4 h-4" />
        <span>{bill.items.length} items</span>
      </div>
    </div>
  </div>
);

const TotalComparisonCard: React.FC<{
  totalDifference: number;
  percentageChange: number;
}> = ({ totalDifference, percentageChange }) => {
  const isIncrease = totalDifference > 0.01;
  const isDecrease = totalDifference < -0.01;

  return (
    <div className={`p-6 rounded-xl border-2 ${
      isIncrease
        ? 'bg-red-50 border-red-300'
        : isDecrease
        ? 'bg-green-50 border-green-300'
        : 'bg-gray-50 border-gray-300'
    }`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Comparison</h3>
      <div className="flex items-center justify-center gap-4">
        <div className={`text-4xl font-bold ${
          isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-gray-600'
        }`}>
          {isIncrease ? '+' : isDecrease ? '-' : ''}{formatCurrency(totalDifference)}
        </div>
        {(isIncrease || isDecrease) && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            isIncrease ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {isIncrease ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {formatPercent(percentageChange)}
          </div>
        )}
      </div>
      <p className={`text-center mt-3 text-sm ${
        isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-gray-600'
      }`}>
        {isIncrease
          ? `You spent ${formatCurrency(totalDifference)} more this time`
          : isDecrease
          ? `You saved ${formatCurrency(Math.abs(totalDifference))}!`
          : 'Totals are about the same'
        }
      </p>
    </div>
  );
};

const MatchedItemsTable: React.FC<{
  matchedItems: MatchedItem[];
  categorizedItems: CategorizedItems;
}> = ({ matchedItems, categorizedItems }) => {
  const [sortField, setSortField] = useState<SortField>('difference');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState<FilterOption>('all');

  const filteredAndSortedItems = useMemo(() => {
    let items: MatchedItem[];

    switch (filter) {
      case 'increased':
        items = categorizedItems.increased;
        break;
      case 'decreased':
        items = categorizedItems.decreased;
        break;
      case 'unchanged':
        items = categorizedItems.unchanged;
        break;
      default:
        items = matchedItems;
    }

    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'item':
          comparison = a.item.localeCompare(b.item);
          break;
        case 'difference':
          comparison = Math.abs(a.difference) - Math.abs(b.difference);
          break;
        case 'percentChange':
          comparison = Math.abs(a.percentChange) - Math.abs(b.percentChange);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [matchedItems, categorizedItems, filter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'desc' ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  const getRowColor = (item: MatchedItem): string => {
    if (Math.abs(item.difference) <= 0.05) return 'bg-gray-50';
    if (item.difference > 0) return 'bg-red-50';
    return 'bg-green-50';
  };

  const getDifferenceColor = (diff: number): string => {
    if (Math.abs(diff) <= 0.05) return 'text-gray-600';
    if (diff > 0) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800">Matched Items</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All ({matchedItems.length})</option>
            <option value="increased">Increased ({categorizedItems.increased.length})</option>
            <option value="decreased">Decreased ({categorizedItems.decreased.length})</option>
            <option value="unchanged">Unchanged ({categorizedItems.unchanged.length})</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('item')}
              >
                <div className="flex items-center gap-1">
                  Item
                  <SortIcon field="item" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                Bill 1 Price
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                Bill 2 Price
              </th>
              <th
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('difference')}
              >
                <div className="flex items-center justify-end gap-1">
                  Difference
                  <SortIcon field="difference" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort('percentChange')}
              >
                <div className="flex items-center justify-end gap-1">
                  % Change
                  <SortIcon field="percentChange" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No items in this category
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item, index) => (
                <tr key={index} className={`${getRowColor(item)} border-t border-gray-100`}>
                  <td className="px-4 py-3 text-sm text-gray-800">{item.item}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(item.price1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(item.price2)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${getDifferenceColor(item.difference)}`}>
                    <div className="flex items-center justify-end gap-1">
                      {item.difference > 0.05 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : item.difference < -0.05 ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${getDifferenceColor(item.percentChange)}`}>
                    {item.percentChange > 0 ? '+' : ''}{formatPercent(item.percentChange)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UnmatchedItemsSection: React.FC<{
  unmatchedBill1: ExtractedItem[];
  unmatchedBill2: ExtractedItem[];
}> = ({ unmatchedBill1, unmatchedBill2 }) => {
  if (unmatchedBill1.length === 0 && unmatchedBill2.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {unmatchedBill1.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="font-semibold text-blue-700 mb-3">Only in Bill 1</h4>
          <ul className="space-y-2">
            {unmatchedBill1.map((item, index) => (
              <li key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="text-gray-600 font-medium">{formatCurrency(item.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {unmatchedBill2.length > 0 && (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <h4 className="font-semibold text-purple-700 mb-3">Only in Bill 2</h4>
          <ul className="space-y-2">
            {unmatchedBill2.map((item, index) => (
              <li key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="text-gray-600 font-medium">{formatCurrency(item.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AISummarySection: React.FC<{
  insights: string;
  summaryInsights: SummaryInsights;
  metrics: ComparisonMetrics;
}> = ({ insights, summaryInsights, metrics }) => (
  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="w-5 h-5 text-indigo-600" />
      <h3 className="text-lg font-semibold text-indigo-800">AI Summary</h3>
    </div>

    {/* Overall insights paragraph */}
    <p className="text-gray-700 mb-6">{insights}</p>

    {/* Key findings */}
    <div className="space-y-3">
      <h4 className="font-medium text-gray-800 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        Key Findings
      </h4>
      <ul className="space-y-2 ml-6">
        <li className="flex items-start gap-2 text-sm">
          <span className="text-indigo-500 mt-1">•</span>
          <span className="text-gray-700">{summaryInsights.averageInflationMessage}</span>
        </li>
        {metrics.biggestIncrease && (
          <li className="flex items-start gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{summaryInsights.biggestIncreaseMessage}</span>
          </li>
        )}
        {metrics.biggestDecrease && (
          <li className="flex items-start gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{summaryInsights.biggestDecreaseMessage}</span>
          </li>
        )}
        <li className="flex items-start gap-2 text-sm">
          <span className="text-indigo-500 mt-1">•</span>
          <span className="text-gray-700">{summaryInsights.itemChangesSummary}</span>
        </li>
      </ul>
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-8">
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">Analyzing your bills with AI...</h3>
      <p className="text-sm text-gray-500 text-center max-w-md">
        Our AI is extracting items, matching products, and calculating price differences.
        This may take 30-60 seconds.
      </p>
      <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  </div>
);

const ErrorState: React.FC<{
  error: string;
  onRetry?: () => void;
  onUploadNew?: () => void;
}> = ({ error, onRetry, onUploadNew }) => (
  <div className="bg-red-50 rounded-xl border border-red-200 p-8">
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-800">Analysis Failed</h3>
      <p className="text-sm text-red-600 text-center max-w-md">{error}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        {onUploadNew && (
          <button
            onClick={onUploadNew}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload New Images
          </button>
        )}
      </div>
    </div>
  </div>
);

// Main component
const ComparisonResults: React.FC<ComparisonResultsProps> = ({
  result,
  loading,
  error,
  onRetry,
  onUploadNew,
}) => {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} onUploadNew={onUploadNew} />;
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Bill Summaries - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BillSummaryCard bill={result.bill1} label="Bill 1 (First/Older)" billNumber={1} />
        <BillSummaryCard bill={result.bill2} label="Bill 2 (Second/Newer)" billNumber={2} />
      </div>

      {/* Total Comparison Card */}
      <TotalComparisonCard
        totalDifference={result.totalDifference}
        percentageChange={result.percentageChange}
      />

      {/* Matched Items Table */}
      {result.matchedItems.length > 0 && (
        <MatchedItemsTable
          matchedItems={result.matchedItems}
          categorizedItems={result.categorizedItems}
        />
      )}

      {/* Unmatched Items */}
      <UnmatchedItemsSection
        unmatchedBill1={result.unmatchedBill1}
        unmatchedBill2={result.unmatchedBill2}
      />

      {/* AI Summary */}
      <AISummarySection
        insights={result.insights}
        summaryInsights={result.summaryInsights}
        metrics={result.metrics}
      />
    </div>
  );
};

export default ComparisonResults;
