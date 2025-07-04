import { useState } from "react";
import { useGoCardlessStore } from '@/store/gocardless-store';
import { useInstitutions } from '@/hooks/bank/use-institutions';

export function SelectBankInstitutionForm() {
    const { setStep } = useGoCardlessStore();
    const { data: institutions = [] } = useInstitutions();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter institutions based on search term
    const filteredInstitutions = institutions.filter(institution => {
        const normalizeText = (text: string) =>
            text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics/accents

        const normalizedSearchTerm = normalizeText(searchTerm);
        const normalizedName = normalizeText(institution.name);
        const normalizedBic = normalizeText(institution.bic);

        return normalizedName.includes(normalizedSearchTerm) ||
            normalizedBic.includes(normalizedSearchTerm);
    });

    const handleBack = () => {
        setStep('select-country');
        setSearchTerm('');
    };

    const handleBankSelection = (institutionId: string) => {
        setStep('connecting');
        // TODO: Implement bank session
    };

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Your Bank</h2>

            {/* Search Filter */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search banks by name or BIC code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                        Showing {filteredInstitutions.length} of {institutions.length} banks
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInstitutions.map((institution) => (
                    <div
                        key={institution.id}
                        className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => handleBankSelection(institution.id)}
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

            {filteredInstitutions.length === 0 && searchTerm && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No banks found matching "{searchTerm}"</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                        Clear search
                    </button>
                </div>
            )}

            <button
                onClick={handleBack}
                className="mt-4 text-blue-600 hover:text-blue-800"
            >
                ← Back to Country Selection
            </button>
        </div>
    );
}