import { useAuth } from './AuthContext';

export function useApi() {
  const { token, refreshToken, logout } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let currentToken = token;

    const makeRequest = (t: string | null) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
      });
    };

    let response = await makeRequest(currentToken);

    if (response.status === 403 || response.status === 401) {
      // Try to refresh
      const newToken = await refreshToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        logout();
      }
    }

    return response;
  };

  return { fetchWithAuth };
}
