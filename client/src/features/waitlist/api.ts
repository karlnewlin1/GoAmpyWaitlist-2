import { apiClient } from '@/shared/lib/http';

export interface JoinWaitlistParams {
  name: string;
  email: string;
  ref?: string | null;
}

export interface JoinWaitlistResponse {
  code: string;
  referralLink: string;
}

export const waitlistApi = {
  join: async (params: JoinWaitlistParams) => {
    return apiClient.post<JoinWaitlistResponse>('/api/waitlist/join', params);
  },
};