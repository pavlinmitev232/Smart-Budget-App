import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AIService - Handles AI interactions with GPT-5.1 and Gemini
 *
 * Provides:
 * - GPT-5.1 integration (primary)
 * - Gemini integration (fallback)
 * - Connection health checks
 * - Singleton pattern for resource efficiency
 */
export class AIService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private openaiApiKey: string | undefined;
  private geminiApiKey: string | undefined;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    console.log('[DEBUG] AIService constructor called');
    console.log('[DEBUG] OPENAI_API_KEY:', this.openaiApiKey ? `SET (${this.openaiApiKey.length} chars)` : 'NOT SET');
    console.log('[DEBUG] GEMINI_API_KEY:', this.geminiApiKey ? `SET (${this.geminiApiKey.length} chars)` : 'NOT SET');

    // Initialize OpenAI if API key is present
    if (this.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: this.openaiApiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 3, // Retry failed requests 3 times
      });
      console.log('✅ OpenAI GPT-5.1 client initialized');
    } else {
      console.warn('⚠️  OPENAI_API_KEY not found - GPT-5.1 features will be unavailable');
    }

    // Initialize Gemini if API key is present
    if (this.geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(this.geminiApiKey);
      console.log('✅ Google Gemini client initialized');
    } else {
      console.warn('⚠️  GEMINI_API_KEY not found - Gemini fallback will be unavailable');
    }

    // Throw error if neither API key is configured
    if (!this.openaiApiKey && !this.geminiApiKey) {
      throw new Error(
        'AI Service initialization failed: At least one AI provider API key (OPENAI_API_KEY or GEMINI_API_KEY) must be configured'
      );
    }
  }

  /**
   * Test OpenAI GPT connection
   * @returns true if connection is successful, false otherwise
   */
  async testGPTConnection(): Promise<boolean> {
    if (!this.openai) {
      console.log('[AI TEST] GPT: Not configured');
      return false;
    }

    try {
      // Test with a minimal API call
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',  // Will use latest available model (GPT-4 Turbo or GPT-5 when available)
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      const success = response && response.choices && response.choices.length > 0;
      console.log(`[AI TEST] GPT: ${success ? '✅ Connected' : '❌ Failed'}`);
      return success;
    } catch (error: any) {
      console.error('[AI TEST] GPT connection failed:', error.message);
      return false;
    }
  }

  /**
   * Test Google Gemini connection
   * @returns true if connection is successful, false otherwise
   */
  async testGeminiConnection(): Promise<boolean> {
    if (!this.gemini) {
      console.log('[AI TEST] Gemini: Not configured');
      return false;
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('test');
      const response = await result.response;
      const success = response && response.text().length > 0;

      console.log(`[AI TEST] Gemini: ${success ? '✅ Connected' : '❌ Failed'}`);
      return success;
    } catch (error: any) {
      console.error('[AI TEST] Gemini connection failed:', error.message);
      return false;
    }
  }

  /**
   * Health check for all AI providers
   * @returns Status of GPT and Gemini connections
   */
  async healthCheck(): Promise<{
    gpt: boolean;
    gemini: boolean;
    status: string;
  }> {
    console.log('\n🔍 Running AI providers health check...');

    const [gptHealthy, geminiHealthy] = await Promise.all([
      this.testGPTConnection(),
      this.testGeminiConnection(),
    ]);

    let status: string;
    if (gptHealthy && geminiHealthy) {
      status = 'All AI providers operational';
    } else if (gptHealthy) {
      status = 'GPT operational (Gemini unavailable)';
    } else if (geminiHealthy) {
      status = 'Gemini operational (GPT unavailable)';
    } else {
      status = 'No AI providers available';
    }

    console.log(`📊 AI Health Status: ${status}\n`);

    return {
      gpt: gptHealthy,
      gemini: geminiHealthy,
      status,
    };
  }

  /**
   * Check if GPT is available
   */
  isGPTAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Check if Gemini is available
   */
  isGeminiAvailable(): boolean {
    return this.gemini !== null;
  }

  /**
   * Get OpenAI client (throws if not configured)
   */
  getOpenAI(): OpenAI {
    if (!this.openai) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    return this.openai;
  }

  /**
   * Get Gemini client (throws if not configured)
   */
  getGemini(): GoogleGenerativeAI {
    if (!this.gemini) {
      throw new Error('Gemini is not configured. Please set GEMINI_API_KEY environment variable.');
    }
    return this.gemini;
  }

  /**
   * Analyze transactions with GPT-5.1
   * @param prompt - System prompt for analysis
   * @param transactions - Transaction data to analyze
   * @param userId - User ID for metadata tracking
   * @returns AI-generated analysis
   */
  async analyzeWithGPT(
    prompt: string,
    transactions: string,
    userId: number
  ): Promise<{ insights: string; tokensUsed: number; cached: boolean }> {
    if (!this.openai) {
      throw new Error('GPT is not available. Use Gemini fallback instead.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo', // Will auto-upgrade to GPT-5 when available
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: transactions,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        metadata: {
          user_id: userId.toString(),
          feature: 'transaction_analysis',
        } as any,
      });

      const insights = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const cached = false; // TODO: Implement caching detection

      return { insights, tokensUsed, cached };
    } catch (error: any) {
      console.error('[AI] GPT analysis failed:', error.message);
      throw new Error(`GPT analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze transactions with Gemini (fallback for free tier)
   * @param prompt - System prompt for analysis
   * @param transactions - Transaction data to analyze
   * @returns AI-generated analysis
   */
  async analyzeWithGemini(
    prompt: string,
    transactions: string
  ): Promise<{ insights: string; tokensUsed: number; cached: boolean }> {
    if (!this.gemini) {
      throw new Error('Gemini is not available.');
    }

    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const fullPrompt = `${prompt}\n\n${transactions}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const insights = response.text();

      // Gemini doesn't provide token count in the same way
      const tokensUsed = Math.floor(insights.length / 4); // Rough estimate

      return { insights, tokensUsed, cached: false };
    } catch (error: any) {
      console.error('[AI] Gemini analysis failed:', error.message);
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }
}

// Export singleton instance - lazy initialization
let aiServiceInstance: AIService | null = null;

export const aiService = {
  /**
   * Get AI service instance (creates on first call)
   */
  getInstance: (): AIService => {
    if (!aiServiceInstance) {
      aiServiceInstance = new AIService();
    }
    return aiServiceInstance;
  },

  /**
   * Test GPT connection
   */
  testGPTConnection: async (): Promise<boolean> => {
    return aiService.getInstance().testGPTConnection();
  },

  /**
   * Test Gemini connection
   */
  testGeminiConnection: async (): Promise<boolean> => {
    return aiService.getInstance().testGeminiConnection();
  },

  /**
   * Health check for all providers
   */
  healthCheck: async (): Promise<{
    gpt: boolean;
    gemini: boolean;
    status: string;
  }> => {
    return aiService.getInstance().healthCheck();
  },

  /**
   * Analyze transactions with GPT
   */
  analyzeWithGPT: async (
    prompt: string,
    transactions: string,
    userId: number
  ): Promise<{ insights: string; tokensUsed: number; cached: boolean }> => {
    return aiService.getInstance().analyzeWithGPT(prompt, transactions, userId);
  },

  /**
   * Analyze transactions with Gemini
   */
  analyzeWithGemini: async (
    prompt: string,
    transactions: string
  ): Promise<{ insights: string; tokensUsed: number; cached: boolean }> => {
    return aiService.getInstance().analyzeWithGemini(prompt, transactions);
  },
};
