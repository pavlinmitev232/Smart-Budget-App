import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SummaryCard from '../components/dashboard/SummaryCard';
import TimePeriodSelector from '../components/dashboard/TimePeriodSelector';
import CustomDateRangePicker from '../components/dashboard/CustomDateRangePicker';
import ExpensePieChart from '../components/dashboard/ExpensePieChart';
import TrendChart from '../components/dashboard/TrendChart';
import CategoryBarChart from '../components/dashboard/CategoryBarChart';
import api from '../services/api';
import { startOfMonth, subDays, subMonths, startOfYear, format, parse, isValid } from 'date-fns';

interface SummaryData {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for custom date range modal
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // Load persisted period from localStorage or URL params
  const [timePeriod, setTimePeriod] = useState(() => {
    // Check URL params first
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');

    if (urlStartDate && urlEndDate) {
      const start = parse(urlStartDate, 'yyyy-MM-dd', new Date());
      const end = parse(urlEndDate, 'yyyy-MM-dd', new Date());

      if (isValid(start) && isValid(end)) {
        setCustomStartDate(start);
        setCustomEndDate(end);
        return 'custom';
      }
    }

    // Otherwise check localStorage
    const storedPeriod = localStorage.getItem('dashboard-time-period');
    if (storedPeriod === 'custom') {
      const storedStart = localStorage.getItem('dashboard-custom-start');
      const storedEnd = localStorage.getItem('dashboard-custom-end');

      if (storedStart && storedEnd) {
        const start = parse(storedStart, 'yyyy-MM-dd', new Date());
        const end = parse(storedEnd, 'yyyy-MM-dd', new Date());

        if (isValid(start) && isValid(end)) {
          setCustomStartDate(start);
          setCustomEndDate(end);
          return 'custom';
        }
      }
    }

    return storedPeriod || 'current-month';
  });

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on selected period
  const getDateRange = (period: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (period) {
      case 'current-month':
        startDate = startOfMonth(today);
        break;
      case 'last-30-days':
        startDate = subDays(today, 30);
        break;
      case 'last-3-months':
        startDate = subMonths(today, 3);
        break;
      case 'this-year':
        startDate = startOfYear(today);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          // Fallback to current month if custom dates not set
          startDate = startOfMonth(today);
        }
        break;
      default:
        startDate = startOfMonth(today);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  };

  // Generate custom range label
  const getCustomRangeLabel = () => {
    if (customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMM d')} - ${format(
        customEndDate,
        'MMM d, yyyy'
      )}`;
    }
    return 'Custom Range...';
  };

  // Handle opening custom range modal
  const handleOpenCustomRange = () => {
    setIsCustomRangeModalOpen(true);
  };

  // Handle applying custom range
  const handleApplyCustomRange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setTimePeriod('custom');

    // Save to localStorage
    localStorage.setItem('dashboard-time-period', 'custom');
    localStorage.setItem('dashboard-custom-start', format(startDate, 'yyyy-MM-dd'));
    localStorage.setItem('dashboard-custom-end', format(endDate, 'yyyy-MM-dd'));

    // Update URL params
    setSearchParams({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
  };

  // Fetch summary data
  const fetchSummaryData = async (period: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange(period);
      const response = await api.get('/analytics/summary', {
        params: { startDate, endDate },
      });

      if (response.data.success) {
        setSummaryData(response.data.data);
      } else {
        setError('Failed to fetch summary data');
      }
    } catch (err: any) {
      console.error('Error fetching summary:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when period changes
  useEffect(() => {
    fetchSummaryData(timePeriod);
  }, [timePeriod]);

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setTimePeriod(newPeriod);
    localStorage.setItem('dashboard-time-period', newPeriod);

    // Clear URL params when switching away from custom
    if (newPeriod !== 'custom') {
      setSearchParams({});
      // Clear custom date state
      setCustomStartDate(null);
      setCustomEndDate(null);
      localStorage.removeItem('dashboard-custom-start');
      localStorage.removeItem('dashboard-custom-end');
    }
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  // Determine net balance color
  const getNetBalanceColor = (balance: string) => {
    const value = parseFloat(balance);
    if (value > 0) return 'bg-green-100 text-green-600';
    if (value < 0) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/transactions')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Transactions
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <TimePeriodSelector
            selectedPeriod={timePeriod}
            onChange={handlePeriodChange}
            onCustomRangeClick={handleOpenCustomRange}
            customRangeLabel={timePeriod === 'custom' ? getCustomRangeLabel() : undefined}
          />
        </div>

        {/* Custom Date Range Picker Modal */}
        <CustomDateRangePicker
          isOpen={isCustomRangeModalOpen}
          onClose={() => setIsCustomRangeModalOpen(false)}
          onApply={handleApplyCustomRange}
          initialStartDate={customStartDate || undefined}
          initialEndDate={customEndDate || undefined}
        />

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && summaryData && (
          <>
            {summaryData.transactionCount === 0 ? (
              /* Empty State */
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No transactions yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first transaction
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/transactions')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            ) : (
              /* Summary Cards Grid */
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Income Card */}
                <SummaryCard
                  title="Total Income"
                  value={formatCurrency(summaryData.totalIncome)}
                  icon={
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  }
                  colorClass="bg-green-100 text-green-600"
                />

                {/* Total Expenses Card */}
                <SummaryCard
                  title="Total Expenses"
                  value={formatCurrency(summaryData.totalExpenses)}
                  icon={
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  }
                  colorClass="bg-red-100 text-red-600"
                />

                {/* Net Balance Card */}
                <SummaryCard
                  title="Net Balance"
                  value={formatCurrency(summaryData.netBalance)}
                  icon={
                    <svg
                      className={`h-6 w-6 ${
                        parseFloat(summaryData.netBalance) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  colorClass={getNetBalanceColor(summaryData.netBalance)}
                />

                {/* Transaction Count Card */}
                <SummaryCard
                  title="Transactions"
                  value={summaryData.transactionCount.toString()}
                  subtitle={`${summaryData.period.startDate} to ${summaryData.period.endDate}`}
                  icon={
                    <svg
                      className="h-6 w-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  }
                  colorClass="bg-indigo-100 text-indigo-600"
                />
              </div>
            )}

            {/* Charts Section */}
            {summaryData && summaryData.transactionCount > 0 && (
              <div className="mt-8 space-y-6">
                {/* Income vs Expenses Trend Chart - Full Width */}
                <TrendChart
                  startDate={summaryData.period.startDate}
                  endDate={summaryData.period.endDate}
                  timePeriod={timePeriod}
                />

                {/* Category Charts Grid - Side by Side on Desktop */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Expense Distribution Pie Chart */}
                  <ExpensePieChart
                    startDate={summaryData.period.startDate}
                    endDate={summaryData.period.endDate}
                    timePeriod={timePeriod}
                  />

                  {/* Top Spending Categories Bar Chart */}
                  <CategoryBarChart
                    startDate={summaryData.period.startDate}
                    endDate={summaryData.period.endDate}
                    timePeriod={timePeriod}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
