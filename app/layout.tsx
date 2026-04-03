import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RISE - Revenue Intelligence',
  description: 'Your AI growth analyst. Real-time revenue intelligence powered by GRIP scoring (Gravity, Reach, Impact, Proof).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
