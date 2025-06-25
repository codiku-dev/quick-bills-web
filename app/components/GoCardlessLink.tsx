'use client';

import { useState, useEffect } from 'react';
import { getInstitutions, initializeSession, getTransactionsFromRequisition, getCachedTransactionsOnly, getRequisitionIdFromReference } from '@/app/actions/gocardless-actions';
import { Institution, GoCardlessTransaction } from '@/types/gocardless-types';
import { ConnexionStatus } from './ConnexionStatus';
import { FormBankCountry } from './FormBankCountry';
import { FormSelectBank } from './FormSelectBank';
import { SpinnerBankLoading } from './SpinnerBankLoading';
import { TransactionList } from './TransactionList';
import { useLocalStorage } from '../hooks/use-local-storage';
import { testRequisitionExists } from '../actions/gocardless/requisitions';
import { billyAiClient } from '../lib/billy-ai-client';
import { SimplifiedTransaction, SimplifiedTransactionsArraySchema, SimplifiedTransactionSchema } from '@/types/bill-types';
import { simplifyTransactions } from '@/utils/format-data-utils';
import { DraggableImagesZone, ImageFile } from './DraggableImagesZone';
import z from 'zod';
export function GoCardlessLink() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('FR');
    const [transactions, setTransactions] = useState<GoCardlessTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<'select-country' | 'select-bank' | 'connecting' | 'connected'>('select-country');
    const [storedRequisitionId, setStoredRequisitionId] = useLocalStorage('gocardless_requisition_id');
    const [imageMatchList, setImageMatchList] = useState<(SimplifiedTransaction & { base64Image: string })[]>([]);
    const [isAiCalculating, setIsAiCalculating] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);

    async function initAiClient() {
        await billyAiClient.init();
    }

    useEffect(() => {
        initAiClient();
    }, []);
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

    const submitImages = async (images: ImageFile[]) => {
        setIsAiCalculating(true);
        setAiProgress(0);
        await billyAiClient.clearContext();

        const base64ImagesPromise = images.map(image => image.file.arrayBuffer());
        const base64Images = await Promise.all(base64ImagesPromise);
        const base64ImagesString = base64Images.map(base64Image => Buffer.from(base64Image).toString('base64'));

        const responses = [];
        const totalImages = base64ImagesString.length;

        for (let i = 0; i < base64ImagesString.length; i++) {
            const base64Image = base64ImagesString[i];

            // Update progress
            const progress = ((i + 1) / totalImages) * 100;
            setAiProgress(progress);

            const response = await billyAiClient.requestAiForStructuredResponse(
                "",
                [base64Image],
                z.null().or(SimplifiedTransactionSchema)
            );
            responses.push({ ...response, base64Image });
            setImageMatchList(responses.filter(response => response !== null) as (SimplifiedTransaction & { base64Image: string })[]);
        }

        console.log('🔄 [CLIENT] Responses:', responses);
        setIsAiCalculating(false);
        setAiProgress(0);
    };


    return (
        <div className="  p-6">
            <div className="flex flex-row gap-6" >
                <div className="flex-1/7">
                    {step === 'connected' && transactions.length > 0 && <DraggableImagesZone onImagesSubmit={submitImages} isLoading={isAiCalculating} progress={aiProgress} />}
                </div>
                <div className="flex-4/5">
                    <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>


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
                            <div className="space-y-3 max-h-[1000px] overflow-y-auto">
                                <TransactionList transactions={transactions} imageMatches={imageMatchList} />
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 