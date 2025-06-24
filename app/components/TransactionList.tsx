import { Transaction } from "@/types/gocardless-types";

export function TransactionList(p: { transactions: Transaction[] }) {
    const formatDateToFrench = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

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

    return (
        p.transactions.map((transaction, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-medium">
                            {getTransactionDescription(transaction)}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDateToFrench(transaction.bookingDate)}</p>
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
        ))
    );
}
