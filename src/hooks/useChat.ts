import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Conversation {
  id: string;
  user1_email: string;
  user2_email: string;
  last_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_email: string;
  content: string;
  created_at: string;
}

export const useChat = (userEmail: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch conversations by email
  const fetchConversations = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_email.eq.${userEmail},user2_email.eq.${userEmail}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (conversationId: string, senderEmail: string, content: string) => {
    try {
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          sender_email: senderEmail,
          content,
        },
      ]);
      if (error) throw error;

      // update last message in conversation
      await supabase
        .from('conversations')
        .update({ last_message: content, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Create a new conversation
  const createConversation = async (user1Email: string, user2Email: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user1_email: user1Email, user2_email: user2Email }])
        .select()
        .single();

      if (error) throw error;
      return data as Conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  };

  // Subscribe to realtime messages
  useEffect(() => {
    const messageChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [userEmail]);

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
  };
};
