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
  });

  // Use Blurt Keychain to request a transfer
  const sendBlurt = async (username: string, amount: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!window.blurt_keychain) {
        reject(new Error('Blurt Keychain not installed.'));
        return;
      }

      window.blurt_keychain.requestTransfer(
        username,                 // from
        'trevourcodz',            // to
        `${amount} BLURT`,        // amount
        'P2P Sell Order',         // memo
        'BLURT',                  // currency
        (res: any) => {
          if (res.success) resolve();
          else reject(new Error(res.message));
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.type === 'sell') {
        if (!formData.blurt_username) {
          alert('Please provide your Blurt username.');
          setLoading(false);
          return;
        }
        await sendBlurt(formData.blurt_username, formData.amount);
      }

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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offer Type</label>
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
                <TrendingUp className="w-5 h-5 mr-2" /> Buy BLURT
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
                <TrendingDown className="w-5 h-5 mr-2" /> Sell BLURT
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (BLURT)</label>
            <input
              type="number"
              name="amount"
              step="0.00000001"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0.00000000"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price per Token (USD)</label>
            <input
              type="number"
              name="price_per_token"
              step="0.0001"
              min="0"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0.0000"
              value={formData.price_per_token}
              onChange={handleChange}
            />
          </div>

          {formData.type === 'sell' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Blurt Username</label>
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
          )}

          {totalValue > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 dark:text-blue-400">Total Value:</span>
                <span className="font-medium text-blue-800 dark:text-blue-300">${totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
            <select
              name="payment_method"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center"
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
