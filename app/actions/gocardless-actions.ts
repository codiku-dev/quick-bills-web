'use server';

import { GoCardlessAgreementRequest, GoCardlessAgreementResponse, GoCardlessInstitution, GoCardlessRefreshTokenRequest, GoCardlessRefreshTokenResponse, GoCardlessRequisitionResponse, GoCardlessTokenRequest, GoCardlessTokenResponse, GoCardlessTransactionsResponse } from '@/types/gocardless-types';
import { getRequisitionDb, getRequisitionIdFromMapping, saveTransactions, getCachedTransactions, getTransactionDb } from '@/utils/db-utils';
import { randomUUID } from 'crypto';

// GoCardless Bank Account Data API configuration
const API_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
const SECRET_ID = process.env.GOCARDLESS_SECRET_ID || 'secret_id_123';
const SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY || '';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiry: number = 0;

// Helper function to add delays between API calls
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize lowdb for requisition mapping

async function saveRequisitionMapping(referenceId: string, requisitionId: string) {
    const db = await getRequisitionDb();
    await db.update(({ mappings }) => {
        mappings[referenceId] = requisitionId;
    });
}

async function getAccessToken(): Promise<string> {
    // Check if we have a valid token (with 60-second buffer)
    if (accessToken && tokenExpiry > Date.now() + 60000) {
        return accessToken;
    }

    // If we have a refresh token, try to refresh first
    if (refreshToken && tokenExpiry < Date.now()) {
        try {
            const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                } as GoCardlessRefreshTokenRequest),
            });

            if (response.ok) {
                const tokenData = await response.json() as GoCardlessRefreshTokenResponse;

                if (tokenData.access) {
                    accessToken = tokenData.access;
                    tokenExpiry = Date.now() + (tokenData.access_expires * 1000);
                    return accessToken;
                }
            }
        } catch (error) {
            // Token refresh failed, will generate new token
        }
    }

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
            } as GoCardlessTokenRequest),
        });

        if (!response.ok) {
            throw new Error(`Token generation failed: ${response.status} ${response.statusText}`);
        }

        const tokenData = await response.json() as GoCardlessTokenResponse;

        if (!tokenData.access) {
            throw new Error('No access token received from API');
        }

        accessToken = tokenData.access;
        refreshToken = tokenData.refresh;
        // Convert seconds to milliseconds for Date.now() comparison
        tokenExpiry = Date.now() + (tokenData.access_expires * 1000);

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

async function gocardlessRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Add a small delay before each request to avoid rate limits
    await delay(1000); // 1 second delay between requests

    const token = await getAccessToken();

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (response.status === 429) {
            // Parse detailed rate limit information from response body
            let rateLimitInfo = {};
            try {
                const errorBody = await response.json();
                rateLimitInfo = {
                    summary: errorBody.summary,
                    detail: errorBody.detail,
                    status_code: errorBody.status_code
                };
            } catch (e) {
                // If we can't parse the response body, use headers
                const retryAfter = response.headers.get('Retry-After');
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                rateLimitInfo = { retryAfter, rateLimitRemaining, rateLimitReset };
            }

            console.error('❌ [SERVER] Rate limit exceeded:', rateLimitInfo);
            throw new Error(`Rate limit exceeded: ${JSON.stringify(rateLimitInfo)}`);
        }

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error: any) {
        // No retry logic - just throw the error immediately
        throw error;
    }
}

export async function getInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    try {
        const institutions = await gocardlessRequest<GoCardlessInstitution[]>(`/institutions/?country=${country}`);
        return institutions;
    } catch (error: any) {
        throw new Error('Failed to fetch institutions');
    }
}

async function createEndUserAgreement(institutionId: string) {
    try {
        const agreement = await gocardlessRequest<GoCardlessAgreementResponse>('/agreements/enduser/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                institution_id: institutionId,
                max_historical_days: 90,
                access_valid_for_days: 90,
                access_scope: ['balances', 'details', 'transactions']
            } as GoCardlessAgreementRequest),
        });
        return agreement;
    } catch (error: any) {
        throw error; // Re-throw to be handled by caller
    }
}

async function createRequisition(institutionId: string, referenceId: string, redirectUrl: string, agreementId?: string) {
    const session = await gocardlessRequest<{ id: string, link: string, status: string, institution_id: string, created: string }>('/requisitions/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            redirect: redirectUrl,
            institution_id: institutionId,
            reference: referenceId,
            ...(agreementId && { agreement: agreementId }),
            user_language: 'FR',
        }),
    });
    return session;
}

export async function initializeSession(institutionId: string) {
    try {
        const referenceId = randomUUID();
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gocardless/callback`;

        // Optional: Create an end user agreement with custom terms
        let agreementId: string | undefined;
        try {
            const agreement = await createEndUserAgreement(institutionId);
            agreementId = agreement.id;
        } catch (error) {
            // Token refresh failed, will generate new token
        }

        // Create requisition
        const session = await createRequisition(institutionId, referenceId, redirectUrl, agreementId);

        // Store the mapping for callback handling
        await saveRequisitionMapping(referenceId, session.id);

        return {
            link: session.link,
            requisitionId: session.id,
            referenceId: referenceId,
        };
    } catch (error: any) {
        throw new Error('Failed to initialize session');
    }
}

export async function getAgreementById(agreementId: string) {
    try {
        const agreement = await gocardlessRequest(`/ agreements / enduser / ${agreementId}/`);
        return agreement;
    } catch (error: any) {
        throw new Error('Failed to fetch agreement details');
    }
}

export async function testRequisitionExists(requisitionId: string) {
    try {
        const requisition = await gocardlessRequest<GoCardlessRequisitionResponse>(`/requisitions/${requisitionId}/`);
        return requisition;
    } catch (error: any) {
        return null;
    }
}

export async function getRequisitionIdFromReference(referenceId: string): Promise<string | null> {
    const requisitionId = await getRequisitionIdFromMapping(referenceId);
    if (requisitionId) {
        return requisitionId;
    }
    return null;
}

export async function getTransactionsFromRequisition(requisitionId: string, forceRefresh: boolean = false) {
    try {
        // Always check cache first (unless force refresh is explicitly requested)
        const cachedTransactions = await getCachedTransactions(requisitionId, 168); // 7 day cache (168 hours)
        if (cachedTransactions && !forceRefresh) {
            console.error('✅ [CACHE] Using cached transactions (API calls limited to 4/day)');
            return { transactions: cachedTransactions };
        }

        // Only make API call if no cache exists OR force refresh is explicitly requested
        if (forceRefresh) {
            console.error('⚠️ [API] Force refresh requested. Making API call for transactions. Only 4 calls allowed per day!');
        } else {
            console.error('⚠️ [API] No cached data found. Making API call for transactions. Only 4 calls allowed per day!');
        }

        // First, let's check if the requisition exists and get its status
        console.log('🔄 [SERVER] Fetching requisition data for ID:', requisitionId);
        const requisitionData = await gocardlessRequest<GoCardlessRequisitionResponse>(`/requisitions/${requisitionId}/`);
        console.log('🔄 [SERVER] Requisition data:', requisitionData);

        if (!requisitionData.accounts || requisitionData.accounts.length === 0) {
            return { transactions: [], account: null, balances: null };
        }

        // We'll just use the first account for this example
        const accountId = requisitionData.accounts[0];
        console.log('🔄 [SERVER] Fetching transaction for account:', accountId);
        const transactionsData = await gocardlessRequest<GoCardlessTransactionsResponse>(`/accounts/${accountId}/transactions/`)
        console.log('🔄 [SERVER] Transactions data:', transactionsData);

        const bookedTransactions = transactionsData?.transactions?.booked || [];

        // Save to cache for future use (7 day cache)
        await saveTransactions(requisitionId, bookedTransactions);
        console.error('💾 [CACHE] Transactions saved to cache for 7 days');

        return {
            transactions: bookedTransactions,
        };
    } catch (error: any) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
}

export async function testGoCardlessConnection() {
    try {

        // Test 2: Try to get institutions for a known country
        const institutions = await gocardlessRequest<GoCardlessInstitution[]>('/institutions/?country=fr');
        // Test 3: Check if sandbox institution exists
        const sandboxInstitution = institutions.find((inst: GoCardlessInstitution) => inst.id === 'AGRICOLE_TOURAINE_POITOU_AGRIFRPPXXX');

        return {
            success: true,
            institutionsCount: institutions.length,
            hasSandbox: !!sandboxInstitution
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function checkRateLimitStatus() {
    try {
        // First try to get a real requisition ID from our stored mappings
        const db = await getRequisitionDb();
        const storedRequisitionIds = Object.values(db.data.mappings);

        if (storedRequisitionIds.length > 0) {
            // Test with a real requisition ID to check transaction endpoint rate limits
            const testRequisitionId = storedRequisitionIds[0];
            const response = await fetch(`${API_BASE_URL}/requisitions/${testRequisitionId}/`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${await getAccessToken()}`,
                },
            });

            if (response.status === 429) {
                // Parse detailed rate limit information from response body
                let rateLimitInfo = {};
                try {
                    const errorBody = await response.json();
                    rateLimitInfo = {
                        summary: errorBody.summary,
                        detail: errorBody.detail,
                        status_code: errorBody.status_code
                    };
                } catch (e) {
                    // Fallback to headers if body parsing fails
                    const retryAfter = response.headers.get('Retry-After');
                    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                    rateLimitInfo = { retryAfter, rateLimitRemaining, rateLimitReset };
                }

                console.error('❌ [SERVER] Rate limit exceeded for transactions endpoint');
                console.error('📊 [SERVER] Rate limit info:', rateLimitInfo);

                return {
                    rateLimited: true,
                    ...rateLimitInfo
                };
            }
        } else {
            // No stored requisitions, test with institutions endpoint
            const response = await fetch(`${API_BASE_URL}/institutions/?country=fr`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${await getAccessToken()}`,
                },
            });

            if (response.status === 429) {
                // Parse detailed rate limit information from response body
                let rateLimitInfo = {};
                try {
                    const errorBody = await response.json();
                    rateLimitInfo = {
                        summary: errorBody.summary,
                        detail: errorBody.detail,
                        status_code: errorBody.status_code
                    };
                } catch (e) {
                    // Fallback to headers if body parsing fails
                    const retryAfter = response.headers.get('Retry-After');
                    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                    rateLimitInfo = { retryAfter, rateLimitRemaining, rateLimitReset };
                }

                console.error('❌ [SERVER] Rate limit exceeded for general API');
                console.error('📊 [SERVER] Rate limit info:', rateLimitInfo);

                return {
                    rateLimited: true,
                    ...rateLimitInfo
                };
            }
        }

        return { rateLimited: false };
    } catch (error: any) {
        console.error('❌ [SERVER] Error checking rate limit status:', error.message);
        return { rateLimited: true, error: error.message };
    }
}

export async function getCachedTransactionsOnly(requisitionId: string) {
    try {
        const cachedTransactions = await getCachedTransactions(requisitionId, 168);
        if (cachedTransactions) {
            console.error('✅ [CACHE] Loading cached transactions only (no API call)');
            return { transactions: cachedTransactions };
        } else {
            throw new Error('No cached transactions found');
        }
    } catch (error: any) {
        throw new Error(`No cached data available: ${error.message}`);
    }
}

export async function debugCache() {
    try {
        const db = await getTransactionDb();
        const allData = db.data.transactions;

        console.error('📋 [CACHE] All cached data:');
        const cacheInfo: Record<string, { transactionCount: number; ageHours: number; timestamp: number }> = {};
        Object.keys(allData).forEach(key => {
            const data = allData[key];
            const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
            console.error(`  - ${key}: ${data.data.length} transactions (age: ${Math.round(ageHours)}h)`);
            cacheInfo[key] = {
                transactionCount: data.data.length,
                ageHours: Math.round(ageHours),
                timestamp: data.timestamp
            };
        });

        return { success: true, cacheInfo, keys: Object.keys(allData) };
    } catch (error: any) {
        console.error('❌ [CACHE] Error debugging cache:', error.message);
        return { success: false, error: error.message };
    }
} 