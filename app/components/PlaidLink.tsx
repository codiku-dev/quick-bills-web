'use client';

import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { createLinkToken, exchangeTokenAndGetTransactions } from '@/app/actions/plaid-actions';
import type { Transaction as PlaidTransaction } from 'plaid';

export default function PlaidLink() {
    console.log('🔄 [CLIENT] PlaidLink component rendered');
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('🚀 [CLIENT] Component mounted, creating link token...');
        createLinkTokenHandler();
    }, []);

    const createLinkTokenHandler = async () => {
        console.log('🔄 [CLIENT] Starting createLinkTokenHandler...');
        try {
            console.log('📤 [CLIENT] Calling createLinkToken server function...');
            const data = await createLinkToken();
            console.log('✅ [CLIENT] Link token received from server');
            console.log('🔗 [CLIENT] Link token:', data.link_token.substring(0, 20) + '...');
            setLinkToken(data.link_token);
            console.log('💾 [CLIENT] Link token saved to state');
        } catch (error) {
            console.error('❌ [CLIENT] Error creating link token:', error);
        }
    };

    const handleSuccess = async (public_token: string, metadata: any) => {
        console.log('🎉 [CLIENT] Plaid Link success!');
        console.log('🎫 [CLIENT] Public token received:', public_token.substring(0, 20) + '...');
        console.log('📋 [CLIENT] Metadata:', metadata);

        setLoading(true);
        console.log('⏳ [CLIENT] Setting loading state to true');

        try {
            console.log('📤 [CLIENT] Calling exchangeTokenAndGetTransactions...');
            const data = await exchangeTokenAndGetTransactions(public_token);
            console.log('✅ [CLIENT] Server response received');
            console.log('📊 [CLIENT] Number of transactions:', data.transactions.length);
            console.log('🔑 [CLIENT] Access token:', data.access_token.substring(0, 20) + '...');

            setTransactions(data.transactions);
            console.log('💾 [CLIENT] Transactions saved to state');

            // Log first few transactions for debugging
            if (data.transactions.length > 0) {
                console.log('📝 [CLIENT] Sample transactions:');
                data.transactions.slice(0, 3).forEach((tx, index) => {
                    console.log(`  ${index + 1}. ${tx.name} - $${tx.amount} (${tx.date})`);
                });
            }
        } catch (error) {
            console.error('❌ [CLIENT] Error exchanging token:', error);
        } finally {
            setLoading(false);
            console.log('✅ [CLIENT] Loading state set to false');
        }
    };

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: handleSuccess,
        onExit: (err, metadata) => {
            console.log('🚪 [CLIENT] Plaid Link exit');
            console.log('📋 [CLIENT] Exit metadata:', metadata);
            if (err) {
                console.error('❌ [CLIENT] Plaid Link error:', err);
            }
        },
        onEvent: (eventName, metadata) => {
            console.log('📡 [CLIENT] Plaid Link event:', eventName, metadata);
        },
    });

    console.log('🔄 [CLIENT] Render - Link token:', linkToken ? '✅ Set' : '❌ Not set');
    console.log('🔄 [CLIENT] Render - Ready state:', ready);
    console.log('🔄 [CLIENT] Render - Loading state:', loading);
    console.log('🔄 [CLIENT] Render - Transactions count:', transactions.length);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Bank Connection</h1>

            {!transactions.length && (
                <div className="mb-6">
                    <button
                        onClick={() => {
                            console.log('🖱️ [CLIENT] Connect button clicked');
                            console.log('🔗 [CLIENT] Opening Plaid Link with token:', linkToken ? '✅ Available' : '❌ Missing');
                            open();
                        }}
                        disabled={!ready || loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Connecting...' : 'Connect Bank Account'}
                    </button>
                    {!ready && (
                        <p className="text-sm text-gray-500 mt-2">
                            {!linkToken ? 'Loading Plaid Link...' : 'Preparing connection...'}
                        </p>
                    )}
                </div>
            )}

            {transactions.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
                    <div className="space-y-3">
                        {transactions.map((transaction, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{transaction.name}</h3>
                                        {transaction.merchant_name && (
                                            <p className="text-sm text-gray-600">{transaction.merchant_name}</p>
                                        )}
                                        <p className="text-sm text-gray-500">{transaction.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ${Math.abs(transaction.amount).toFixed(2)}
                                        </p>
                                        {transaction.category && (
                                            <p className="text-xs text-gray-500">{transaction.category.join(', ')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 