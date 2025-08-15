import { useState, useEffect } from 'react';
import { supabase, Conversation, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();

      // Subscribe to conversation changes
      const conversationSubscription = supabase
        .channel('conversation_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`,
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      // Subscribe to message changes
      const messageSubscription = supabase
        .channel('message_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              setMessages(prev => ({
                ...prev,
                [newMessage.conversation_id]: [
                  ...(prev[newMessage.conversation_id] || []),
                  newMessage
                ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              }));
            }
          }
        )
        .subscribe();

      return () => {
        conversationSubscription.unsubscribe();
        messageSubscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!user1_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          user2:profiles!user2_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      return [];
    }
  };

  const createOrGetConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const user1Id = user.id < otherUserId ? user.id : otherUserId;
      const user2Id = user.id < otherUserId ? otherUserId : user.id;

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
        })
        .select()
        .single();

      if (createError) throw createError;
      
      fetchConversations(); // Refresh conversations list
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  const sendMessage = async (conversationId: string, content: string, messageType: 'text' | 'image' = 'text') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    conversations,
    messages,
    loading,
    fetchMessages,
    createOrGetConversation,
    sendMessage,
    markAsRead,
    refresh: fetchConversations,
  };
};