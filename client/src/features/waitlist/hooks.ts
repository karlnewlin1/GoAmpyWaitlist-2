import { useMutation } from '@tanstack/react-query';
import { waitlistApi, JoinWaitlistParams } from './api';
import { queryClient } from '@/lib/queryClient';

export const useJoinWaitlist = () => {
  return useMutation({
    mutationFn: (params: JoinWaitlistParams) => waitlistApi.join(params),
    onSuccess: () => {
      // Invalidate any cached data that might need refreshing
      queryClient.invalidateQueries({ queryKey: ['/api/me/summary'] });
    },
  });
};