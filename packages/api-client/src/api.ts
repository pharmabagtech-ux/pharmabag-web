import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ─── API Event System ───────────────────────────────
// Allows UI layers to subscribe to API events (e.g., show toasts, trigger logout)

type ApiEventType = 'auth:expired' | 'error:forbidden' | 'error:server' | 'error:network';
type ApiEventListener = (detail?: { message?: string; status?: number }) => void;

const eventListeners = new Map<ApiEventType, Set<ApiEventListener>>();

export function onApiEvent(event: ApiEventType, listener: ApiEventListener): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(listener);
  return () => { eventListeners.get(event)?.delete(listener); };
}

function emitApiEvent(event: ApiEventType, detail?: { message?: string; status?: number }) {
  eventListeners.get(event)?.forEach(fn => fn(detail));
}

// ─── Token Storage ──────────────────────────────────

// In-memory + LocalStorage token storage
let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('pb_access_token') : null;
let refreshTokenStored: string | null = typeof window !== 'undefined' ? localStorage.getItem('pb_refresh_token') : null;

// Safe init to strip literal undefined strings saved by mistake
if (refreshTokenStored === 'undefined' || refreshTokenStored === 'null') {
  refreshTokenStored = null;
  if (typeof window !== 'undefined') localStorage.removeItem('pb_refresh_token');
}

export function setAccessToken(token: string | null, refreshToken?: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pb_access_token', token);
    } else {
      localStorage.removeItem('pb_access_token');
    }
    
    // Explicitly handle truthy checks to prevent stringified null/undefined
    if (refreshToken !== undefined) {
      refreshTokenStored = refreshToken;
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        localStorage.setItem('pb_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('pb_refresh_token');
      }
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshTokenStored;
}

// Determine base URL dynamically
function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    // Client-side: Always use relative /api to leverage Next.js rewrites/proxies
    return '/api';
  }
  const env = (typeof process !== 'undefined' ? process.env : {}) as any;
  const url = env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL;
  // Server-side: fallback to the environment variable or localhost
  return url || 'http://localhost:3000/api';
}

// Create the Axios instance
const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// Request interceptor: inject Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug logging
      console.log(`[API] Token attached to ${config.url}`);
    } else {
      const url = config.url || 'unknown';
      if (!token) {
        console.warn(`[API] No token available for ${url}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const rt = getRefreshToken();
        if (!rt) throw new Error('No refresh token');

        // Use a clean axios instance to avoid infinite loops
        const { data } = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          { refreshToken: rt },
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        const newRefreshToken = data.refreshToken;
        setAccessToken(newToken, newRefreshToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null, null);
        // Notify UI to redirect to login
        emitApiEvent('auth:expired', { message: 'Session expired. Please log in again.' });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Global error handling with event emission
    if (error.response) {
      const { status, data } = error.response as { status: number; data?: any };
      const serverMsg = data?.message || data?.error;
      const url = (originalRequest?.url || '') as string;
      const method = (originalRequest?.method || 'GET').toUpperCase();

      // Endpoints whose errors are handled gracefully by components (fallbacks, empty state, etc)
      const silentEndpoints = ['/products', '/categories', '/manufacturers', '/locations', '/cities', '/discount', '/auth/me', '/config'];
      // Endpoints guarded by backend KYC middleware — suppress 403 for GET requests only
      const kycGuardedEndpoints = ['/cart', '/buyers', '/orders', '/notifications', '/wishlist'];
      const isWriteCartOp = url.startsWith('/cart/add') || url.startsWith('/cart/item/') || (url === '/cart' && method !== 'GET');
      const isReadOnlyEndpoint = !isWriteCartOp && silentEndpoints.some(endpoint => url.includes(endpoint));
      const isKycGuardedGet = method === 'GET' && kycGuardedEndpoints.some(ep => url.includes(ep));
      // KYC-related 403 messages — let component-level handlers show proper UX instead of a generic toast
      const isKycRelated = typeof serverMsg === 'string' && (serverMsg.toLowerCase().includes('kyc') || serverMsg.toLowerCase().includes('onboarding'));

      if (status === 403) {
        console.warn(`[API] 403 Forbidden on ${method} ${url} | ReadOnly: ${isReadOnlyEndpoint} | KycGet: ${isKycGuardedGet} | Token: ${getAccessToken() ? 'present' : 'missing'}`);
        // Suppress toast for read-only endpoints, KYC-guarded GETs, and KYC-related messages
        // Components handle these errors with proper UX (redirect to onboarding, empty states, etc)
        if (!isReadOnlyEndpoint && !isKycGuardedGet && !isKycRelated) {
          emitApiEvent('error:forbidden', { message: serverMsg || 'You do not have permission to perform this action.', status });
        }
      } else if (status >= 500) {
        console.error(`[API] Server error ${status} on ${url}`);
        emitApiEvent('error:server', { message: serverMsg || 'Something went wrong. Please try again later.', status });
      } else if (status === 401) {
        console.warn(`[API] 401 Unauthorized on ${url}`);
      }
    } else if (error.request) {
      emitApiEvent('error:network', { message: 'Network error. Please check your connection.' });
    }

    return Promise.reject(error);
  },
);

export { api };
