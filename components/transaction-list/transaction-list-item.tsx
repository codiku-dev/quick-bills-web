import { SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { NonNullableValues } from '@/types/ts-helper';

interface TransactionListItemProps {
  item: NonNullableValues<SimplifiedTransactionWithBillImage>;
}

export function TransactionListItem({ item }: TransactionListItemProps) {
  const formatDateToFrench = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${item.base64Image && 'bg-green-500/30'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium">{item.label}</h3>
          <p className="text-sm text-gray-500">{formatDateToFrench(item.date)}</p>

          {/* Display matched image if exists */}
          {item.base64Image && (
            <div className="mt-3">
              <p className="text-xs text-blue-600 mb-2">📷 Matched with receipt image</p>
              <img src={`data:image/jpeg;base64,${item.base64Image}`} alt="Receipt" className="w-20 h-20 object-cover rounded border" />
              {item.detail && <p className="text-xs text-gray-600 mt-1">{item.detail}</p>}
            </div>
          )}
        </div>
        <div className="text-right ml-4">
          <p className={`font-semibold ${parseFloat(item.price) < 0 ? 'text-red-600' : 'text-green-600'}`}>{item.price}</p>
          {item.detail && <p className="text-xs text-gray-500">{item.detail}</p>}
        </div>
      </div>
    </div>
  );
}
