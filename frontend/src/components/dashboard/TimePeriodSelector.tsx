interface TimePeriodSelectorProps {
  selectedPeriod: string;
  onChange: (period: string) => void;
  onCustomRangeClick: () => void;
  customRangeLabel?: string;
}

export default function TimePeriodSelector({
  selectedPeriod,
  onChange,
  onCustomRangeClick,
  customRangeLabel,
}: TimePeriodSelectorProps) {
  const periods = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'this-year', label: 'This Year' },
  ];

  const handlePeriodClick = (value: string) => {
    if (value === 'custom') {
      onCustomRangeClick();
    } else {
      onChange(value);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handlePeriodClick(period.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedPeriod === period.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {period.label}
        </button>
      ))}

      {/* Custom Range Button */}
      <button
        onClick={onCustomRangeClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          selectedPeriod === 'custom'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {selectedPeriod === 'custom' && customRangeLabel
          ? customRangeLabel
          : 'Custom Range...'}
      </button>
    </div>
  );
}
