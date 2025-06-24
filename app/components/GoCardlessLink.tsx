'use client';

import { useState, useEffect } from 'react';
import { getInstitutions, initializeSession, getTransactionsFromRequisition, getCachedTransactionsOnly, testRequisitionExists, testGoCardlessConnection, getRequisitionIdFromReference, checkRateLimitStatus, debugCache } from '@/app/actions/gocardless-actions';
import { Institution, Transaction } from '@/types/gocardless-types';
import { ButtonTest } from './ButtonTest';
import { ConnexionStatus } from './ConnexionStatus';
import { FormBankCountry } from './FormBankCountry';
import { FormSelectBank } from './FormSelectBank';
import { SpinnerBankLoading } from './SpinnerBankLoading';
import { TransactionList } from './TransactionList';
import { useLocalStorage } from '../hooks/use-local-storage';



export function GoCardlessLink() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('FR');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<'select-country' | 'select-bank' | 'connecting' | 'connected'>('select-country');
    const [storedRequisitionId, setStoredRequisitionId] = useLocalStorage('gocardless_requisition_id');

    // Check for requisition ID in URL params (for callback handling)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        // The requisition ID should be passed as a query parameter
        // According to GoCardless docs, it's typically passed as 'ref' or directly as the requisition ID
        const requisitionId = urlParams.get('ref') || urlParams.get('requisition_id') || urlParams.get('id');
        if (requisitionId) {
            handleCallback(requisitionId);
        }
    }, []);

    useEffect(() => {
        fetchInstitutions();
    }, [selectedCountry]);

    // Check for stored requisition ID on mount
    useEffect(() => {
        if (storedRequisitionId) {
            // Auto-load cached transactions if we have a stored connection
            handleLoadCachedTransactions(storedRequisitionId);
        }
    }, []);


    const fetchInstitutions = async () => {
        try {
            setLoading(true);
            setSearchTerm(''); // Reset search when changing country
            const data = await getInstitutions(selectedCountry);
            setInstitutions(data);
            setStep('select-bank');
        } catch (error) {
            console.error('❌ [CLIENT] Error fetching institutions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBankSelection = async (institutionId: string) => {
        setStep('connecting');
        setLoading(true);

        try {
            const session = await initializeSession(institutionId);
            // Redirect to GoCardless authentication (external URL)
            window.location.href = session.link;
        } catch (error) {
            console.error('❌ [CLIENT] Error initializing session:', error);
            setStep('select-bank');
            setLoading(false);
        }
    };

    const handleCallback = async (referenceId: string) => {
        setLoading(true);

        try {
            // First, get the actual requisition ID from the reference ID
            const requisitionId = await getRequisitionIdFromReference(referenceId);

            if (!requisitionId) {
                throw new Error('Requisition not found for this reference. The bank connection may have failed or expired.');
            }

            // Store the requisition ID for future refetching
            localStorage.setItem('gocardless_requisition_id', requisitionId);
            setStoredRequisitionId(requisitionId);

            // Test if the requisition exists
            const requisitionTest = await testRequisitionExists(requisitionId);

            if (!requisitionTest) {
                throw new Error('Requisition not found. The bank connection may have failed or expired.');
            }

            const data = await getTransactionsFromRequisition(requisitionId);

            setTransactions(data.transactions);
            setStep('connected');
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

    const handleCheckAccountStatus = async () => {
        try {
            const status = await checkRateLimitStatus();
            if (status.rateLimited) {
                let message = '❌ Rate limit exceeded!\n\n';

                // Type-safe property access
                if ('detail' in status && status.detail) {
                    message += `Details: ${status.detail}\n\n`;
                }

                if ('summary' in status && status.summary) {
                    message += `Summary: ${status.summary}\n\n`;
                }

                if ('retryAfter' in status && status.retryAfter) {
                    message += `Retry after: ${status.retryAfter} seconds\n`;
                }

                if ('rateLimitRemaining' in status && status.rateLimitRemaining) {
                    message += `Remaining requests: ${status.rateLimitRemaining}\n`;
                }

                if ('rateLimitReset' in status && status.rateLimitReset) {
                    message += `Rate limit resets: ${status.rateLimitReset}\n`;
                }

                message += '\nPlease wait before trying again.';
                alert(message);
            } else {
                alert('✅ Account status OK - no rate limits detected');
            }
        } catch (error) {
            alert(`❌ Error checking account status: ${error}`);
        }
    };

    const handleDebugCache = async () => {
        try {
            const result = await debugCache();
            if (result.success) {
                alert('Check console for cache debug info');
            } else {
                alert(`❌ Error debugging cache: ${result.error}`);
            }
        } catch (error) {
            alert(`❌ Error debugging cache: ${error}`);
        }
    };

    const handleLoadCachedTransactions = async (requisitionId?: string) => {
        const idToUse = requisitionId || storedRequisitionId;
        if (!idToUse) {
            alert('No stored bank connection found. Please connect a bank first.');
            return;
        }

        setLoading(true);

        try {
            const data = await getCachedTransactionsOnly(idToUse);
            setTransactions(data.transactions);
            setStep('connected');
            alert('✅ Cached transactions loaded successfully!');
        } catch (error: any) {
            console.error('❌ [CLIENT] Error loading cached transactions:', error);
            alert(`Error loading cached transactions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRefetchTransactions = async (requisitionId?: string, forceRefresh: boolean = false) => {
        const idToUse = requisitionId || storedRequisitionId;
        if (!idToUse) {
            alert('No stored bank connection found. Please connect a bank first.');
            return;
        }

        setLoading(true);

        try {
            const data = await getTransactionsFromRequisition(idToUse, forceRefresh);
            setTransactions(data.transactions);
            setStep('connected');

            if (forceRefresh) {
                alert('✅ Transactions refreshed successfully!');
            }
        } catch (error: any) {
            console.error('❌ [CLIENT] Error refetching transactions:', error);
            alert(`Error refetching transactions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Wrapper function for ConnexionStatus component
    const handleRefetchFromStatus = (forceRefresh: boolean = false) => {
        if (forceRefresh) {
            handleRefetchTransactions(undefined, true);
        } else {
            handleLoadCachedTransactions();
        }
    };

    const handleClearStoredConnection = () => {
        localStorage.removeItem('gocardless_requisition_id');
        setStoredRequisitionId(null);
        setTransactions([]);
        setStep('select-country');
    };

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




    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>

            {/* Debug buttons */}
            <div className="mb-4 flex gap-2">
                <ButtonTest onClick={handleTestConnection} />
                <button
                    onClick={handleCheckAccountStatus}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                    Check Rate Limits
                </button>
                <button
                    onClick={handleDebugCache}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Debug Cache
                </button>
            </div>

            {/* Stored Connection Status */}
            {storedRequisitionId && (
                <ConnexionStatus
                    onClickRefetch={handleRefetchFromStatus}
                    onClickClear={handleClearStoredConnection}
                    loading={loading}
                />
            )}

            {step === 'select-country' && (
                <FormBankCountry
                    selectedCountry={selectedCountry}
                    onChangeCountry={setSelectedCountry}
                    onSubmit={fetchInstitutions}
                    isLoading={loading}
                />
            )}

            {step === 'select-bank' && (
                <FormSelectBank
                    inputSearchTerm={searchTerm}
                    onChangeInputSearchTerm={setSearchTerm}
                    filteredInstitutions={filteredInstitutions}
                    institutions={institutions}
                    onClickInstitution={handleBankSelection}
                    onClickBack={() => {
                        setStep('select-country');
                        setSearchTerm('');
                    }}
                />
            )}

            {step === 'connecting' && (
                <SpinnerBankLoading />
            )}

            {step === 'connected' && transactions.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
                    <div className="space-y-3">
                        <TransactionList transactions={transactions} />
                    </div>

                </div>
            )}
        </div>
    );
} 