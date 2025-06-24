export function SpinnerBankLoading() {
    return (
        <div className="t   ext-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Connecting to your bank...</p>
            <p className="text-sm text-gray-500 mt-2">You will be redirected to your bank's authentication page</p>
        </div>
    );
}