/**
 * Subscription Tier Configuration
 *
 * Defines the three subscription tiers for the Smart Budget App:
 * - Free: Basic features with limited AI usage (Gemini 3 Pro)
 * - Basic: Enhanced features with GPT-5.1 and increased limits
 * - Pro: Unlimited features with GPT-5.1 and priority support
 */

export type SubscriptionTierName = 'free' | 'basic' | 'pro';

export interface TierFeatures {
  aiInsightsPerDay: number; // -1 = unlimited
  billComparisonsPerDay: number; // -1 = unlimited
  maxGoals: number; // -1 = unlimited
  transactionHistoryMonths: number; // -1 = unlimited
  exportData: boolean | string; // false, 'csv', or true (CSV + PDF)
  aiProvider: 'gemini-3-pro' | 'gpt-5.1';
  prioritySupport?: boolean;
}

export interface SubscriptionTier {
  name: string;
  price: number; // USD per month
  features: TierFeatures;
}

/**
 * Subscription tier definitions
 *
 * These tiers control feature access and AI usage limits throughout the application.
 * Update these values to adjust tier capabilities.
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTierName, SubscriptionTier> = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      aiInsightsPerDay: 5,
      billComparisonsPerDay: 1,
      maxGoals: 3,
      transactionHistoryMonths: 6,
      exportData: false,
      aiProvider: 'gemini-3-pro',
    },
  },
  basic: {
    name: 'Basic',
    price: 10, // USD per month
    features: {
      aiInsightsPerDay: 50,
      billComparisonsPerDay: 10,
      maxGoals: 10,
      transactionHistoryMonths: 24,
      exportData: 'csv', // CSV only
      aiProvider: 'gpt-5.1',
    },
  },
  pro: {
    name: 'Pro',
    price: 30, // USD per month
    features: {
      aiInsightsPerDay: -1, // Unlimited
      billComparisonsPerDay: -1, // Unlimited
      maxGoals: -1, // Unlimited
      transactionHistoryMonths: -1, // Unlimited
      exportData: true, // CSV + PDF
      aiProvider: 'gpt-5.1',
      prioritySupport: true,
    },
  },
} as const;

/**
 * Get subscription tier configuration by name
 *
 * @param tierName - The name of the subscription tier
 * @returns The tier configuration object
 * @throws Error if tier name is invalid
 */
export function getTierConfig(tierName: SubscriptionTierName): SubscriptionTier {
  const tier = SUBSCRIPTION_TIERS[tierName];
  if (!tier) {
    throw new Error(`Invalid subscription tier: ${tierName}`);
  }
  return tier;
}

/**
 * Check if a feature is available for a given tier
 *
 * @param tierName - The subscription tier name
 * @param feature - The feature key to check
 * @returns true if the feature is available, false otherwise
 */
export function hasFeature(
  tierName: SubscriptionTierName,
  feature: keyof TierFeatures
): boolean {
  const tier = getTierConfig(tierName);
  const featureValue = tier.features[feature];

  // Handle boolean features
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }

  // Handle numeric limits (-1 means unlimited, >0 means available)
  if (typeof featureValue === 'number') {
    return featureValue !== 0;
  }

  // Handle string features (e.g., exportData: 'csv')
  if (typeof featureValue === 'string') {
    return featureValue.length > 0;
  }

  return false;
}

/**
 * Get the daily limit for a specific request type
 *
 * @param tierName - The subscription tier name
 * @param requestType - The type of request ('ai_insight' or 'bill_comparison')
 * @returns The daily limit, or -1 for unlimited
 */
export function getDailyLimit(
  tierName: SubscriptionTierName,
  requestType: 'ai_insight' | 'bill_comparison'
): number {
  const tier = getTierConfig(tierName);

  switch (requestType) {
    case 'ai_insight':
      return tier.features.aiInsightsPerDay;
    case 'bill_comparison':
      return tier.features.billComparisonsPerDay;
    default:
      return 0;
  }
}

/**
 * Valid subscription tier values (for validation)
 */
export const VALID_TIERS: SubscriptionTierName[] = ['free', 'basic', 'pro'];

/**
 * Default tier for new users
 */
export const DEFAULT_TIER: SubscriptionTierName = 'free';
