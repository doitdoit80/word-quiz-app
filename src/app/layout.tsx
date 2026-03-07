import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: '단어 테스트 앱',
  description: '단어장을 만들고 테스트하세요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} antialiased bg-gray-50 min-h-screen`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
