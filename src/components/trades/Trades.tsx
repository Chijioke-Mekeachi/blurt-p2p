import React from 'react';
import { useTrades } from '../../hooks/useTrades';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, AlertTriangle, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const Trades: React.FC = () => {
  const { trades, loading, updateTradeStatus } = useTrades();
  const { user } = useAuth();

  const handleStatusUpdate = async (tradeId: string, status: 'completed' | 'cancelled' | 'disputed') => {
    try {
      await updateTradeStatus(tradeId, status);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Trade History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your trading transactions
        </p>
      </div>

      {/* Trades list */}
      {trades.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No trades yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start trading by accepting offers in the marketplace
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => {
            const isBuyer = trade.buyer_id === user?.id;
            const otherParty = isBuyer ? trade.seller : trade.buyer;
            
            return (
              <div
                key={trade.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(trade.status)}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(trade.status)}`}>
                      {trade.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isBuyer 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {isBuyer ? 'BUYING' : 'SELLING'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(trade.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>

                {/* Trade details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Trade Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {trade.amount} BLURT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${trade.price_per_token.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${trade.total_value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Trading Partner</h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {otherParty?.username || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {otherParty?.full_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {trade.status === 'pending' && (
                  <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleStatusUpdate(trade.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Complete</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(trade.id, 'disputed')}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Dispute</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(trade.id, 'cancelled')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}

                {trade.completed_at && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Completed on {format(new Date(trade.completed_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};