import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// Define the Trade type based on your table structure
export interface Trade {
  id: string;
  buyer_email?: string;
  seller_email?: string;
  amount?: number;
  price_per_token?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string | null;
  completed_at?: string | null;
  [key: string]: any; // Allow extra fields
}

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTrades();

    // Subscribe to changes in trades table
    const subscription = supabase
      .channel('trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all trades
  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from<Trade>('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  // Create a new trade
  const createTrade = async (trade: Partial<Trade>) => {
    try {
      const { error } = await supabase
        .from<Trade>('trades')
        .insert([{ ...trade, created_at: new Date().toISOString() }]);

      if (error) throw error;
      toast.success('Trade created successfully!');
      fetchTrades();
    } catch (error) {
      console.error('Error creating trade:', error);
      toast.error('Failed to create trade');
    }
  };

  // Update an existing trade
  const updateTrade = async (tradeId: string, updates: Partial<Trade>) => {
    try {
      const { error } = await supabase
        .from<Trade>('trades')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', tradeId);

      if (error) throw error;
      toast.success('Trade updated successfully!');
      fetchTrades();
    } catch (error) {
      console.error('Error updating trade:', error);
      toast.error('Failed to update trade');
    }
  };

  return {
    trades,
    loading,
    createTrade,
    updateTrade,
    refresh: fetchTrades,
  };
};
