import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZenixImob - Painel Master',
  description: 'Gestão multi-tenant ZenixImob',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}