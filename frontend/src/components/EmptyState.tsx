interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}

/**
 * Reusable EmptyState component for showing friendly empty states
 * Used when lists, dashboards, or filtered results have no data
 */
export default function EmptyState({
  icon,
  title,
  message,
  buttonText,
  onButtonClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center transition-opacity duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {icon && (
        <div className="text-gray-400 mb-4" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>

      {/* Message */}
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>

      {/* CTA Button */}
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          aria-label={buttonText}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
