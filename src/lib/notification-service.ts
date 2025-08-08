import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async sendEmailNotification(
    toEmail: string,
    subject: string,
    message: string
  ): Promise<void> {
    // This would integrate with an email service like SendGrid or AWS SES
    // For now, we'll just log the email
    console.log('Email notification:', {
      to: toEmail,
      subject,
      message,
    });

    // In a real implementation, you would:
    // 1. Use SendGrid, AWS SES, or similar service
    // 2. Send the email with proper formatting
    // 3. Handle delivery status and errors
  }

  static async sendMatchNotification(
    founder1Email: string,
    founder1Name: string,
    founder2Email: string,
    founder2Name: string,
    compatibilityScore: number
  ): Promise<void> {
    const subject = 'New Co-Founder Match Found!';
    const message = `
Hi there!

We found a great potential co-founder match for you!

Match Details:
- Compatibility Score: ${compatibilityScore}%
- Potential Co-founder: ${founder2Name}

This match was made based on:
- Complementary skills
- Similar industry focus
- Aligned startup stage

To connect with your potential co-founder:
1. Log into your FounderCollab dashboard
2. Go to the "Matches" tab
3. Click "Connect" to start a conversation

Best of luck with your startup journey!

The FounderCollab Team
    `;

    // Send to both founders
    await this.sendEmailNotification(founder1Email, subject, message);
    await this.sendEmailNotification(founder2Email, subject, message);
  }
} 