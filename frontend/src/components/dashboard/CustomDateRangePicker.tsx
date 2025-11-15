import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, subMonths, startOfMonth, subYears, format } from 'date-fns';

interface CustomDateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export default function CustomDateRangePicker({
  isOpen,
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
}: CustomDateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate || subDays(new Date(), 30)
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEndDate || new Date()
  );
  const [error, setError] = useState<string | null>(null);

  // Reset dates when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate || subDays(new Date(), 30));
      setEndDate(initialEndDate || new Date());
      setError(null);
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  // Validate date range
  const validateRange = (start: Date | null, end: Date | null): boolean => {
    if (!start || !end) {
      setError('Please select both start and end dates');
      return false;
    }

    if (end < start) {
      setError('End date must be after start date');
      return false;
    }

    const today = new Date();
    if (end > today) {
      setError('Cannot select future dates');
      return false;
    }

    // Optional: Check max range of 1 year
    const oneYearAgo = subYears(end, 1);
    if (start < oneYearAgo) {
      setError('Date range cannot exceed 1 year');
      return false;
    }

    setError(null);
    return true;
  };

  // Handle quick shortcuts
  const handleShortcut = (type: 'last-7-days' | 'last-month' | 'last-year') => {
    const today = new Date();
    let newStartDate: Date;

    switch (type) {
      case 'last-7-days':
        newStartDate = subDays(today, 7);
        break;
      case 'last-month':
        newStartDate = startOfMonth(subMonths(today, 1));
        break;
      case 'last-year':
        newStartDate = subYears(today, 1);
        break;
    }

    setStartDate(newStartDate);
    setEndDate(today);
    setError(null);
  };

  // Handle apply button
  const handleApply = () => {
    if (validateRange(startDate, endDate) && startDate && endDate) {
      onApply(startDate, endDate);
      onClose();
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    setError(null);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // Validate on date changes
  useEffect(() => {
    if (startDate && endDate) {
      validateRange(startDate, endDate);
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        {/* Modal panel */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {/* Modal header */}
            <div className="mb-4">
              <h3
                className="text-lg font-semibold leading-6 text-gray-900"
                id="modal-title"
              >
                Select Custom Date Range
              </h3>
            </div>

            {/* Quick shortcuts */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Shortcuts
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleShortcut('last-7-days')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleShortcut('last-month')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Last Month
                </button>
                <button
                  onClick={() => handleShortcut('last-year')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Last Year
                </button>
              </div>
            </div>

            {/* Date pickers */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Start date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  wrapperClassName="w-full"
                  calendarClassName="shadow-lg"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  wrapperClassName="w-full"
                  calendarClassName="shadow-lg"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>

            {/* Selected range preview */}
            {startDate && endDate && !error && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                <p className="text-sm text-indigo-800">
                  <span className="font-medium">Selected range:</span>{' '}
                  {format(startDate, 'MMM d, yyyy')} -{' '}
                  {format(endDate, 'MMM d, yyyy')}
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={!startDate || !endDate || !!error}
              className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto transition-colors ${
                !startDate || !endDate || !!error
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              }`}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
