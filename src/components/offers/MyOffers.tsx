import React, { useState } from 'react';
import { useOffers } from '../../hooks/useOffers';
import { CreateOfferModal } from './CreateOfferModal';
import { Plus, Edit3, X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const MyOffers: React.FC = () => {
  const { myOffers, loading, cancelOffer } = useOffers();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCancelOffer = async (offerId: string) => {
    if (window.confirm('Are you sure you want to cancel this offer?')) {
      try {
        await cancelOffer(offerId);
      } catch (error) {
        // Error handling is done in the hook
      }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Offers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your buy and sell offers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Create Offer</span>
        </button>
      </div>

      {/* Offers list */}
      {myOffers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No offers yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first offer to start trading BLURT tokens
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Offer</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {offer.type === 'buy' ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    offer.type === 'buy' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {offer.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    offer.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : offer.status === 'completed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {offer.status}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {offer.amount} BLURT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${offer.price_per_token.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ${offer.total_value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {offer.payment_method}
                  </span>
                </div>
                {offer.description && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                      Description
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {offer.description}
                    </p>
                  </div>
                )}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(offer.created_at), 'MMM d, yyyy HH:mm')}
                </div>
              </div>

              {/* Actions */}
              {offer.status === 'active' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCancelOffer(offer.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};