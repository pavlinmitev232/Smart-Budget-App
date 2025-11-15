interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  colorClass,
}: SummaryCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colorClass}`}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
              </dd>
              {subtitle && (
                <dd className="mt-1">
                  <div className="text-sm text-gray-600">{subtitle}</div>
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
