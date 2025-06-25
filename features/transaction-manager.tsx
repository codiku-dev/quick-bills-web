"use client";

import { useGoCardlessStore } from "@/store/gocardless-store";
import { useInstitutions } from "@/hooks/use-institutions";
import { useTransactions } from "@/hooks/use-transactions";
import { ConnexionStatus } from "@/components/ConnexionStatus";
import { FormBankCountry } from "@/components/FormBankCountry";
import { FormSelectBank } from "@/components/FormSelectBank";
import { SpinnerBankLoading } from "@/components/SpinnerBankLoading";
import { TransactionList } from "@/components/TransactionList";
import { DraggableImagesZone } from "@/components/DraggableImagesZone";
import { AiUploadImages } from "./ai-upload-images/ai-upload-images";

export function TransactionsManager() {
    const { requisitionId } = useGoCardlessStore();
    const { isLoading: institutionsLoading } = useInstitutions();
    const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(requisitionId);

    const renderTransactions = () => {
        return <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-3 max-h-[1000px] overflow-y-auto">
                <TransactionList transactions={transactions} imageMatches={[]} />
            </div>
        </div>
    }
    return (
        <div className="p-6">
            <div className="flex flex-row gap-6">
                <div className="flex-1/7">
                    {/* AI/Draggable zone moved elsewhere */}
                    <AiUploadImages />
                </div>
                <div className="flex-4/5">
                    <h1 className="text-3xl font-bold mb-6">Bank Connection (GoCardless)</h1>
                    <ConnexionStatus />
                    <FormBankCountry />
                    <FormSelectBank />
                    {(institutionsLoading || transactionsLoading) && <SpinnerBankLoading />}
                    {transactions.length > 0 && renderTransactions()}
                </div>
            </div>
        </div>
    );
} 