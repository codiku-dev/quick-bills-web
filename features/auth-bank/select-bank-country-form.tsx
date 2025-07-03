import { useGoCardlessStore } from '@/store/gocardless-store';
import { useInstitutions } from '@/hooks/bank/use-institutions';

export function SelectBankCountryForm() {
    const { step, setStep } = useGoCardlessStore();
    const { isLoading: institutionsLoading } = useInstitutions();

    const handleContinue = () => {
        setStep('select-bank');
    };

    if (step !== 'select-country') {
        return null;
    }

    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Your Country</h2>
            <select
                defaultValue="FR"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="ES">Spain</option>
                <option value="IT">Italy</option>
                <option value="NL">Netherlands</option>
                <option value="BE">Belgium</option>
                <option value="AT">Austria</option>
                <option value="FI">Finland</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="DK">Denmark</option>
                <option value="PL">Poland</option>
                <option value="CZ">Czech Republic</option>
                <option value="HU">Hungary</option>
                <option value="RO">Romania</option>
                <option value="BG">Bulgaria</option>
                <option value="HR">Croatia</option>
                <option value="SI">Slovenia</option>
                <option value="SK">Slovakia</option>
                <option value="EE">Estonia</option>
                <option value="LV">Latvia</option>
                <option value="LT">Lithuania</option>
                <option value="LU">Luxembourg</option>
                <option value="MT">Malta</option>
                <option value="CY">Cyprus</option>
                <option value="IE">Ireland</option>
                <option value="PT">Portugal</option>
                <option value="GR">Greece</option>
            </select>
            <button
                onClick={handleContinue}
                disabled={institutionsLoading}
                className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {institutionsLoading ? 'Loading Banks...' : 'Continue'}
            </button>
        </div>
    );
}