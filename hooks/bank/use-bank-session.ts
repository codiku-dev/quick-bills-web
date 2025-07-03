import { useMutation } from '@tanstack/react-query';
import { initializeSession } from '@/server/actions/gocardless/gocardless-actions';

export const useBankSession = () => {
  return useMutation({
    mutationFn: async (institutionId: string) => {
      const session = await initializeSession(institutionId);
      // Redirect to GoCardless authentication (external URL)
      window.location.href = session.link;
      return session;
    },
  });
};
