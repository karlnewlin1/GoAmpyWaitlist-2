import { useQuery } from '@tanstack/react-query';
import { referralApi } from './api';

export const useUserSummary = (email: string | null) => {
  return useQuery({
    queryKey: ['/api/me/summary', email],
    queryFn: () => email ? referralApi.getSummary(email) : Promise.resolve(null),
    enabled: !!email,
    staleTime: 30000, // 30 seconds
  });
};