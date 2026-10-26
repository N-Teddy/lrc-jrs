export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: string;
  error: string;
  message: string | string[];
  details?: Record<string, unknown>;
  path?: string;
  timestamp: string;
}
