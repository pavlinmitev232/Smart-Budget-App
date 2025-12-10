import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type IncomeFrequency = 'hourly' | 'weekly' | 'biweekly' | 'monthly' | 'annual';

interface IncomeProfileData {
  primaryIncomeAmount: number;
  primaryIncomeFrequency: IncomeFrequency;
  primaryIncomeSource: string;
  additionalMonthlyIncome: number;
  normalizedMonthlyIncome: number;
}

/**
 * Normalize income to monthly amount (client-side calculation for preview)
 */
function normalizeIncomeToMonthly(amount: number, frequency: IncomeFrequency): number {
  const conversionRates: Record<IncomeFrequency, number> = {
    hourly: 40 * 4.33,
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    annual: 1 / 12
  };
  return Math.round(amount * conversionRates[frequency] * 100) / 100;
}

export default function IncomeProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [primaryIncomeAmount, setPrimaryIncomeAmount] = useState<string>('');
  const [primaryIncomeFrequency, setPrimaryIncomeFrequency] = useState<IncomeFrequency>('monthly');
  const [primaryIncomeSource, setPrimaryIncomeSource] = useState('');
  const [additionalMonthlyIncome, setAdditionalMonthlyIncome] = useState<string>('0');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing profile
  useEffect(() => {
    fetchIncomeProfile();
  }, []);

  const fetchIncomeProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/income', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const profile: IncomeProfileData = response.data.data;
        setPrimaryIncomeAmount(profile.primaryIncomeAmount.toString());
        setPrimaryIncomeFrequency(profile.primaryIncomeFrequency);
        setPrimaryIncomeSource(profile.primaryIncomeSource || '');
        setAdditionalMonthlyIncome(profile.additionalMonthlyIncome.toString());
        setHasProfile(true);
      }
    } catch (error: any) {
      if (error.response?.data?.error?.code !== 'INCOME_PROFILE_NOT_FOUND') {
        console.error('Error fetching income profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate normalized monthly income for preview
  const calculateMonthlyIncome = (): number => {
    const amount = parseFloat(primaryIncomeAmount) || 0;
    const additional = parseFloat(additionalMonthlyIncome) || 0;

    if (amount <= 0) return 0;

    const normalized = normalizeIncomeToMonthly(amount, primaryIncomeFrequency);
    return normalized + additional;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(primaryIncomeAmount);
    if (!primaryIncomeAmount || amount <= 0) {
      newErrors.primaryIncomeAmount = 'Income amount must be greater than 0';
    }

    if (primaryIncomeSource && (primaryIncomeSource.length < 2 || primaryIncomeSource.length > 100)) {
      newErrors.primaryIncomeSource = 'Income source must be 2-100 characters';
    }

    const additional = parseFloat(additionalMonthlyIncome);
    if (additional < 0) {
      newErrors.additionalMonthlyIncome = 'Additional income cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/user/income',
        {
          primaryIncomeAmount: parseFloat(primaryIncomeAmount),
          primaryIncomeFrequency,
          primaryIncomeSource: primaryIncomeSource || null,
          additionalMonthlyIncome: parseFloat(additionalMonthlyIncome) || 0
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setHasProfile(true);
        alert('✓ Income profile saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving income profile:', error);
      alert('Failed to save income profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/user/income', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setPrimaryIncomeAmount('');
      setPrimaryIncomeFrequency('monthly');
      setPrimaryIncomeSource('');
      setAdditionalMonthlyIncome('0');
      setHasProfile(false);
      setShowDeleteConfirm(false);
      alert('✓ Income profile deleted successfully');
    } catch (error: any) {
      console.error('Error deleting income profile:', error);
      alert('Failed to delete income profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const monthlyIncome = calculateMonthlyIncome();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Income Profile</h1>
          <p className="text-gray-600 mt-2">
            Income helps AI provide personalized budget recommendations
          </p>
        </div>

        {/* Privacy Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            🔒 <strong>Privacy:</strong> Your income is private and never shared
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            {/* Primary Income Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Income Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={primaryIncomeAmount}
                  onChange={(e) => setPrimaryIncomeAmount(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.primaryIncomeAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.primaryIncomeAmount && (
                <p className="text-sm text-red-600 mt-1">{errors.primaryIncomeAmount}</p>
              )}
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={primaryIncomeFrequency}
                onChange={(e) => setPrimaryIncomeFrequency(e.target.value as IncomeFrequency)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="hourly">Hourly</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Income Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Income Source (Optional)
              </label>
              <input
                type="text"
                value={primaryIncomeSource}
                onChange={(e) => setPrimaryIncomeSource(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.primaryIncomeSource ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Acme Corp, Self-employed, etc."
                maxLength={100}
              />
              {errors.primaryIncomeSource && (
                <p className="text-sm text-red-600 mt-1">{errors.primaryIncomeSource}</p>
              )}
            </div>

            {/* Additional Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Monthly Income (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-2">Freelance, investments, side gigs, etc.</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={additionalMonthlyIncome}
                  onChange={(e) => setAdditionalMonthlyIncome(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.additionalMonthlyIncome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.additionalMonthlyIncome && (
                <p className="text-sm text-red-600 mt-1">{errors.additionalMonthlyIncome}</p>
              )}
            </div>

            {/* Calculated Monthly Income */}
            {monthlyIncome > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">Your Monthly Income:</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  ${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : hasProfile ? 'Update Income Profile' : 'Save Income Profile'}
              </button>

              {hasProfile && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Income Profile?</h3>
              <p className="text-gray-600 mb-6">
                This will remove your income information. AI budget recommendations will be less personalized.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
