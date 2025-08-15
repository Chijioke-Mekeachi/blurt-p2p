import React, { useState } from 'react';
import { useOffers } from '../../hooks/useOffers';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ isOpen, onClose }) => {
  const { createOffer } = useOffers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'sell' as 'buy' | 'sell',
    amount: '',
    price_per_token: '',
    payment_method: '',
    description: '',
    blurt_username: '',
    active_key: '',
  });

  const sendBlurt = async (username: string, activeKey: string, amount: string) => {
    // Replace with your backend endpoint that sends Blurt
    const res = await fetch('https://your-api.com/send-blurt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: username,
        to: 'trevourcodz',
        amount,
        active_key: activeKey,
        memo: 'P2P Sell Order',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to send Blurt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If selling, first send Blurt to trevourcodz
      if (formData.type === 'sell') {
        if (!formData.blurt_username || !formData.active_key) {
          alert('Please provide your Blurt username and Active Key.');
          setLoading(false);
          return;
        }
        await sendBlurt(formData.blurt_username, formData.active_key, formData.amount);
      }

      // Then create the offer
      await createOffer({
        type: formData.type,
        amount: Number(formData.amount),
        price_per_token: Number(formData.price_per_token),
        payment_method: formData.payment_method,
        description: formData.description || undefined,
      });

      setFormData({
        type: 'sell',
        amount: '',
        price_per_token: '',
        payment_method: '',
        description: '',
        blurt_username: '',
        active_key: '',
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const totalValue = Number(formData.amount) * Number(formData.price_per_token) || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Offer
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Offer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Offer Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'buy' })}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors duration-200 ${
                  formData.type === 'buy'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Buy BLURT
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'sell' })}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors duration-200 ${
                  formData.type === 'sell'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <TrendingDown className="w-5 h-5 mr-2" />
                Sell BLURT
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (BLURT)
            </label>
            <input
              type="number"
              name="amount"
              step="0.00000001"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00000000"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>

          {/* Price per token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price per Token (USD)
            </label>
            <input
              type="number"
              name="price_per_token"
              step="0.0001"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0000"
              value={formData.price_per_token}
              onChange={handleChange}
            />
          </div>

          {/* If selling, ask for Blurt credentials */}
          {formData.type === 'sell' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Blurt Username
                </label>
                <input
                  type="text"
                  name="blurt_username"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your Blurt username"
                  value={formData.blurt_username}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active Key
                </label>
                <input
                  type="password"
                  name="active_key"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your Active Key"
                  value={formData.active_key}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Total value display */}
          {totalValue > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 dark:text-blue-400">Total Value:</span>
                <span className="font-medium text-blue-800 dark:text-blue-300">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <select
              name="payment_method"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.payment_method}
              onChange={handleChange}
            >
              <option value="">Select payment method</option>
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Venmo">Venmo</option>
              <option value="Cash App">Cash App</option>
              <option value="Zelle">Zelle</option>
              <option value="Cryptocurrency">Cryptocurrency</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional details about your offer..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Submit */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Offer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
