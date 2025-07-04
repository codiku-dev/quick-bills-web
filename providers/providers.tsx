'use client';

import { queryClient } from '@/configs/react-query-config';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ClerkProvider } from '@clerk/nextjs';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ClerkProvider>
    </QueryClientProvider>
  );
}
