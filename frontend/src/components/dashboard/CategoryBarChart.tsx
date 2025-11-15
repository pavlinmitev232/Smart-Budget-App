import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '../../services/api';
import { Spinner } from '../Spinner';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface CategoryBarChartProps {
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
      <p className="font-semibold text-gray-900 mb-2">{data.category}</p>
      <p className="text-sm text-gray-600">
        Amount:{' '}
        <span className="font-medium text-indigo-600">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.amount)}
        </span>
      </p>
      <p className="text-sm text-gray-600">
        Transactions: <span className="font-medium">{data.count}</span>
      </p>
      <p className="text-sm text-gray-600">
        Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
      </p>
    </div>
  );
};

export default function CategoryBarChart({
  startDate,
  endDate,
  timePeriod,
}: CategoryBarChartProps) {
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

        // Sort by amount descending and limit to top 10
        const topCategories = [...categories]
          .map((cat) => ({
            ...cat,
            amount: typeof cat.amount === 'string' ? parseFloat(cat.amount) : cat.amount,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);

        setCategoryData(topCategories);
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
          Top Spending Categories
        </h3>
        <div className="flex justify-center items-center h-96">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            Loading category spending chart...
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
          Top Spending Categories
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
          Top Spending Categories
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No expense data for this period
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Add expense transactions to see category breakdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Top Spending Categories
      </h3>

      <ResponsiveContainer width="100%" height={Math.max(categoryData.length * 50, 300)}>
        <BarChart
          data={categoryData}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(value)
            }
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            animationDuration={800}
            label={{
              position: 'right',
              fill: '#4b5563',
              fontSize: 11,
              formatter: (value: number) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(value),
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {categoryData.length === 1
          ? '1 category'
          : `Top ${categoryData.length} ${categoryData.length >= 10 ? '(max 10)' : ''} categories`}
      </div>
    </div>
  );
}
