'use server';

import { randomUUID } from 'crypto';

// GoCardless Bank Account Data API configuration
const API_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
const SECRET_ID = process.env.GOCARDLESS_SECRET_ID || 'secret_id_123';
const SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY || '';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiry: number = 0;

// Reference ID to Requisition ID mapping (in production, use a proper database)
const requisitionMapping = new Map<string, string>();

async function getAccessToken(): Promise<string> {
    // Check if we have a valid token (with 60-second buffer)
    if (accessToken && tokenExpiry > Date.now() + 60000) {
        console.log('🔄 [SERVER] Using cached access token ', accessToken);
        return accessToken;
    }

    // If we have a refresh token, try to refresh first
    if (refreshToken && tokenExpiry < Date.now()) {
        console.log('🔄 [SERVER] Access token expired, attempting refresh...');
        try {
            const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                }),
            });

            if (response.ok) {
                const tokenData = await response.json() as { access: string; access_expires: number };

                if (tokenData.access) {
                    accessToken = tokenData.access;
                    tokenExpiry = Date.now() + (tokenData.access_expires * 1000);
                    console.log('✅ [SERVER] Access token refreshed successfully');
                    return accessToken;
                }
            }
        } catch (error) {
            console.log('⚠️ [SERVER] Token refresh failed, generating new token...');
        }
    }

    console.log('🔄 [SERVER] Generating new access token');

    try {
        const response = await fetch(`${API_BASE_URL}/token/new/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify({
                secret_id: SECRET_ID,
                secret_key: SECRET_KEY,
            }),
        });

        if (!response.ok) {
            throw new Error(`Token generation failed: ${response.status} ${response.statusText}`);
        }

        const tokenData = await response.json() as {
            access: string;
            access_expires: number;
            refresh: string;
            refresh_expires: number
        };

        if (!tokenData.access) {
            throw new Error('No access token received from API');
        }

        accessToken = tokenData.access;
        refreshToken = tokenData.refresh;
        // Convert seconds to milliseconds for Date.now() comparison
        tokenExpiry = Date.now() + (tokenData.access_expires * 1000);

        console.log('✅ [SERVER] New access token generated');
        return accessToken;
    } catch (error: any) {
        console.error('❌ [SERVER] Error generating access token:', error.message);
        // Reset tokens on failure
        accessToken = null;
        refreshToken = null;
        tokenExpiry = 0;
        throw new Error('Failed to generate access token. Please check your credentials.');
    }
}

async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await getAccessToken();
    console.log('🔄 [SERVER] Making authenticated request to:', `${API_BASE_URL}${endpoint}`);
    console.log('🔄 [SERVER] Token used:', token);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export async function getInstitutions(country: string) {
    try {
        console.log(`🔄 [SERVER] Fetching institutions for country: ${country}`);
        const institutions = await makeAuthenticatedRequest(`/institutions/?country=${country}`);
        console.log(`✅ [SERVER] Found ${institutions.length} institutions`);
        return institutions;
    } catch (error: any) {
        console.error('❌ [SERVER] Error fetching institutions:', error.message);
        throw new Error('Failed to fetch institutions');
    }
}

export async function initializeSession(institutionId: string) {
    try {
        const referenceId = randomUUID();
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gocardless/callback`;

        console.log(`🔄 [SERVER] Initializing session for institution: ${institutionId}`);
        console.log(`🔗 [SERVER] Redirect URL: ${redirectUrl}`);
        console.log(`🆔 [SERVER] Reference ID: ${referenceId}`);

        // Optional: Create an end user agreement with custom terms
        // This step is optional - if not created, default terms will be applied
        let agreementId: string | undefined;
        try {
            console.log('🔄 [SERVER] Creating end user agreement...');
            const agreement = await makeAuthenticatedRequest('/agreements/enduser/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    institution_id: institutionId,
                    max_historical_days: 90,
                    access_valid_for_days: 90,
                    access_scope: ['balances', 'details', 'transactions']
                }),
            });
            agreementId = agreement.id;
            console.log('✅ [SERVER] End user agreement created:', agreementId);
        } catch (error) {
            console.log('⚠️ [SERVER] Could not create agreement, using default terms');
        }

        // Create requisition
        console.log('🔄 [SERVER] Creating requisition...');
        const session = await makeAuthenticatedRequest('/requisitions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                redirect: redirectUrl,
                institution_id: institutionId,
                reference: referenceId,
                ...(agreementId && { agreement: agreementId }),
                user_language: 'EN',
            }),
        });

        console.log('✅ [SERVER] Session initialized successfully');
        console.log('📋 [SERVER] Session details:', {
            id: session.id,
            link: session.link,
            status: session.status,
            institution_id: session.institution_id,
            created: session.created
        });

        // Store the mapping for callback handling
        requisitionMapping.set(referenceId, session.id);
        console.log('🗂️ [SERVER] Stored mapping:', { referenceId, requisitionId: session.id });

        return {
            link: session.link,
            requisitionId: session.id,
            referenceId: referenceId,
        };
    } catch (error: any) {
        console.error('❌ [SERVER] Error initializing session:', error.message);
        console.error('📋 [SERVER] Full error details:', error);
        throw new Error('Failed to initialize session');
    }
}

export async function getAgreementById(agreementId: string) {
    try {
        console.log(`🔄 [SERVER] Fetching agreement details for ID: ${agreementId}`);
        const agreement = await makeAuthenticatedRequest(`/agreements/enduser/${agreementId}/`);
        console.log('✅ [SERVER] Agreement details fetched successfully');
        return agreement;
    } catch (error: any) {
        console.error('❌ [SERVER] Error fetching agreement:', error.message);
        throw new Error('Failed to fetch agreement details');
    }
}

export async function testRequisitionExists(requisitionId: string) {
    try {
        console.log(`🔍 [SERVER] Testing if requisition exists: ${requisitionId}`);
        const requisition = await makeAuthenticatedRequest(`/requisitions/${requisitionId}/`);
        console.log('✅ [SERVER] Requisition exists:', {
            id: requisition.id,
            status: requisition.status,
            accounts: requisition.accounts?.length || 0,
            institution_id: requisition.institution_id,
            created: requisition.created
        });
        return requisition;
    } catch (error: any) {
        console.error('❌ [SERVER] Requisition does not exist or error occurred:', error.message);
        return null;
    }
}

export async function getRequisitionIdFromReference(referenceId: string): Promise<string | null> {
    const requisitionId = requisitionMapping.get(referenceId);
    if (requisitionId) {
        console.log('🗂️ [SERVER] Found requisition ID for reference:', { referenceId, requisitionId });
        return requisitionId;
    }
    console.log('❌ [SERVER] No requisition ID found for reference:', referenceId);
    return null;
}

export async function getTransactionsFromRequisition(requisitionId: string) {
    try {
        console.log(`🔄 [SERVER] Fetching requisition data for ID: ${requisitionId}`);

        // First, let's check if the requisition exists and get its status
        const requisitionData = await makeAuthenticatedRequest(`/requisitions/${requisitionId}/`);
        console.log('📋 [SERVER] Requisition data received:', {
            id: requisitionData.id,
            status: requisitionData.status,
            accounts: requisitionData.accounts?.length || 0,
            institution_id: requisitionData.institution_id,
            created: requisitionData.created
        });

        if (!requisitionData.accounts || requisitionData.accounts.length === 0) {
            console.log('⚠️ [SERVER] No accounts found for this requisition.');
            console.log('📋 [SERVER] Requisition status:', requisitionData.status);
            console.log('📋 [SERVER] Full requisition data:', JSON.stringify(requisitionData, null, 2));
            return { transactions: [], account: null, balances: null };
        }

        // We'll just use the first account for this example
        const accountId = requisitionData.accounts[0];
        console.log(`🔄 [SERVER] Using account ID: ${accountId}`);

        // Fetch account details, balances, and transactions in parallel
        const [accountDetails, balancesData, transactionsData] = await Promise.all([
            makeAuthenticatedRequest(`/accounts/${accountId}/`),
            makeAuthenticatedRequest(`/accounts/${accountId}/balances/`),
            makeAuthenticatedRequest(`/accounts/${accountId}/transactions/`)
        ]);

        const bookedTransactions = transactionsData?.transactions?.booked || [];
        console.log(`✅ [SERVER] Fetched ${bookedTransactions.length} transactions.`);
        console.log('🔍 [SERVER] Transactions:', bookedTransactions);
        return {
            transactions: bookedTransactions,
            account: accountDetails.account,
            balances: balancesData?.balances || null
        };
    } catch (error: any) {
        console.error('❌ [SERVER] Error fetching transactions:', error.message);

        // Add more detailed error information
        if (error.message.includes('404')) {
            console.error('🔍 [SERVER] 404 Error - Possible causes:');
            console.error('   - Requisition ID is invalid or expired');
            console.error('   - Requisition was not properly created');
            console.error('   - User did not complete the bank authentication');
            console.error('   - Requisition was deleted or revoked');
        }

        throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
}

export async function testGoCardlessConnection() {
    try {
        console.log('🧪 [SERVER] Testing GoCardless connection...');

        // Test 1: Get access token
        const token = await getAccessToken();
        console.log('✅ [SERVER] Access token obtained successfully');

        // Test 2: Try to get institutions for a known country
        const institutions = await makeAuthenticatedRequest('/institutions/?country=fr');
        console.log(`✅ [SERVER] Successfully fetched ${institutions.length} institutions for FR`);
        // Test 3: Check if sandbox institution exists
        const sandboxInstitution = institutions.find((inst: any) => inst.id === 'AGRICOLE_TOURAINE_POITOU_AGRIFRPPXXX');
        if (sandboxInstitution) {
            console.log('✅ [SERVER] Sandbox institution found:', sandboxInstitution.name);
        } else {
            console.log('⚠️ [SERVER] Sandbox institution not found in FR institutions');
        }

        return {
            success: true,
            institutionsCount: institutions.length,
            hasSandbox: !!sandboxInstitution
        };
    } catch (error: any) {
        console.error('❌ [SERVER] GoCardless connection test failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
} 