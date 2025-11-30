import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import { showError, showSuccess } from '../utils/toast';
import api from '../services/api';

/**
 * Time range options for AI analysis
 */
type TimeRange = '30days' | '3months' | '6months' | 'custom';

/**
 * Cached insights structure
 */
interface CachedInsights {
  insights: string;
  timestamp: number;
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  provider: string;
  tokensUsed: number;
}

/**
 * Quota status from API
 */
interface QuotaStatus {
  remaining: number;
  resetAt: string;
}

/**
 * AI analysis response
 */
interface AnalysisResponse {
  insights: string;
  provider: string;
  tokensUsed: number;
  cached: boolean;
  generatedAt: string;
  quotaStatus: QuotaStatus;
}

/**
 * Props for AIInsightsModal
 */
interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTier?: 'free' | 'basic' | 'pro';
}

const CACHE_KEY = 'ai_insights_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Chat message interface
 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIInsightsModal({ isOpen, onClose, userTier = 'free' }: AIInsightsModalProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');

  // Insights tab state
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  // Chat tab state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [deepThinking, setDeepThinking] = useState(false);

  /**
   * Load cached insights on mount
   */
  useEffect(() => {
    if (isOpen) {
      loadCachedInsights();
    }
  }, [isOpen]);

  /**
   * Load cached insights from local storage
   */
  const loadCachedInsights = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedInsights = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (< 1 hour old)
        if (now - data.timestamp < CACHE_DURATION) {
          setInsights(data.insights);
          setTimeRange(data.timeRange);
          if (data.startDate) setStartDate(data.startDate);
          if (data.endDate) setEndDate(data.endDate);
          setProvider(data.provider);
          setTokensUsed(data.tokensUsed);
          setGeneratedAt(new Date(data.timestamp).toLocaleString());
        } else {
          // Cache expired, clear it
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load cached insights:', error);
    }
  };

  /**
   * Save insights to local storage
   */
  const saveToCache = (data: AnalysisResponse, range: TimeRange, start?: string, end?: string) => {
    try {
      const cacheData: CachedInsights = {
        insights: data.insights,
        timestamp: Date.now(),
        timeRange: range,
        startDate: start,
        endDate: end,
        provider: data.provider,
        tokensUsed: data.tokensUsed,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save insights to cache:', error);
    }
  };

  /**
   * Fetch AI insights from API
   */
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const payload: any = {
        timeRange,
        includeIncome: true,
      };

      if (timeRange === 'custom') {
        if (!startDate || !endDate) {
          showError('Please select both start and end dates for custom range');
          setLoading(false);
          return;
        }
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      const response = await api.post('/ai/analyze', payload);

      if (response.data.success) {
        const data: AnalysisResponse = response.data.data;
        setInsights(data.insights);
        setProvider(data.provider);
        setTokensUsed(data.tokensUsed);
        setGeneratedAt(new Date(data.generatedAt).toLocaleString());
        setQuotaStatus(response.data.quotaStatus);

        // Save to cache
        saveToCache(data, timeRange, payload.startDate, payload.endDate);

        showSuccess('AI insights generated successfully!');
      }
    } catch (error: any) {
      console.error('AI analysis failed:', error);

      if (error.response?.status === 429) {
        // Quota exceeded
        const quotaInfo = error.response.data.quotaStatus;
        showError(
          `Quota exceeded. ${quotaInfo?.remaining || 0} insights remaining. Resets at ${
            quotaInfo?.resetAt ? new Date(quotaInfo.resetAt).toLocaleString() : 'unknown'
          }`
        );
      } else if (error.response?.status === 404) {
        // No transactions found
        showError('No transactions found for the selected time range');
      } else {
        showError(error.response?.data?.error?.message || 'Failed to generate AI insights');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh analysis
   */
  const handleRefresh = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchInsights();
  };

  /**
   * Handle export to PDF (Pro tier only)
   */
  const handleExportToPDF = () => {
    if (userTier !== 'pro') {
      showError('Export to PDF is a Pro feature. Please upgrade your plan.');
      return;
    }

    if (!insights) {
      showError('No insights to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Financial Insights', margin, yPosition);
      yPosition += 10;

      // Metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${generatedAt}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Provider: ${provider}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Time Range: ${timeRange}`, margin, yPosition);
      yPosition += 10;

      // Content (simplified - strip markdown)
      doc.setFontSize(11);
      const lines = insights.split('\n');
      for (const line of lines) {
        // Remove markdown formatting (simple approach)
        const cleanLine = line
          .replace(/^#+\s/, '') // Remove headers
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '') // Remove italic
          .replace(/^-\s/, '• '); // Convert bullets

        if (cleanLine.trim()) {
          const splitLines = doc.splitTextToSize(cleanLine, maxWidth);
          for (const split of splitLines) {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(split, margin, yPosition);
            yPosition += 6;
          }
        } else {
          yPosition += 3; // Empty line spacing
        }
      }

      doc.save(`ai-insights-${new Date().toISOString().split('T')[0]}.pdf`);
      showSuccess('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      showError('Failed to export PDF');
    }
  };

  /**
   * Send chat message
   */
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    if (chatMessages.length >= 10) {
      showError('Maximum 10 messages per conversation. Please clear the conversation to continue.');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
        conversationHistory: chatMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        deepThinking,
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.data.response,
          timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
        setQuotaStatus(response.data.quotaStatus);
      }
    } catch (error: any) {
      console.error('Chat failed:', error);

      if (error.response?.status === 429) {
        showError('Chat quota exceeded. Please try again later.');
      } else {
        showError(error.response?.data?.error?.message || 'Failed to send message');
      }
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Handle quick prompt
   */
  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  /**
   * Clear conversation
   */
  const handleClearConversation = () => {
    setChatMessages([]);
    setChatInput('');
  };

  /**
   * Handle initial load - REMOVED auto-fetch
   * User must click "Refresh Analysis" to generate insights
   */
  // useEffect(() => {
  //   if (isOpen && !insights && activeTab === 'insights') {
  //     fetchInsights();
  //   }
  // }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header with Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center p-6 pb-0">
              <h2 className="text-2xl font-bold text-gray-900">AI Financial Advisor</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4">
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === 'insights'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Insights
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === 'chat'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 Chat
              </button>
            </div>
          </div>

          {/* Insights Tab: Time Range Selector */}
          {activeTab === 'insights' && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option value="30days">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {timeRange === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Refresh Analysis'}
              </button>
            </div>

            {/* Quota Status */}
            {quotaStatus && (
              <div className="mt-4 text-sm text-gray-600">
                📊 Insights remaining: {quotaStatus.remaining} | Resets: {new Date(quotaStatus.resetAt).toLocaleString()}
              </div>
            )}
          </div>
          )}

          {/* Insights Tab: Content */}
          {activeTab === 'insights' && (
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700 font-medium">Analyzing your transactions...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
                  </div>
                </div>
                {/* Skeleton loader */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                  </div>
                ))}
              </div>
            ) : insights ? (
              <div className="prose prose-indigo max-w-none">
                <ReactMarkdown>{insights}</ReactMarkdown>
                {generatedAt && (
                  <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    Generated: {generatedAt} | Provider: {provider} | Tokens: {tokensUsed}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No insights available. Click "Refresh Analysis" to generate insights.</p>
              </div>
            )}
          </div>
          )}

          {/* Chat Tab: Content */}
          {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Prompts */}
            {chatMessages.length === 0 && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick prompts:</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'How can I save more?',
                    "What's my biggest expense?",
                    'Am I overspending?',
                    'Give me budget tips',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-500 text-lg font-medium">Start a conversation</p>
                  <p className="text-gray-400 text-sm mt-2">Ask me anything about your finances</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {/* Controls */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deepThinking}
                      onChange={(e) => setDeepThinking(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Deep thinking (slower, more detailed)
                  </label>
                </div>
                <button
                  onClick={handleClearConversation}
                  disabled={chatMessages.length === 0}
                  className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear conversation
                </button>
              </div>

              {/* Input field */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me about your finances..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 resize-none"
                    rows={2}
                    disabled={chatLoading || chatMessages.length >= 10}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {chatInput.length}/500
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || chatLoading || chatMessages.length >= 10}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              {/* Message limit */}
              {chatMessages.length >= 8 && (
                <p className="text-xs text-gray-500 mt-2">
                  {10 - chatMessages.length} messages remaining in this conversation
                </p>
              )}

              {/* Quota status */}
              {quotaStatus && (
                <div className="mt-2 text-xs text-gray-600">
                  💬 Chat quota: {quotaStatus.remaining} remaining | Resets: {new Date(quotaStatus.resetAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Footer */}
          {activeTab === 'insights' && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleExportToPDF}
              disabled={!insights || userTier !== 'pro'}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={userTier !== 'pro' ? 'Pro feature - Upgrade to export' : 'Export insights to PDF'}
            >
              {userTier === 'pro' ? '📄 Export to PDF' : '🔒 Export to PDF (Pro)'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
            >
              Close
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
