import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { aiService } from '../services/ai.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { QuotaService } from '../features/subscriptions/quota.service';
import pool from '../config/database';

const router = Router();
const quotaService = new QuotaService();

/**
 * AI Health Check Endpoint
 * GET /api/ai/health
 *
 * Tests connectivity to OpenAI GPT and Google Gemini
 * Returns status of both providers
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await aiService.healthCheck();

    return sendSuccess(res, healthStatus, 200);
  } catch (error: any) {
    console.error('[AI HEALTH] Health check failed:', error);
    return sendError(
      res,
      'AI health check failed',
      'AI_HEALTH_CHECK_FAILED',
      500,
      { error: error.message }
    );
  }
});

/**
 * Transaction Analysis Endpoint
 * POST /api/ai/analyze
 *
 * Analyzes user transactions and provides AI-powered insights
 * Uses GPT-5.1 for Basic/Pro tiers, Gemini for Free tier
 */
router.post('/analyze', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { timeRange, startDate, endDate, includeIncome = true } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Check Quota
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const quotaCheck = await quotaService.checkQuota(userId, 'ai_insight');

    if (!quotaCheck.allowed) {
      return sendError(
        res,
        'AI insights quota exceeded. Please upgrade your plan or wait for quota reset.',
        'QUOTA_EXCEEDED',
        429,
        {
          quotaStatus: {
            remaining: quotaCheck.remaining,
            resetAt: quotaCheck.resetAt,
          },
        }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Get User Subscription Tier
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const userQuery = await pool.query(
      'SELECT subscription_tier FROM users WHERE id = $1',
      [userId]
    );
    const tier = userQuery.rows[0]?.subscription_tier || 'free';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Fetch Transactions
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Calculate date range
    let start: Date;
    let end: Date = new Date();

    if (timeRange === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default time ranges
      const ranges: Record<string, number> = {
        '30days': 30,
        '3months': 90,
        '6months': 180,
      };
      const days = ranges[timeRange] || 30;
      start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    // Fetch transactions
    const transactionsQuery = `
      SELECT type, amount, category, date, description, source_vendor
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date DESC
      LIMIT 1000
    `;

    const transactionsResult = await pool.query(transactionsQuery, [userId, start, end]);
    const transactions = transactionsResult.rows;

    if (transactions.length === 0) {
      return sendError(
        res,
        'No transactions found for the selected time range',
        'NO_TRANSACTIONS',
        404
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Fetch Income Profile (Optional)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let incomeProfile: any = null;
    try {
      const incomeResult = await pool.query(
        'SELECT primary_income_amount, primary_income_frequency, primary_income_source, additional_monthly_income, normalized_monthly_income FROM user_income_profile WHERE user_id = $1',
        [userId]
      );
      if (incomeResult.rows.length > 0) {
        const rawProfile = incomeResult.rows[0];
        // Parse numeric fields from database strings
        incomeProfile = {
          primary_income_amount: parseFloat(rawProfile.primary_income_amount),
          primary_income_frequency: rawProfile.primary_income_frequency,
          primary_income_source: rawProfile.primary_income_source,
          additional_monthly_income: parseFloat(rawProfile.additional_monthly_income),
          normalized_monthly_income: parseFloat(rawProfile.normalized_monthly_income)
        };
      }
    } catch (error) {
      console.log('[AI ANALYSIS] Income profile not found or error fetching:', error);
      // Continue without income profile
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Calculate Summary Statistics
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const actualIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = actualIncome - expenses;
    const savingsRate = actualIncome > 0 ? ((netBalance / actualIncome) * 100).toFixed(2) : '0';

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Build Analysis Prompt
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Build income-aware system prompt
    let systemPrompt = `You are a professional financial advisor analyzing a user's spending patterns.

Provide a comprehensive financial analysis with the following sections (use markdown formatting):

# SPENDING OVERVIEW
- Total income, expenses, net balance, and savings rate
- Overall trend assessment (improving/declining/stable)
${incomeProfile ? `- **Income Analysis**: Compare actual income vs expected monthly income and explain any variance` : ''}

# CATEGORY BREAKDOWN
- Top 5 spending categories with amounts
- Identify unusual or concerning patterns

# ANOMALY DETECTION
- Flag any outlier transactions (> 2x category average)
- Identify suspicious or irregular spending

# SAVINGS OPPORTUNITIES
- Specific, actionable recommendations to reduce expenses
- Prioritize high-impact changes

# BUDGET RECOMMENDATIONS
- Suggested spending limits for each major category
- Based on 50/30/20 rule (needs/wants/savings)
${incomeProfile ? `- **Income-Based Budget**: Apply 50/30/20 rule to expected monthly income of $${incomeProfile.normalized_monthly_income.toFixed(2)}` : ''}

${incomeProfile ? `# INCOME-BASED INSIGHTS
- **Living Within Means**: Is user living within their expected income? Calculate income surplus/shortfall.
- **Savings Rate Goal**: Recommend 20% savings rate. Current vs target.
- **50/30/20 Budget Allocation**:
  - Needs (50%): $${(incomeProfile.normalized_monthly_income * 0.5).toFixed(2)}
  - Wants (30%): $${(incomeProfile.normalized_monthly_income * 0.3).toFixed(2)}
  - Savings (20%): $${(incomeProfile.normalized_monthly_income * 0.2).toFixed(2)}
- **Emergency Fund**: Calculate 3-6 months of average expenses as emergency fund target.
` : ''}
# PERSONALIZED INSIGHTS
- User-specific observations about spending habits
- Behavioral patterns and trends

Keep the tone professional but friendly. Be specific with numbers and percentages.`;

    // Build income-aware transaction data
    let transactionData = `
TIME RANGE: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}
${incomeProfile ? `
USER INCOME PROFILE:
- Expected Monthly Income: $${incomeProfile.normalized_monthly_income.toFixed(2)}
- Primary Income Source: ${incomeProfile.primary_income_source}
- Primary Income: $${incomeProfile.primary_income_amount.toFixed(2)} (${incomeProfile.primary_income_frequency})
${incomeProfile.additional_monthly_income > 0 ? `- Additional Monthly Income: $${incomeProfile.additional_monthly_income.toFixed(2)}` : ''}
` : ''}
SUMMARY:
- Actual Income (from transactions): $${actualIncome.toFixed(2)}
- Total Expenses: $${expenses.toFixed(2)}
- Net Balance: $${netBalance.toFixed(2)}
- Savings Rate: ${savingsRate}%
- Transaction Count: ${transactions.length}
${incomeProfile ? `- Income Variance: $${(actualIncome - incomeProfile.normalized_monthly_income).toFixed(2)} (${((actualIncome - incomeProfile.normalized_monthly_income) / incomeProfile.normalized_monthly_income * 100).toFixed(1)}%)` : ''}

TOP SPENDING CATEGORIES:
${topCategories.map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}
${incomeProfile ? `
EMERGENCY FUND TARGET:
- Average Monthly Expenses: $${expenses.toFixed(2)}
- 3-Month Emergency Fund: $${(expenses * 3).toFixed(2)}
- 6-Month Emergency Fund: $${(expenses * 6).toFixed(2)}
` : ''}
TRANSACTIONS:
${transactions
  .slice(0, 100) // Limit to 100 most recent for token efficiency
  .map((t) => `${t.date} | ${t.type} | ${t.category} | $${t.amount} | ${t.description || 'N/A'}`)
  .join('\n')}
`.trim();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: Generate AI Analysis (Gemini primary, GPT fallback)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let insights: string;
    let tokensUsed: number;
    let cached: boolean;
    let provider: string;

    // Try Gemini first (all tiers)
    const aiInstance = aiService.getInstance();
    if (aiInstance.isGeminiAvailable()) {
      const result = await aiService.analyzeWithGemini(systemPrompt, transactionData);
      insights = result.insights;
      tokensUsed = result.tokensUsed;
      cached = result.cached;
      provider = 'gemini-pro';
    } else if (aiInstance.isGPTAvailable()) {
      // Fallback to GPT if Gemini unavailable
      const result = await aiService.analyzeWithGPT(systemPrompt, transactionData, userId);
      insights = result.insights;
      tokensUsed = result.tokensUsed;
      cached = result.cached;
      provider = 'gpt-4-turbo';
    } else {
      return sendError(
        res,
        'No AI providers available. Please contact support.',
        'NO_AI_AVAILABLE',
        503
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 7: Log Request to Quota System
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await quotaService.logRequest(userId, 'ai_insight', provider, tokensUsed);

    // Get updated quota status
    const updatedQuota = await quotaService.checkQuota(userId, 'ai_insight');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 8: Return Response
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log(`[AI ANALYSIS] Generated for user ${userId} using ${provider} (${tokensUsed} tokens)`);

    return sendSuccess(
      res,
      {
        insights,
        provider,
        tokensUsed,
        cached,
        generatedAt: new Date().toISOString(),
        quotaStatus: {
          remaining: updatedQuota.remaining,
          resetAt: updatedQuota.resetAt,
        },
      },
      200
    );
  } catch (error: any) {
    console.error('[AI ANALYSIS] Analysis failed:', error);
    return sendError(
      res,
      'Failed to generate AI analysis. Please try again later.',
      'ANALYSIS_FAILED',
      500,
      { error: error.message }
    );
  }
});

/**
 * AI Chat Endpoint
 * POST /api/ai/chat
 *
 * Context-aware chat interface for financial questions
 * Includes transaction summary for personalized responses
 */
router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { message, conversationHistory = [], deepThinking = false } = req.body;

    if (!message || typeof message !== 'string') {
      return sendError(res, 'Message is required', 'INVALID_INPUT', 400);
    }

    if (message.length > 500) {
      return sendError(res, 'Message must be 500 characters or less', 'MESSAGE_TOO_LONG', 400);
    }

    if (conversationHistory.length > 10) {
      return sendError(res, 'Maximum 10 messages per conversation', 'CONVERSATION_TOO_LONG', 400);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Check Quota
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const quotaCheck = await quotaService.checkQuota(userId, 'ai_insight');

    if (!quotaCheck.allowed) {
      return sendError(
        res,
        'Chat quota exceeded. Please upgrade your plan or wait for quota reset.',
        'QUOTA_EXCEEDED',
        429,
        {
          quotaStatus: {
            remaining: quotaCheck.remaining,
            resetAt: quotaCheck.resetAt,
          },
        }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Get User Subscription Tier
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const userQuery = await pool.query(
      'SELECT subscription_tier FROM users WHERE id = $1',
      [userId]
    );
    const tier = userQuery.rows[0]?.subscription_tier || 'free';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Fetch Recent Transactions for Context
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const transactionsQuery = `
      SELECT type, amount, category, date, description
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date DESC
      LIMIT 100
    `;

    const transactionsResult = await pool.query(transactionsQuery, [userId, thirtyDaysAgo, now]);
    const transactions = transactionsResult.rows;

    // Calculate summary statistics
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = income - expenses;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Build Context-Aware System Prompt
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const systemPrompt = `You are a professional financial advisor helping a user understand their finances.

CONTEXT (Last 30 days):
- Total Income: $${income.toFixed(2)}
- Total Expenses: $${expenses.toFixed(2)}
- Net Balance: $${netBalance.toFixed(2)}
- Transaction Count: ${transactions.length}
${topCategories.length > 0 ? `- Top Spending: ${topCategories.map(([cat, amt]) => `${cat} ($${amt.toFixed(2)})`).join(', ')}` : ''}

Provide personalized, actionable advice based on this context. Be conversational, concise (2-3 paragraphs max), and specific. Reference their actual numbers when relevant.`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Generate Chat Response (Tier-Based Routing)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let response: string;
    let tokensUsed: number;
    let provider: string;

    // Build messages array with conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    if (tier === 'free') {
      // Free tier: Use Gemini
      const fullPrompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
      const result = await aiService.analyzeWithGemini(systemPrompt, fullPrompt);
      response = result.insights;
      tokensUsed = result.tokensUsed;
      provider = 'gemini-pro';
    } else {
      // Basic/Pro tier: Use GPT with extended thinking if enabled
      if (!aiService.getInstance().isGPTAvailable()) {
        return sendError(res, 'GPT is not available', 'SERVICE_UNAVAILABLE', 503);
      }

      const openai = aiService.getInstance().getOpenAI();
      const chatResponse = await openai.chat.completions.create({
        model: deepThinking ? 'gpt-4' : 'gpt-4-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500, // Keep responses concise
      });

      response = chatResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      tokensUsed = chatResponse.usage?.total_tokens || 0;
      provider = deepThinking ? 'gpt-4' : 'gpt-4-turbo';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: Log Request to Quota System
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await quotaService.logRequest(userId, 'ai_insight', provider, tokensUsed);

    // Get updated quota status
    const updatedQuota = await quotaService.checkQuota(userId, 'ai_insight');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 7: Return Response
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log(`[AI CHAT] Response generated for user ${userId} using ${provider} (${tokensUsed} tokens)`);

    return sendSuccess(
      res,
      {
        response,
        provider,
        tokensUsed,
        generatedAt: new Date().toISOString(),
        quotaStatus: {
          remaining: updatedQuota.remaining,
          resetAt: updatedQuota.resetAt,
        },
      },
      200
    );
  } catch (error: any) {
    console.error('[AI CHAT] Chat failed:', error);
    return sendError(
      res,
      'Failed to generate chat response. Please try again later.',
      'CHAT_FAILED',
      500,
      { error: error.message }
    );
  }
});

export default router;
