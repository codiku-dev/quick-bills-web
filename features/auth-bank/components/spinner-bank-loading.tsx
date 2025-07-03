export function SpinnerBankLoading() {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-lg">Connecting to banks...</p>
      <p className="text-sm text-gray-500 mt-2">This might take a few seconds</p>
    </div>
  );
}
