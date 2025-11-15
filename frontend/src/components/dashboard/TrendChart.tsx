import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { differenceInDays, format, parseISO } from 'date-fns';
import api from '../../services/api';
import { Spinner } from '../Spinner';

interface TrendData {
  period: string;
  income: number;
  expenses: number;
  periodLabel: string; // Formatted label for display
}

interface TrendChartProps {
  startDate: string;
  endDate: string;
  timePeriod: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as TrendData;
  const income = parseFloat(payload.find((p: any) => p.dataKey === 'income')?.value || '0');
  const expenses = parseFloat(payload.find((p: any) => p.dataKey === 'expenses')?.value || '0');
  const netBalance = income - expenses;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900 mb-2">{data.periodLabel}</p>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          Income:{' '}
          <span className="font-medium text-green-600">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(income)}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Expenses:{' '}
          <span className="font-medium text-red-600">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(expenses)}
          </span>
        </p>
        <p className="text-sm text-gray-600 pt-1 border-t">
          Net:{' '}
          <span
            className={`font-medium ${
              netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(netBalance)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default function TrendChart({
  startDate,
  endDate,
  timePeriod,
}: TrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  // Calculate groupBy based on date range
  const calculateGroupBy = (start: string, end: string): 'day' | 'week' | 'month' => {
    const days = differenceInDays(parseISO(end), parseISO(start));
    if (days <= 31) return 'day';
    if (days <= 90) return 'week';
    return 'month';
  };

  // Format period label for display
  const formatPeriodLabel = (period: string, groupByType: 'day' | 'week' | 'month'): string => {
    try {
      const date = parseISO(period);
      if (groupByType === 'day') return format(date, 'MMM d');
      if (groupByType === 'week') return `Week of ${format(date, 'MMM d')}`;
      return format(date, 'MMMM yyyy');
    } catch {
      return period;
    }
  };

  // Fetch trends data
  const fetchTrendData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const calculatedGroupBy = calculateGroupBy(startDate, endDate);
      setGroupBy(calculatedGroupBy);

      const response = await api.get('/analytics/trends', {
        params: {
          groupBy: calculatedGroupBy,
          startDate,
          endDate,
        },
      });

      if (response.data.success) {
        const trends = response.data.data.map((trend: any) => ({
          period: trend.period,
          income: typeof trend.income === 'string' ? parseFloat(trend.income) : trend.income,
          expenses: typeof trend.expenses === 'string' ? parseFloat(trend.expenses) : trend.expenses,
          periodLabel: formatPeriodLabel(trend.period, calculatedGroupBy),
        }));

        setTrendData(trends);
      } else {
        setError('Failed to fetch trend data');
      }
    } catch (err: any) {
      console.error('Error fetching trends:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when date range changes
  useEffect(() => {
    fetchTrendData();
  }, [startDate, endDate, timePeriod]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Income vs Expenses
        </h3>
        <div className="flex justify-center items-center h-96">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            Loading income vs expenses trend chart...
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
          Income vs Expenses
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (trendData.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Income vs Expenses
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
            No transactions in this period
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Add transactions to see your income and expense trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Income vs Expenses
        </h3>
        <span className="text-sm text-gray-500">
          Grouped by {groupBy}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="periodLabel"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar
            dataKey="income"
            fill="#10b981"
            name="Income"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
          />
          <Bar
            dataKey="expenses"
            fill="#ef4444"
            name="Expenses"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {trendData.length} {groupBy === 'day' ? 'days' : groupBy === 'week' ? 'weeks' : 'months'} shown
      </div>
    </div>
  );
}
