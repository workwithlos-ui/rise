import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RISE — Revenue Intelligence',
  description: 'Your AI growth analyst. Real-time revenue intelligence. Replaces a $90K/yr analyst.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
