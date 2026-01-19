export type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
  
  export type ApiError = {
    success: false;
    error: string;
    code?: string;
  };
  
  export type ApiSuccess<T = any> = {
    success: true;
    data: T;
    message?: string;
  };
  
  export type PaginatedResponse<T> = ApiSuccess<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  
  export type UploadResponse = ApiSuccess<{
    url: string;
    publicUrl: string;
    path: string;
    size: number;
  }>;
  
  export type OrderSubmissionResponse = ApiSuccess<{
    orderId: string;
    totalAmount: number;
  }>;