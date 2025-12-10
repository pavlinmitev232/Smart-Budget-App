import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  message: string;
  ai_suggestion: string | null;
  is_read: boolean;
  dismissed_at: string | null;
  created_at: string;
}

export default function AlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  useEffect(() => {
    console.log('[AlertBanner] Component mounted, fetching alerts...');
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    console.log('[AlertBanner] fetchAlerts() called');
    try {
      const response = await api.get('/alerts?unreadOnly=true');

      console.log('[AlertBanner] Response received:', response.data);
      console.log('[AlertBanner] Response status:', response.status);

      if (response.data.success) {
        const fetchedAlerts = response.data.data.alerts;
        console.log('[AlertBanner] Alerts fetched successfully:', fetchedAlerts);
        console.log('[AlertBanner] Number of alerts:', fetchedAlerts.length);

        setAlerts(fetchedAlerts);

        // Show toast for new critical alerts
        fetchedAlerts.forEach((alert: Alert) => {
          if (alert.severity === 'critical' && !alert.is_read) {
            console.log('[AlertBanner] Showing critical alert toast:', alert.message);
            toast.error(alert.message, {
              position: 'top-right',
              autoClose: 8000,
            });
          }
        });
      } else {
        console.log('[AlertBanner] Response success is false:', response.data);
      }
    } catch (error) {
      console.error('[AlertBanner] Error fetching alerts:', error);
    } finally {
      setLoading(false);
      console.log('[AlertBanner] Loading set to false');
    }
  };

  const dismissAlert = async (alertId: number) => {
    try {
      const response = await api.patch(`/alerts/${alertId}/dismiss`);

      if (response.data.success) {
        setAlerts(alerts.filter((alert) => alert.id !== alertId));
        toast.success('Alert dismissed');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);

      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const requestAISuggestion = async (alertId: number, confirmed: boolean = false) => {
    if (!confirmed) {
      setShowConfirm(alertId);
      return;
    }

    setShowConfirm(null);
    setLoadingAI(alertId);

    try {
      const response = await api.post(`/alerts/${alertId}/ai-suggestion`);

      if (response.data.success) {
        const suggestion = response.data.data.suggestion;
        const quotaStatus = response.data.data.quotaStatus;

        // Update alert with AI suggestion
        setAlerts(
          alerts.map((alert) =>
            alert.id === alertId ? { ...alert, ai_suggestion: suggestion } : alert
          )
        );

        if (quotaStatus && quotaStatus.limit !== Infinity) {
          toast.success(
            `AI suggestion generated! (${quotaStatus.used}/${quotaStatus.limit} requests used)`,
            { autoClose: 5000 }
          );
        } else {
          toast.success('AI suggestion generated!');
        }
      }
    } catch (error: any) {
      console.error('Error requesting AI suggestion:', error);

      if (error.response?.data?.error?.code === 'QUOTA_EXCEEDED') {
        toast.error('AI quota exceeded. Please upgrade your plan for more requests.', {
          autoClose: 6000,
        });
      } else {
        toast.error('Failed to generate AI suggestion');
      }
    } finally {
      setLoadingAI(null);
    }
  };

  console.log('[AlertBanner] Render - loading:', loading, 'alerts.length:', alerts.length);

  if (loading || alerts.length === 0) {
    console.log('[AlertBanner] Render - returning null (loading or no alerts)');
    return null;
  }

  console.log('[AlertBanner] Render - displaying alerts:', alerts);

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg p-4 shadow-md border-l-4 ${
            alert.severity === 'critical'
              ? 'bg-red-50 border-red-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}
          onClick={() => !alert.is_read && markAsRead(alert.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                {alert.severity === 'critical' ? (
                  <svg
                    className="h-5 w-5 text-red-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-yellow-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <p
                  className={`text-sm font-medium ${
                    alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
                  }`}
                >
                  {alert.message}
                </p>
              </div>

              {alert.ai_suggestion ? (
                <div className="mt-2 ml-7">
                  <p
                    className={`text-sm ${
                      alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
                    }`}
                  >
                    <strong>💡 AI Recommendation:</strong> {alert.ai_suggestion}
                  </p>
                </div>
              ) : (
                <div className="mt-2 ml-7">
                  {showConfirm === alert.id ? (
                    <div className="bg-white border border-gray-300 rounded-md p-3 shadow-sm">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Get AI-powered recommendation?</strong>
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        This will count towards your plan's AI request quota.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestAISuggestion(alert.id, true);
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(null);
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestAISuggestion(alert.id);
                      }}
                      disabled={loadingAI === alert.id}
                      className={`flex items-center text-xs font-medium ${
                        alert.severity === 'critical'
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-yellow-600 hover:text-yellow-800'
                      } disabled:opacity-50`}
                    >
                      {loadingAI === alert.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          Get AI Suggestion
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-2 ml-7 flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissAlert(alert.id);
                  }}
                  className={`text-xs font-medium ${
                    alert.severity === 'critical'
                      ? 'text-red-600 hover:text-red-800'
                      : 'text-yellow-600 hover:text-yellow-800'
                  }`}
                >
                  Dismiss
                </button>
                <span
                  className={`text-xs ${
                    alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                >
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissAlert(alert.id);
              }}
              className={`ml-4 flex-shrink-0 rounded-md p-1 ${
                alert.severity === 'critical'
                  ? 'text-red-400 hover:text-red-600 hover:bg-red-100'
                  : 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                alert.severity === 'critical'
                  ? 'focus:ring-red-500'
                  : 'focus:ring-yellow-500'
              }`}
              aria-label="Dismiss alert"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
