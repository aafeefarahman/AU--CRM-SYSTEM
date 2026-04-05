import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, token, setUser, logout } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.user),
    enabled: !!token && !user,
    retry: false,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  // If token exists but /me fails (401), axios interceptor handles logout
  return { user: user || data, isLoading: !!token && isLoading };
};
