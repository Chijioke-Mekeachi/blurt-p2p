import { useState, useEffect } from 'react';
import { supabase, Offer } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useOffers = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
    if (user) {
      fetchMyOffers();
    }

    // Subscribe to offer changes
    const subscription = supabase
      .channel('offers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
        },
        () => {
          fetchOffers();
          if (user) fetchMyOffers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOffers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyOffers(data || []);
    } catch (error) {
      console.error('Error fetching my offers:', error);
    }
  };

  const createOffer = async (offerData: {
    type: 'buy' | 'sell';
    amount: number;
    price_per_token: number;
    payment_method: string;
    description?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          ...offerData,
          user_id: user.id, // plain column, no foreign key needed
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Offer created successfully!');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error('Failed to create offer');
      throw error;
    }
  };

  const updateOffer = async (offerId: string, updates: Partial<Offer>) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;
      toast.success('Offer updated successfully!');
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error('Failed to update offer');
      throw error;
    }
  };

  const cancelOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;
      toast.success('Offer cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling offer:', error);
      toast.error('Failed to cancel offer');
      throw error;
    }
  };

  return {
    offers,
    myOffers,
    loading,
    createOffer,
    updateOffer,
    cancelOffer,
    refresh: fetchOffers,
  };
};
