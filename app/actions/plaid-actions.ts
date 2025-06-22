'use server';

import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products, LinkTokenCreateRequest } from 'plaid';

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
            'PLAID-SECRET': process.env.PLAID_SECRET || '',
        },
    },
});

console.log('🔄 [SERVER] Configuration:', configuration);
const plaidClient = new PlaidApi(configuration);

export async function createLinkToken() {
    console.log('🔄 [SERVER] Starting createLinkToken...');
    console.log('🔑 [SERVER] Using Plaid Client ID:', process.env.PLAID_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('🔑 [SERVER] Using Plaid Secret:', process.env.PLAID_SECRET ? '✅ Set' : '❌ Missing');

    try {
        const request: LinkTokenCreateRequest = {
            user: { client_user_id: 'user-id' },
            client_name: 'My App',
            products: [Products.Transactions],
            country_codes: [CountryCode.Fr],
            language: 'en',
            client_id: process.env.PLAID_CLIENT_ID,
            secret: process.env.PLAID_SECRET,
        };

        console.log('📤 [SERVER] Creating link token with request:', JSON.stringify(request, null, 2));

        const createTokenResponse = await plaidClient.linkTokenCreate(request);

        console.log('✅ [SERVER] Link token created successfully');
        console.log('🔗 [SERVER] Link token:', createTokenResponse.data.link_token.substring(0, 20) + '...');

        return { link_token: createTokenResponse.data.link_token };
    } catch (error) {
        console.error('❌ [SERVER] Error creating link token:', error);
        throw new Error('Failed to create link token');
    }
}

export async function exchangeTokenAndGetTransactions(public_token: string) {
    console.log('🔄 [SERVER] Starting exchangeTokenAndGetTransactions...');
    console.log('🎫 [SERVER] Public token received:', public_token.substring(0, 20) + '...');

    try {
        // Exchange public token for access token
        console.log('🔄 [SERVER] Exchanging public token for access token...');

        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token: public_token,
        });

        const accessToken = exchangeResponse.data.access_token;
        console.log('✅ [SERVER] Token exchange successful');
        console.log('🔑 [SERVER] Access token:', accessToken.substring(0, 20) + '...');

        // Get transactions for the last 30 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        console.log('📅 [SERVER] Fetching transactions from', startDate, 'to', endDate);

        // Try to get transactions with retry logic for sandbox
        let transactionsResponse;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                transactionsResponse = await plaidClient.transactionsGet({
                    access_token: accessToken,
                    start_date: startDate,
                    end_date: endDate,
                });
                break; // Success, exit the retry loop
            } catch (error: any) {
                retryCount++;
                console.log(`🔄 [SERVER] Attempt ${retryCount}/${maxRetries} failed:`, error.response?.data?.error_code);

                if (error.response?.data?.error_code === 'PRODUCT_NOT_READY' && retryCount < maxRetries) {
                    console.log('⏳ [SERVER] Product not ready, waiting 2 seconds before retry...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }

                // If it's not PRODUCT_NOT_READY or we've exhausted retries, throw the error
                throw error;
            }
        }

        if (!transactionsResponse) {
            throw new Error('Failed to fetch transactions after all retry attempts');
        }

        console.log('✅ [SERVER] Transactions fetched successfully');
        console.log('📊 [SERVER] Number of transactions:', transactionsResponse.data.transactions.length);
        console.log('🏦 [SERVER] Number of accounts:', transactionsResponse.data.accounts.length);

        return {
            access_token: accessToken,
            transactions: transactionsResponse.data.transactions,
        };
    } catch (error: any) {
        console.error('❌ [SERVER] Error exchanging token:', error);

        // Log more detailed error information
        if (error.response) {
            console.error('📋 [SERVER] Error response status:', error.response.status);
            console.error('📋 [SERVER] Error response data:', error.response.data);
        }
        if (error.message) {
            console.error('📋 [SERVER] Error message:', error.message);
        }

        throw new Error(`Failed to exchange token: ${error.message || 'Unknown error'}`);
    }
} 