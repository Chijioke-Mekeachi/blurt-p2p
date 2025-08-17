import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,   // keep user logged in across reloads
    autoRefreshToken: true, // refresh session automatically
    detectSessionInUrl: true, // important for redirects (Google, etc.)
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  user_id: string;
  type: 'buy' | 'sell';
  amount: number;
  price_per_token: number;
  total_value: number;
  payment_method: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Trade {
  id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  price_per_token: number;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  completed_at?: string;
  offers?: Offer;
  buyer?: Profile;
  seller?: Profile;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  user1?: Profile;
  user2?: Profile;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image';
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: Record<string, any>;
  created_at: string;
}