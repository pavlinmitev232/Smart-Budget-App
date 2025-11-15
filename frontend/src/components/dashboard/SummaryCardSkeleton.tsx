import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function SummaryCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Skeleton circle width={48} height={48} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                <Skeleton width={100} />
              </dt>
              <dd className="mt-1">
                <div className="text-lg font-semibold text-gray-900">
                  <Skeleton width={120} height={28} />
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
