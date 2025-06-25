import { SimplifiedTransaction } from "@/types/bill-types";
import { GoCardlessTransaction } from "@/types/gocardless-types";

export const simplifyTransactions = (transactions: GoCardlessTransaction[]): SimplifiedTransaction[] => {
    const simplifiedTransactions = transactions.map(transaction => ({
        id: transaction.internalTransactionId!,
        label: transaction.remittanceInformationUnstructuredArray?.join(' ') || '',
        price: transaction.transactionAmount.amount,
        date: transaction.bookingDate
    }));
    return simplifiedTransactions;
}
