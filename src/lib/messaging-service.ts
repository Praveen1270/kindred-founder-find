import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  other_profile: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    skills: string[];
  };
  messages: Message[];
  unread_count: number;
}

export class MessagingService {
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by conversation
      const conversations = new Map<string, Conversation>();

      messages?.forEach((message: any) => {
        const isSender = message.sender_id === userId;
        const otherProfile = isSender ? message.receiver : message.sender;
        const conversationId = isSender ? message.receiver_id : message.sender_id;

        if (!conversations.has(conversationId)) {
          conversations.set(conversationId, {
            other_profile: otherProfile,
            messages: [],
            unread_count: 0,
          });
        }

        const conversation = conversations.get(conversationId)!;
        conversation.messages.push({
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          is_read: message.is_read,
          created_at: message.created_at,
        });

        // Count unread messages
        if (!message.is_read && !isSender) {
          conversation.unread_count++;
        }
      });

      return Array.from(conversations.values());
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  static async getMessages(
    userId: string,
    otherUserId: string
  ): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(
    userId: string,
    otherUserId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
} 