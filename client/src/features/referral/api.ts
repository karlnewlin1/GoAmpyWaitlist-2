import { apiClient } from '@/shared/lib/http';

export interface UserSummary {
  points: number;
  referrals: number;
  rank: number;
}

export const referralApi = {
  getSummary: async (email: string) => {
    return apiClient.get<UserSummary>(`/api/me/summary?email=${encodeURIComponent(email)}`);
  },
};