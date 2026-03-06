import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'EcoScan AI — Reciclaje Inteligente con Visión Artificial',
    description:
        'Escanea residuos con tu cámara y nuestra IA te indica en qué contenedor depositarlos. Dashboard de métricas, eco-puntos y gestión de herramientas.',
    keywords: ['reciclaje', 'inteligencia artificial', 'ecología', 'medio ambiente', 'scanner', 'AI'],
    authors: [{ name: 'EcoScan AI' }],
    openGraph: {
        title: 'EcoScan AI — Reciclaje Inteligente',
        description: 'Clasifica tus residuos con visión artificial',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={inter.variable}>
            <body className="font-sans antialiased">
                <Navbar />
                {children}
            </body>
        </html>
    );
}
