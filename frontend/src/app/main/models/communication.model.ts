export type MessageType = 'email' | 'sms' | 'push';
export type CommStatus = 'sent' | 'failed' | 'queued' | 'skipped';

export interface Communication {
  CommunicationId: number;
  UserId: number;
  MessageType: MessageType;
  Status: CommStatus;
  SentTo: string | null;
  SentTime: string;  // ISO (UTC)
  CreatedAt: string; // ISO (UTC)
}

export interface CommsSummary {
  windowStart: string; // ISO
  windowEnd: string;   // ISO
  total: number;
  email: { sent: number; failed: number; queued: number; skipped: number; };
  sms:   { sent: number; failed: number; queued: number; skipped: number; };
  push:  { sent: number; failed: number; queued: number; skipped: number; };
}

export interface SmsCountToday {
  userId: number;
  count: number;
}

export interface ListParams {
  from?: string; // ISO string, e.g. new Date(...).toISOString()
  to?: string;   // ISO string
  limit?: number;
}
