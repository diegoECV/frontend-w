import axios from 'axios';

const getDynamicBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:9090/api/v1`;
};

export const BASE_URL = getDynamicBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Obtener un token JWT válido de forma silenciosa para admin en entorno de desarrollo/dashboard
 */
export async function obtainAdminToken(): Promise<string | null> {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'diego@visons.com',
      password: 'password123',
    });
    if (res.data?.token) {
      localStorage.setItem('visons_jwt', res.data.token);
      return res.data.token;
    }
  } catch (err) {
    console.warn('No se pudo autenticar automáticamente con el backend:', err);
  }
  return null;
}

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('visons_jwt');
  
  // Si no hay token o no tiene estructura JWT (ej. mock tokens 'jwt-admin-123')
  if (!token || !token.includes('.') || token.split('.').length !== 3) {
    const freshToken = await obtainAdminToken();
    if (freshToken) {
      token = freshToken;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si recibimos 401 y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await obtainAdminToken();
        if (newToken) {
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
