import { useState, useEffect } from 'react';
import { supabase, Wallet } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    fetchWallet();

    // Subscribe to wallet changes
    const subscription = supabase
      .channel('wallet_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_email=eq.${user.email}`,
        },
        (payload) => {
          setWallet(payload.new as Wallet);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.email]);

  const fetchWallet = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle(); // safe if no row exists

      if (error) throw error;
      setWallet(data || null);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const deposit = async (amount: number) => {
    if (!user?.email || !wallet) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance + amount })
        .eq('user_email', user.email);

      if (error) throw error;
      toast.success(`Deposited ${amount} BLURT successfully!`);
      setWallet(prev => prev ? { ...prev, balance: prev.balance + amount } : prev);
    } catch (error) {
      console.error('Error depositing:', error);
      toast.error('Failed to deposit funds');
      throw error;
    }
  };

  const withdraw = async (amount: number) => {
    if (!user?.email || !wallet) return;

    if (wallet.balance < amount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('user_email', user.email);

      if (error) throw error;
      toast.success(`Withdrew ${amount} BLURT successfully!`);
      setWallet(prev => prev ? { ...prev, balance: prev.balance - amount } : prev);
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('Failed to withdraw funds');
      throw error;
    }
  };

  return {
    wallet,
    loading,
    deposit,
    withdraw,
    refresh: fetchWallet,
  };
};
