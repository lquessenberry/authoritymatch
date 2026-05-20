import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuthorityMatch — Factor Dashboard',
  description:
    'Manage leads, customize company dashboards, and export factoring pipeline data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
