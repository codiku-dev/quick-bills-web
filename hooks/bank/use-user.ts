import { useQuery } from '@tanstack/react-query';
import { useGoCardlessStore } from '@/store/gocardless-store';
import { getUserById } from '@/server/actions/user/user-actions';

export const useUser = (userId: string) => {
  const { setUser } = useGoCardlessStore();

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const user = await getUserById(userId);
      if (user) {
        setUser(user);
      }
      return user;
    },
    enabled: !!userId,
  });
};
