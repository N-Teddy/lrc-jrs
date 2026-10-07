export interface IJiFiContactResponse {
  success: boolean;
  data?: {
    number: string;
    exists: boolean;
    quotaConsumed: boolean;
  };
  error?: string;
}

export interface IJiFiSendMessageResponse {
  success: boolean;
  data?: {
    message: string | null;
  };
  meta?: {
    quota: {
      remaining: number;
      limit: number;
      resetAt: string;
    };
  };
  error?: string;
}
