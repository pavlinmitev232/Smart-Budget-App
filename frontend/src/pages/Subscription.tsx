import { useState, useEffect } from 'react';
import api from '../services/api';
import { showError, showSuccess } from '../utils/toast';

interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string | null;
}

interface SubscriptionData {
  tier: 'free' | 'basic' | 'pro';
  tierName: string;
  price: number;
  memberSince: string;
  quotaStatus: {
    aiInsights: QuotaStatus;
    billComparisons: QuotaStatus;
  };
  features: {
    aiInsightsPerDay: number;
    billComparisonsPerDay: number;
    maxGoals: number;
    transactionHistoryMonths: number;
    exportData: boolean;
  };
  canUpgrade: boolean;
}

interface TierInfo {
  name: string;
  price: number;
  features: {
    aiInsights: string;
    billComparisons: string;
    goals: string;
    history: string;
    export: string;
  };
}

const TIER_INFO: Record<'free' | 'basic' | 'pro', TierInfo> = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      aiInsights: '5/day',
      billComparisons: '1/day',
      goals: '3 max',
      history: '6 months',
      export: '❌',
    },
  },
  basic: {
    name: 'Basic',
    price: 10,
    features: {
      aiInsights: '50/day',
      billComparisons: '10/day',
      goals: '10 max',
      history: '2 years',
      export: '✅ CSV',
    },
  },
  pro: {
    name: 'Pro',
    price: 30,
    features: {
      aiInsights: 'Unlimited',
      billComparisons: 'Unlimited',
      goals: 'Unlimited',
      history: 'Unlimited',
      export: '✅ CSV+PDF',
    },
  },
};

export default function Subscription() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro' | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/subscription');
      if (response.data.success) {
        setSubscriptionData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      showError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = (tier: 'basic' | 'pro') => {
    setSelectedTier(tier);
    setShowUpgradeModal(true);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess('Thanks! We\'ll notify you when upgrades are available.');
    setShowUpgradeModal(false);
    setWaitlistEmail('');
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load subscription data</p>
        </div>
      </div>
    );
  }

  const aiPercentage = subscriptionData.features.aiInsightsPerDay === -1
    ? 0
    : (subscriptionData.quotaStatus.aiInsights.used / subscriptionData.features.aiInsightsPerDay) * 100;

  const billPercentage = subscriptionData.features.billComparisonsPerDay === -1
    ? 0
    : (subscriptionData.quotaStatus.billComparisons.used / subscriptionData.features.billComparisonsPerDay) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Subscription</h1>
          <p className="mt-2 text-gray-600">Manage your plan and view usage statistics</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              <div className="mt-2">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {subscriptionData.tierName} {subscriptionData.price > 0 ? `- $${subscriptionData.price}/mo` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Usage Today</h3>

            {/* AI Insights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">AI Insights</span>
                <span className="text-sm text-gray-600">
                  {subscriptionData.quotaStatus.aiInsights.used}/{subscriptionData.features.aiInsightsPerDay === -1 ? '∞' : subscriptionData.features.aiInsightsPerDay}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor(aiPercentage)}`}
                  style={{ width: `${Math.min(aiPercentage, 100)}%` }}
                ></div>
              </div>
              {subscriptionData.quotaStatus.aiInsights.remaining === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Quota exceeded. Resets at {new Date(subscriptionData.quotaStatus.aiInsights.resetAt!).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Bill Comparisons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Bill Comparisons</span>
                <span className="text-sm text-gray-600">
                  {subscriptionData.quotaStatus.billComparisons.used}/{subscriptionData.features.billComparisonsPerDay === -1 ? '∞' : subscriptionData.features.billComparisonsPerDay}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor(billPercentage)}`}
                  style={{ width: `${Math.min(billPercentage, 100)}%` }}
                ></div>
              </div>
              {subscriptionData.quotaStatus.billComparisons.remaining === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Quota exceeded. Resets at {new Date(subscriptionData.quotaStatus.billComparisons.resetAt!).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Other Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <span className="text-sm font-medium text-gray-700">Active Goals</span>
                <p className="text-sm text-gray-600">
                  {subscriptionData.features.maxGoals === -1 ? 'Unlimited' : `${subscriptionData.features.maxGoals} max`}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Transaction History</span>
                <p className="text-sm text-gray-600">
                  {subscriptionData.features.transactionHistoryMonths === -1 ? 'Unlimited' : `${subscriptionData.features.transactionHistoryMonths} months`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Comparison - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Compare Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Free
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">AI Insights</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.free.features.aiInsights}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.basic.features.aiInsights}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.pro.features.aiInsights}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bill Comparisons</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.free.features.billComparisons}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.basic.features.billComparisons}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.pro.features.billComparisons}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Goals</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.free.features.goals}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.basic.features.goals}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.pro.features.goals}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">History</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.free.features.history}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.basic.features.history}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.pro.features.history}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Export</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.free.features.export}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.basic.features.export}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{TIER_INFO.pro.features.export}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Price</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">$0</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">$10/mo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">$30/mo</td>
                </tr>
                <tr>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-center">
                    {subscriptionData.tier === 'free' ? (
                      <button
                        disabled
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {subscriptionData.tier === 'basic' ? (
                      <button
                        disabled
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgradeClick('basic')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Upgrade to Basic
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {subscriptionData.tier === 'pro' ? (
                      <button
                        disabled
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgradeClick('pro')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier Comparison - Mobile */}
        <div className="md:hidden space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Compare Plans</h2>
          {(['free', 'basic', 'pro'] as const).map((tier) => (
            <div
              key={tier}
              className={`bg-white rounded-lg shadow-md p-6 ${
                subscriptionData.tier === tier ? 'ring-2 ring-indigo-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{TIER_INFO[tier].name}</h3>
                <span className="text-xl font-bold text-gray-900">
                  ${TIER_INFO[tier].price}{TIER_INFO[tier].price > 0 ? '/mo' : ''}
                </span>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="text-sm text-gray-600">• AI Insights: {TIER_INFO[tier].features.aiInsights}</li>
                <li className="text-sm text-gray-600">• Bill Comparisons: {TIER_INFO[tier].features.billComparisons}</li>
                <li className="text-sm text-gray-600">• Goals: {TIER_INFO[tier].features.goals}</li>
                <li className="text-sm text-gray-600">• History: {TIER_INFO[tier].features.history}</li>
                <li className="text-sm text-gray-600">• Export: {TIER_INFO[tier].features.export}</li>
              </ul>
              {subscriptionData.tier === tier ? (
                <button
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : tier !== 'free' ? (
                <button
                  onClick={() => handleUpgradeClick(tier)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upgrade to {TIER_INFO[tier].name}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedTier && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUpgradeModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Payment Integration Coming Soon!
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      We're working on enabling paid subscriptions. Join our waitlist to be notified when upgrades to {TIER_INFO[selectedTier].name} are available.
                    </p>
                  </div>
                  <form onSubmit={handleWaitlistSubmit} className="mt-4">
                    <input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                      >
                        Join Waitlist
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUpgradeModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
