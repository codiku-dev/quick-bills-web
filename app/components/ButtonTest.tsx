
export function ButtonTest(p: { onClick: () => void }) {
    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Debug Tools</h3>
            <button
                onClick={p.onClick}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
            >
                Test GoCardless Connection
            </button>
            <p className="text-xs text-gray-500 mt-2">
                Use this to verify your GoCardless credentials are working correctly.
            </p>
        </div>
    );
}