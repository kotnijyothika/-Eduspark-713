const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('eduspark_token');

  const headers: Record<string, string> = {};

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Set Content-Type: application/json only when body is NOT FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Authorization Bearer token from localStorage
  const hasAuthHeader = headers['Authorization'] || headers['authorization'];
  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '' && !hasAuthHeader) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      console.warn(`[fetchApi:HTTP_${response.status}] ${endpoint} failed:`, data.message || 'API request failed');
      throw new Error(data.message || 'API request failed');
    }

    return data as T;
  } catch (error: any) {
    if (!error.message || !error.message.includes('Token missing')) {
      console.error(`[fetchApi:Error] ${endpoint}:`, error.message || error);
    }
    throw new Error(error.message || 'Network error occurred');
  }
};
