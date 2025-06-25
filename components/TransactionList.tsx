import { SimplifiedTransaction } from "@/types/simplified-transaction-types";
import { GoCardlessTransaction } from "@/types/gocardless-types";



export function TransactionList(p: {
    transactions: GoCardlessTransaction[],
    imageMatches: (SimplifiedTransaction & { base64Image: string })[]
}) {
    const formatDateToFrench = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getTransactionDescription = (transaction: GoCardlessTransaction): string => {
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

    const getMatchedImage = (transaction: GoCardlessTransaction, index: number): (SimplifiedTransaction & { base64Image: string }) | undefined => {

        return p.imageMatches.find(match => {
            if (match.id === transaction.internalTransactionId) {
                return match;
            }
        });
    };

    return (
        p.transactions.map((transaction, index) => {
            const matchedImage = getMatchedImage(transaction, index);
            return (
                <div key={index} className={`border rounded-lg p-4   shadow-sm ${matchedImage && 'bg-green-500/30'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="font-medium">
                                {getTransactionDescription(transaction)}
                            </h3>
                            <p className="text-sm text-gray-500">{formatDateToFrench(transaction.bookingDate)}</p>

                            {/* Display matched image if exists */}
                            {matchedImage && (
                                <div className="mt-3">
                                    <p className="text-xs text-blue-600 mb-2">📷 Matched with receipt image</p>
                                    <img
                                        src={`data:image/jpeg;base64,${matchedImage.base64Image}`}
                                        alt="Receipt"
                                        className="w-20 h-20 object-cover rounded border"
                                    />
                                    {matchedImage.detail && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {matchedImage.detail}
                                        </p>
                                    )}
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
            );
        })
    );
}
