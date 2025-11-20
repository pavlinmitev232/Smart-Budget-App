import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import api from '../../services/api';
import { Spinner } from '../Spinner';

// Colorblind-friendly palette
const COLORS = [
  '#0088FE', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Yellow
  '#FF8042', // Orange
  '#8884d8', // Purple
  '#82ca9d', // Green
  '#ffc658', // Gold
  '#ff7c7c', // Coral
  '#8dd1e1', // Sky Blue
  '#a4de6c', // Lime
];

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface ExpensePieChartProps {
  startDate: string;
  endDate: string;
  timePeriod: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as CategoryData;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900">{data.category}</p>
      <p className="text-sm text-gray-600 mt-1">
        Amount:{' '}
        <span className="font-medium">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.amount)}
        </span>
      </p>
      <p className="text-sm text-gray-600">
        Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
      </p>
      <p className="text-sm text-gray-600">
        Transactions: <span className="font-medium">{data.count}</span>
      </p>
    </div>
  );
};

export default function ExpensePieChart({
  startDate,
  endDate,
  timePeriod,
}: ExpensePieChartProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch category breakdown data
  const fetchCategoryData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/analytics/category-breakdown', {
        params: {
          type: 'expense',
          startDate,
          endDate,
        },
      });

      if (response.data.success) {
        const categories = response.data.data;

        // Convert amount strings to numbers and sort by amount descending, limit to top 10
        const sortedCategories = [...categories]
          .map((cat) => ({
            ...cat,
            amount: typeof cat.amount === 'string' ? parseFloat(cat.amount) : cat.amount,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);

        setCategoryData(sortedCategories);
      } else {
        setError('Failed to fetch category data');
      }
    } catch (err: any) {
      console.error('Error fetching category breakdown:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when date range changes
  useEffect(() => {
    fetchCategoryData();
  }, [startDate, endDate, timePeriod]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Expense Distribution
        </h3>
        <div className="flex justify-center items-center h-96">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            Loading expense distribution chart...
          </div>
          <Spinner className="h-12 w-12 text-indigo-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Expense Distribution
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (categoryData.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Expense Distribution
        </h3>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <svg
            className="h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No expenses to display
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Add transactions to see your expense distribution
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Expense Distribution
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={categoryData as any}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={(props: any) => `${props.percentage?.toFixed(0) || 0}%`}
            labelLine={false}
            animationDuration={800}
            animationBegin={0}
          >
            {categoryData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Optional: Summary text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {categoryData.length === 1
          ? '1 category'
          : `${categoryData.length} categories`}
        {categoryData.length >= 10 && ' (top 10 shown)'}
      </div>
    </div>
  );
}
