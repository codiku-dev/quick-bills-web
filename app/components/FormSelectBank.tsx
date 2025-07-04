import { Institution } from "@/types/gocardless-types";

export function FormSelectBank(p: {
    inputSearchTerm: string,
    onChangeInputSearchTerm: (searchTerm: string) => void,
    filteredInstitutions: Institution[],
    institutions: Institution[],
    onClickInstitution: (institutionId: string) => void,
    onClickBack: () => void
}) {

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Your Bank</h2>

            {/* Search Filter */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search banks by name or BIC code..."
                    value={p.inputSearchTerm}
                    onChange={(e) => p.onChangeInputSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {p.inputSearchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                        Showing {p.filteredInstitutions.length} of {p.institutions.length} banks
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {p.filteredInstitutions.map((institution) => (
                    <div
                        key={institution.id}
                        className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => p.onClickInstitution(institution.id)}
                    >
                        <div className="flex items-center space-x-3">
                            {institution.logo && (
                                <img
                                    src={institution.logo}
                                    alt={institution.name}
                                    className="w-12 h-12 object-contain"
                                />
                            )}
                            <div>
                                <h3 className="font-medium">{institution.name}</h3>
                                <p className="text-sm text-gray-500">{institution.bic}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {p.filteredInstitutions.length === 0 && p.inputSearchTerm && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No banks found matching "{p.inputSearchTerm}"</p>
                    <button
                        onClick={() => p.onChangeInputSearchTerm('')}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                        Clear search
                    </button>
                </div>
            )}

            <button
                onClick={p.onClickBack}
                className="mt-4 text-blue-600 hover:text-blue-800"
            >
                ← Back to Country Selection
            </button>
        </div>
    );
}