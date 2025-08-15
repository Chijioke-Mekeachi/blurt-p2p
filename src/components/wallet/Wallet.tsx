import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, RefreshCw } from 'lucide-react';

export const Wallet: React.FC = () => {
  const { wallet, loading, deposit, withdraw, refresh } = useWallet();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleTransaction = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return;
    }

    setProcessing(true);
    try {
      if (activeTab === 'deposit') {
        await deposit(Number(amount));
      } else {
        await withdraw(Number(amount));
      }
      setAmount('');
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Wallet
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your BLURT token balance and transactions
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold">BLURT Balance</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={refresh}
              className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {showBalance ? `${wallet?.balance?.toFixed(8) || '0.00000000'} BLURT` : '••••••••'}
          </div>
          {wallet?.locked_balance && wallet.locked_balance > 0 && (
            <div className="text-sm text-white/80">
              Locked: {showBalance ? `${wallet.locked_balance.toFixed(8)} BLURT` : '••••••••'}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'deposit'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ArrowDownLeft className="w-5 h-5" />
                <span>Deposit</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                activeTab === 'withdraw'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ArrowUpRight className="w-5 h-5" />
                <span>Withdraw</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (BLURT)
              </label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00000000"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {activeTab === 'withdraw' && wallet && Number(amount) > wallet.balance && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Insufficient balance. Available: {wallet.balance.toFixed(8)} BLURT
                </p>
              </div>
            )}

            <button
              onClick={handleTransaction}
              disabled={
                processing ||
                !amount ||
                isNaN(Number(amount)) ||
                Number(amount) <= 0 ||
                (activeTab === 'withdraw' && wallet && Number(amount) > wallet.balance)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {activeTab === 'deposit' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                  <span>
                    {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} BLURT
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Transaction info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              {activeTab === 'deposit' ? 'Deposit Information' : 'Withdrawal Information'}
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {activeTab === 'deposit'
                ? 'Deposits are processed instantly. For demo purposes, this adds tokens to your balance.'
                : 'Withdrawals are processed instantly. In a real app, this would transfer tokens to your external wallet.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};