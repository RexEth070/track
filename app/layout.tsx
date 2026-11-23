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
    'Upload monthly transaction files and get exact certified totals in seconds — autonomously audited by Kane CLI.',
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
