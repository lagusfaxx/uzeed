import './globals.css';
import type { Metadata } from 'next';
import { Nav } from './_components/Nav';

export const metadata: Metadata = {
  title: 'UZEED Only MVP',
  description: 'Demo paywall + feed'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
