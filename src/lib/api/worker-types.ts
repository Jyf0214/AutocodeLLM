export interface Worker {
  id: string;
  name: string;
  type: 'compute' | 'storage' | 'inference';
  status: 'online' | 'offline' | 'busy' | 'error';
  url: string;
  lastHeartbeat: string | null;
  metadata: Record<string, unknown> | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerResponse {
  success: boolean;
  data?: Worker;
  error?: {
    message: string;
    code: string;
  };
}

export interface WorkerListResponse {
  success: boolean;
  data?: Worker[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateWorkerRequest {
  name: string;
  type: 'compute' | 'storage' | 'inference';
  url: string;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}

export interface UpdateWorkerRequest {
  id: string;
  name?: string;
  type?: 'compute' | 'storage' | 'inference';
  status?: 'online' | 'offline' | 'busy' | 'error';
  url?: string;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}
