import type { Metadata } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'track — AI Transaction Calculator · Audited by Kane CLI',
  description:
    'Upload your ledger. If an agent slips on Pending, Reversed, or duplicate rows, Kane CLI catches the bug and fixes it before you ever see the final number.',
  openGraph: {
    title: 'track — Agents make mistakes. Kane CLI catches & fixes them.',
    description:
      'Upload your CSV or Excel ledger for certified totals — autonomously audited by Kane CLI with a full Audit Evidence Vault and live FX conversion.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'track — Agents make mistakes. Kane CLI catches & fixes them.',
    description:
      'Upload your CSV or Excel ledger for certified totals — autonomously audited by Kane CLI.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${bricolage.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-[#F9F5ED] text-[#11161F] font-sans selection:bg-[#EEE354] selection:text-[#11161F]">
        {children}
      </body>
    </html>
  );
}
