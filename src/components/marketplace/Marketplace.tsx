import React, { useState } from 'react';
import { useOffers } from '../../hooks/useOffers';
import { useTrades } from '../../hooks/useTrades';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { Search, Filter, TrendingUp, TrendingDown, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';

export const Marketplace: React.FC = () => {
  const { offers, loading } = useOffers();
  const { acceptOffer } = useTrades();
  const { user } = useAuth();
  const { createOrGetConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  const filteredOffers = offers
    .filter(offer => 
      offer.user_id !== user?.id && // Don't show user's own offers
      (filterType === 'all' || offer.type === filterType) &&
      (searchTerm === '' || 
       offer.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
       offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       offer.profiles?.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price_per_token - b.price_per_token;
        case 'price-desc':
          return b.price_per_token - a.price_per_token;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleAcceptOffer = async (offerId: string, amount: number) => {
    try {
      await acceptOffer(offerId, amount);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleContactSeller = async (sellerId: string) => {
    if (!user) return;
    
    try {
      const conversationId = await createOrGetConversation(sellerId);
      if (conversationId) {
        // In a real app, you would navigate to the chat page
        console.log('Open conversation:', conversationId);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-4"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Marketplace
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Buy and sell BLURT tokens with other users
        </p>
      </div>

      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by payment method, description, or username..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'buy' | 'sell')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Offers</option>
            <option value="buy">Buy Offers</option>
            <option value="sell">Sell Offers</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Offers grid */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No offers found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
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
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4 mr-1" />
                  {offer.profiles?.username}
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Posted {format(new Date(offer.created_at), 'MMM d, yyyy')}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptOffer(offer.id, offer.amount)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Accept Offer
                </button>
                <button
                  onClick={() => handleContactSeller(offer.user_id)}
                  className="p-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};