'use client';

import { useState, useEffect } from 'react';
import { getInstitutions, initializeSession, getTransactionsFromRequisition, testRequisitionExists, testGoCardlessConnection, getRequisitionIdFromReference } from '@/app/actions/gocardless-actions';

type Institution = {
    id: string;
    name: string;
    bic: string;
    transaction_total_days: string;
    countries: string[];
    logo: string;
    max_access_valid_for_days: string;
};

type Transaction = {
    entryReference?: string;
    internalTransactionId?: string;
    debtorName?: string;
    debtorAccount?: {
        iban: string;
    };
    transactionAmount: {
        currency: string;
        amount: string;
    };
    bookingDate: string;
    valueDate: string;
    remittanceInformationUnstructured?: string;
    remittanceInformationUnstructuredArray?: string[];
    bankTransactionCode?: string;
};

type Account = {
    id: string;
    iban?: string;
    currency: string;
    ownerName?: string;
    product?: string;
    cashAccountType?: string;
    status?: string;
    bic?: string;
    linkedAccounts?: string;
    usage?: string;
    details?: string;
    balances?: {
        balanceAmount: {
            amount: string;
            currency: string;
        };
        balanceType: string;
        lastChangeDateTime: string;
        referenceDate: string;
    }[];
};

type Balance = {
    balanceAmount: {
        amount: string;
        currency: string;
    };
    balanceType: string;
    lastChangeDateTime: string;
    referenceDate: string;
};

export function GoCardlessLink() {
    console.log('🔄 [CLIENT] GoCardlessLink component rendered');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('FR');
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [account, setAccount] = useState<Account | null>(null);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<'select-country' | 'select-bank' | 'connecting' | 'connected'>('select-country');

    useEffect(() => {
        console.log('🚀 [CLIENT] Component mounted, fetching institutions...');
        fetchInstitutions();
    }, [selectedCountry]);

    const fetchInstitutions = async () => {
        console.log(`🔄 [CLIENT] Fetching institutions for country: ${selectedCountry}`);
        try {
            setLoading(true);
            setSearchTerm(''); // Reset search when changing country
            const data = await getInstitutions(selectedCountry);
            console.log(`✅ [CLIENT] Found ${data.length} institutions`);
            setInstitutions(data);
            setStep('select-bank');
        } catch (error) {
            console.error('❌ [CLIENT] Error fetching institutions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBankSelection = async (institutionId: string) => {
        console.log(`🔄 [CLIENT] Bank selected: ${institutionId}`);
        setSelectedInstitution(institutionId);
        setStep('connecting');
        setLoading(true);

        try {
            console.log('📤 [CLIENT] Initializing GoCardless session...');
            const session = await initializeSession(institutionId);
            console.log('✅ [CLIENT] Session initialized successfully');
            console.log('🔗 [CLIENT] Redirect link:', session.link);

            // Redirect to GoCardless authentication
            window.location.href = session.link;
        } catch (error) {
            console.error('❌ [CLIENT] Error initializing session:', error);
            setStep('select-bank');
            setLoading(false);
        }
    };

    const handleCallback = async (referenceId: string) => {
        console.log(`🔄 [CLIENT] Handling callback with reference ID: ${referenceId}`);
        setLoading(true);

        try {
            // First, get the actual requisition ID from the reference ID
            console.log('🔍 [CLIENT] Getting requisition ID from reference...');
            const requisitionId = await getRequisitionIdFromReference(referenceId);

            if (!requisitionId) {
                throw new Error('Requisition not found for this reference. The bank connection may have failed or expired.');
            }

            console.log('✅ [CLIENT] Found requisition ID:', requisitionId);

            // Test if the requisition exists
            console.log('🔍 [CLIENT] Testing if requisition exists...');
            const requisitionTest = await testRequisitionExists(requisitionId);

            if (!requisitionTest) {
                throw new Error('Requisition not found. The bank connection may have failed or expired.');
            }

            console.log('✅ [CLIENT] Requisition exists, fetching transactions...');
            const data = await getTransactionsFromRequisition(requisitionId);
            console.log('✅ [CLIENT] Data received from server');
            console.log('📊 [CLIENT] Number of transactions:', data.transactions.length);

            setTransactions(data.transactions);
            setAccount(data.account);
            setBalances(data.balances || []);
            setStep('connected');
            console.log('💾 [CLIENT] Data saved to state');
        } catch (error: any) {
            console.error('❌ [CLIENT] Error fetching transactions:', error);

            // Show user-friendly error message
            const errorMessage = error.message || 'Unknown error occurred';
            if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                alert('Bank connection failed. The connection may have expired or was not completed properly. Please try connecting again.');
            } else {
                alert(`Error connecting to bank: ${errorMessage}`);
            }

            setStep('select-bank');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        console.log('🧪 [CLIENT] Testing GoCardless connection...');
        try {
            const result = await testGoCardlessConnection();
            if (result.success) {
                alert(`✅ GoCardless connection successful!\nFound ${result.institutionsCount} institutions\nSandbox available: ${result.hasSandbox ? 'Yes' : 'No'}`);
            } else {
                alert(`❌ GoCardless connection failed: ${result.error}`);
            }
        } catch (error) {
            alert(`❌ Test failed: ${error}`);
        }
    };

    // Check for requisition ID in URL params (for callback handling)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        // The requisition ID should be passed as a query parameter
        // According to GoCardless docs, it's typically passed as 'ref' or directly as the requisition ID
        const requisitionId = urlParams.get('ref') || urlParams.get('requisition_id') || urlParams.get('id');
        if (requisitionId) {
            console.log('🔄 [CLIENT] Found requisition ID in URL, handling callback...');
            handleCallback(requisitionId);
        }
    }, []);

    console.log('🔄 [CLIENT] Render - Step:', step);
    console.log('🔄 [CLIENT] Render - Loading state:', loading);
    console.log('🔄 [CLIENT] Render - Institutions count:', institutions.length);
    console.log('🔄 [CLIENT] Render - Transactions count:', transactions.length);

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

    const getTransactionDescription = (transaction: Transaction): string => {
        if (transaction.debtorName) {
            return transaction.debtorName;
        } else if (transaction.remittanceInformationUnstructured) {
            return transaction.remittanceInformationUnstructured;
        } else if (transaction.remittanceInformationUnstructuredArray && transaction.remittanceInformationUnstructuredArray.length > 0) {
            return transaction.remittanceInformationUnstructuredArray[0];
        } else {
            return 'Transaction';
        }
    };

    const getTransactionDetails = (transaction: Transaction): string[] => {
        const details: string[] = [];

        if (transaction.remittanceInformationUnstructuredArray && transaction.remittanceInformationUnstructuredArray.length > 1) {
            details.push(...transaction.remittanceInformationUnstructuredArray.slice(1));
        }

        if (transaction.bankTransactionCode) {
            details.push(`Code: ${transaction.bankTransactionCode}`);
        }

        return details;
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>

            {/* Test Connection Button */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Debug Tools</h3>
                <button
                    onClick={handleTestConnection}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
                >
                    Test GoCardless Connection
                </button>
                <p className="text-xs text-gray-500 mt-2">
                    Use this to verify your GoCardless credentials are working correctly.
                </p>
            </div>

            {step === 'select-country' && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Select Your Country</h2>
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
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
                        onClick={fetchInstitutions}
                        disabled={loading}
                        className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading Banks...' : 'Continue'}
                    </button>
                </div>
            )}

            {step === 'select-bank' && (
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
                        onClick={() => {
                            setStep('select-country');
                            setSearchTerm(''); // Reset search when going back
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Country Selection
                    </button>
                </div>
            )}

            {step === 'connecting' && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg">Connecting to your bank...</p>
                    <p className="text-sm text-gray-500 mt-2">You will be redirected to your bank's authentication page</p>
                </div>
            )}

            {step === 'connected' && transactions.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
                    {account && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium mb-2">Account Details</h3>
                            <p className="text-sm text-gray-600">
                                {account.ownerName && `Owner: ${account.ownerName}`}
                                {account.iban && ` • IBAN: ${account.iban}`}
                                {account.currency && ` • Currency: ${account.currency}`}
                            </p>
                            {balances.length > 0 && (
                                <div className="mt-3">
                                    <h4 className="font-medium mb-1">Account Balances</h4>
                                    {balances.map((balance, index) => (
                                        <p key={index} className="text-sm text-gray-600">
                                            {balance.balanceType}: {balance.balanceAmount.currency} {parseFloat(balance.balanceAmount.amount).toFixed(2)}
                                            <span className="text-xs text-gray-400 ml-2">
                                                (as of {new Date(balance.referenceDate).toLocaleDateString()})
                                            </span>
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="space-y-3">
                        {transactions.map((transaction, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-medium">
                                            {getTransactionDescription(transaction)}
                                        </h3>
                                        <p className="text-sm text-gray-500">{transaction.bookingDate}</p>
                                        {transaction.entryReference && (
                                            <p className="text-xs text-gray-400">Ref: {transaction.entryReference}</p>
                                        )}
                                        {getTransactionDetails(transaction).length > 0 && (
                                            <div className="mt-2">
                                                {getTransactionDetails(transaction).map((detail, detailIndex) => (
                                                    <p key={detailIndex} className="text-xs text-gray-500">
                                                        {detail}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className={`font-semibold ${parseFloat(transaction.transactionAmount.amount) < 0
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                            }`}>
                                            {transaction.transactionAmount.currency} {Math.abs(parseFloat(transaction.transactionAmount.amount)).toFixed(2)}
                                        </p>
                                        {transaction.bankTransactionCode && (
                                            <p className="text-xs text-gray-500">{transaction.bankTransactionCode}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setStep('select-country');
                            setTransactions([]);
                            setAccount(null);
                            setBalances([]);
                        }}
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Connect Another Bank
                    </button>
                </div>
            )}
        </div>
    );
} 