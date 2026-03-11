import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import EcoBot from '@/components/EcoBot';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'EcoScan AI — Reciclaje Inteligente con Visión Artificial | UGB',
    description:
        'Escanea residuos con tu cámara y nuestra IA te indica en qué contenedor depositarlos. Dashboard de métricas, eco-puntos y gestión de herramientas. Universidad Gerardo Barrios.',
    keywords: ['reciclaje', 'inteligencia artificial', 'ecología', 'medio ambiente', 'scanner', 'AI', 'UGB'],
    authors: [{ name: 'EcoScan AI UGB' }],
    openGraph: {
        title: 'EcoScan AI — Reciclaje Inteligente | UGB',
        description: 'Clasifica tus residuos con visión artificial y gana eco-puntos',
        type: 'website',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        viewportFit: 'cover',
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
                <EcoBot />
            </body>
        </html>
    );
}
