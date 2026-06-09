import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { saveToCache, getFromCache, addToQueue } from "./offlineSync";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send httpOnly refresh token cookie
  headers: { "Content-Type": "application/json" },
});

// Token storage (in-memory — never localStorage for access tokens)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

// Request interceptor: inject access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: handle 401 → refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  async (response) => {
    // Save successful GET requests to Cache Store
    if (
      response.config.method?.toLowerCase() === "get" &&
      !response.config.url?.includes("/auth")
    ) {
      const cacheKey =
        (response.config.url || "") +
        JSON.stringify(response.config.params || {});
      await saveToCache(cacheKey, response.data.data);
    }
    return response;
  },
  async (error) => {
    const original = error.config;

    // Handle offline scenario (ERR_NETWORK usually means no internet connection when failing to fetch)
    if (!error.response && error.code === "ERR_NETWORK") {
      const method = original.method?.toLowerCase();
      const url = original.url || "";
      const cacheKey = url + JSON.stringify(original.params || {});

      if (method === "get") {
        const cachedData = await getFromCache(cacheKey);
        if (cachedData) {
          // Mock successful response from cache
          return Promise.resolve({
            data: { success: true, data: cachedData },
          });
        }
      } else if (["post", "put", "delete"].includes(method || "")) {
        // Queue the mutation
        const tempId = `temp-${Date.now()}`;
        const parsedData = original.data ? JSON.parse(original.data) : null;

        await addToQueue({
          id: tempId,
          method: method || "post",
          url: url,
          data: parsedData,
          headers: original.headers,
          timestamp: Date.now(),
        });

        // Mock successful response for optimistic UI update
        const mockData = parsedData || {};
        if (method === "post") {
          mockData._id = tempId;
          mockData.createdAt = new Date().toISOString();
        }
        return Promise.resolve({ data: { success: true, data: mockData } });
      }
    }

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        accessToken = data.data.accessToken;
        setAccessToken(accessToken);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
