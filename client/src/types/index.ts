export interface User {
  id: string;
  email: string;
  apiKey: string;
  timezone: string;
  activePhoneId?: string | null;
  subscriptionName: string;
  subscriptionStatus?: string | null;
  notificationMessageStatusEnabled: boolean;
  notificationWebhookEnabled: boolean;
  notificationHeartbeatEnabled: boolean;
  notificationNewsletterEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Phone {
  id: string;
  userId: string;
  phoneNumber: string;
  fcmToken?: string | null;
  sim: string;
  messagesPerMinute: number;
  maxSendAttempts: number;
  messageExpirationSeconds: number;
  missedCallAutoReply?: string | null;
  unarchiveThread: boolean;
  archiveNewOutgoingMessageThreads: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  user_id: string;
  request_id?: string | null;
  owner: string;
  contact: string;
  content: string;
  attachments?: string[];
  encrypted: boolean;
  type: string; // 'mobile-terminated' | 'mobile-originated' | 'call/missed'
  status: string; // 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'expired' | 'received'
  sim: string;
  send_duration?: number | null;
  request_received_at?: string;
  order_timestamp?: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  expired_at?: string | null;
  received_at?: string | null;
  failure_reason?: string | null;
  send_attempt_count: number;
  max_send_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface MessageThread {
  id: string;
  user_id: string;
  owner: string;
  contact: string;
  last_message_content?: string | null;
  last_message_timestamp: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone_numbers: string[];
  emails?: string[];
  properties?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Heartbeat {
  id: string;
  user_id: string;
  owner: string;
  version: string;
  charging: boolean;
  timestamp: string;
  created_at: string;
}

export interface PhoneApiKey {
  id: string;
  user_id: string;
  name: string;
  api_key: string;
  phone_numbers: string[];
  phone_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  phone_numbers: string[];
  signing_key: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_messages: number;
  sent_messages: number;
  received_messages: number;
  pending_messages: number;
  failed_messages: number;
  total_phones: number;
  active_phones: number;
  total_contacts: number;
  total_threads: number;
}

