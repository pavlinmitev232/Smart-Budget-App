import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function TransactionListSkeleton() {
  const rows = 8; // Show 8 skeleton rows

  return (
    <>
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(rows)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton width={100} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton width={70} height={24} borderRadius={12} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton width={120} />
                </td>
                <td className="px-6 py-4">
                  <Skeleton width={200} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Skeleton width={80} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Skeleton width={100} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <Skeleton width={120} height={16} />
                <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
              </div>
              <Skeleton width={60} height={24} borderRadius={12} />
            </div>
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <div className="flex justify-between items-center">
              <Skeleton width={80} height={24} />
              <div className="flex gap-2">
                <Skeleton width={50} height={28} borderRadius={4} />
                <Skeleton width={60} height={28} borderRadius={4} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
