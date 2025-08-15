import { useState, useEffect } from 'react';
import { supabase, Trade } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrades();

      // Subscribe to trade changes
      const subscription = supabase
        .channel('trades_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trades',
            filter: `buyer_id=eq.${user.id},seller_id=eq.${user.id}`,
          },
          () => {
            fetchTrades();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchTrades = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          offers (
            *,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            )
          ),
          buyer:profiles!buyer_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          seller:profiles!seller_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
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

  const acceptOffer = async (offerId: string, amount: number) => {
    if (!user) return;

    try {
      // First get the offer details
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      const buyerId = offer.type === 'buy' ? offer.user_id : user.id;
      const sellerId = offer.type === 'sell' ? offer.user_id : user.id;

      // Create the trade
      const { error: tradeError } = await supabase
        .from('trades')
        .insert({
          offer_id: offerId,
          buyer_id: buyerId,
          seller_id: sellerId,
          amount,
          price_per_token: offer.price_per_token,
          status: 'pending',
        });

      if (tradeError) throw tradeError;

      // Update offer status if fully accepted
      if (amount >= offer.amount) {
        await supabase
          .from('offers')
          .update({ status: 'completed' })
          .eq('id', offerId);
      }

      toast.success('Offer accepted successfully!');
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer');
      throw error;
    }
  };

  const updateTradeStatus = async (tradeId: string, status: Trade['status']) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', tradeId);

      if (error) throw error;
      toast.success(`Trade ${status} successfully!`);
    } catch (error) {
      console.error('Error updating trade:', error);
      toast.error('Failed to update trade');
      throw error;
    }
  };

  return {
    trades,
    loading,
    acceptOffer,
    updateTradeStatus,
    refresh: fetchTrades,
  };
};