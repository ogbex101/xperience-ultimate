import React from 'react';
import { History, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';

const TransactionHistory = ({ transactions = [], xpTransactions = [], showAll = false }) => {
  const displayTransactions = showAll ? transactions : transactions.slice(0, 5);
  const displayXpTransactions = showAll ? xpTransactions : xpTransactions.slice(0, 5);

  const getTransactionIcon = (type) => {
    if (type.includes('deposit') || type.includes('winning') || type.includes('refund')) {
      return <ArrowDownRight className="h-4 w-4 text-green-400" />;
    } else if (type.includes('withdrawal') || type.includes('entry') || type.includes('tournament_entry')) {
      return <ArrowUpRight className="h-4 w-4 text-red-400" />;
    }
    return <History className="h-4 w-4 text-gray-400" />;
  };

  const getXpIcon = (type) => {
    if (type.includes('earned') || type.includes('in')) {
      return <ArrowDownRight className="h-4 w-4 text-green-400" />;
    } else if (type.includes('spent') || type.includes('out')) {
      return <ArrowUpRight className="h-4 w-4 text-red-400" />;
    }
    return <Coins className="h-4 w-4 text-yellow-400" />;
  };

  return (
    <div>
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(tx.type)}
                      <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: tx.currency || 'NGN'
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{tx.description}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'completed' 
                        ? 'bg-green-900/30 text-green-400'
                        : tx.status === 'pending' || tx.status === 'pending_approval'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <History className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p>No transactions yet</p>
        </div>
      )}

      {/* XP Transactions Section */}
      {xpTransactions.length > 0 && showAll && (
        <div className="mt-8">
          <h4 className="text-lg font-bold mb-4 flex items-center">
            <Coins className="h-5 w-5 mr-2 text-yellow-400" />
            XP Points Transactions
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Description</th>
                  <th className="py-3 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {displayXpTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getXpIcon(tx.type)}
                        <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={!tx.type.includes('out') && !tx.type.includes('spent') ? 'text-green-400' : 'text-red-400'}>
                        {!tx.type.includes('out') && !tx.type.includes('spent') ? '+' : '-'}
                        {tx.amount} XP
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{tx.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;