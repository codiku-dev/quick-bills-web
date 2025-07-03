
import { APP_CONFIG } from '@/configs/app-config';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

type Props = {
  children: ReactNode;
};

export function BaseLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
