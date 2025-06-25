"use client";

import { useEffect } from "react";
import { useGoCardlessStore } from "../store/gocardless-store";
import { useInstitutions } from "../hooks/use-institutions";
import { useTransactions } from "../hooks/use-transactions";
import { ConnexionStatus } from "./ConnexionStatus";
import { FormBankCountry } from "./FormBankCountry";
import { FormSelectBank } from "./FormSelectBank";
import { SpinnerBankLoading } from "./SpinnerBankLoading";
import { TransactionList } from "./TransactionList";

export function GoCardlessLink() {
    const { requisitionId, setRequisitionId } = useGoCardlessStore();

    // Fetch institutions
    const { isLoading: institutionsLoading } = useInstitutions();

    // Fetch transactions when requisitionId changes
    const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(requisitionId);

    // Handle callback from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get("ref") || urlParams.get("requisition_id") || urlParams.get("id");
        if (refId) {
            // This will automatically trigger the useRequisitionId hook
            setRequisitionId(refId);
        }
    }, [setRequisitionId]);

    return (
        <div className="p-6">
            <div className="flex flex-row gap-6">
                <div className="flex-1/7">
                    {/* AI/Draggable zone moved elsewhere */}
                </div>
                <div className="flex-4/5">
                    <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>
                    <ConnexionStatus />
                    <FormBankCountry />
                    <FormSelectBank />
                    {(institutionsLoading || transactionsLoading) && <SpinnerBankLoading />}
                    {transactions.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
                            <div className="space-y-3 max-h-[1000px] overflow-y-auto">
                                <TransactionList transactions={transactions} imageMatches={[]} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 