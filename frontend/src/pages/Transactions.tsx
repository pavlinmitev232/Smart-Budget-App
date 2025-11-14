export default function Transactions() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Transactions</h1>
          <p className="text-gray-600">
            Transaction management coming in Epic 3.
          </p>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800">Planned Features:</h3>
            <ul className="mt-2 text-sm text-blue-900 list-disc list-inside">
              <li>Add/Edit/Delete transactions</li>
              <li>Categorize expenses and income</li>
              <li>Filter and search transactions</li>
              <li>Pagination for large datasets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
