'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Web Serial API hook for Arduino communication.
 * Sends single characters to open recycling bin gates:
 * - 'P' → Verde (Plástico)
 * - 'L' → Amarillo (Latas)
 * - 'C' → Negro (Común)
 */
export function useSerial() {
    const [isConnected, setIsConnected] = useState(false);
    const [isSupported, setIsSupported] = useState(
        typeof window !== 'undefined' && 'serial' in navigator
    );
    const [error, setError] = useState<string | null>(null);
    const portRef = useRef<SerialPort | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

    const connect = useCallback(async () => {
        try {
            setError(null);

            if (!('serial' in navigator)) {
                setIsSupported(false);
                setError('Tu navegador no soporta Web Serial API. Usa Chrome o Edge.');
                return false;
            }

            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 9600 });

            const writer = port.writable?.getWriter();
            if (!writer) {
                setError('No se pudo abrir el puerto serial para escritura.');
                return false;
            }

            portRef.current = port;
            writerRef.current = writer;
            setIsConnected(true);
            return true;
        } catch (err: any) {
            if (err.name === 'NotFoundError') {
                setError('No se seleccionó ningún dispositivo.');
            } else {
                setError(`Error de conexión: ${err.message}`);
            }
            return false;
        }
    }, []);

    const sendSignal = useCallback(async (char: string) => {
        if (!writerRef.current) {
            setError('No hay conexión serial. Conecta el Arduino primero.');
            return false;
        }

        try {
            const encoder = new TextEncoder();
            await writerRef.current.write(encoder.encode(char));
            return true;
        } catch (err: any) {
            setError(`Error al enviar señal: ${err.message}`);
            return false;
        }
    }, []);

    const disconnect = useCallback(async () => {
        try {
            if (writerRef.current) {
                writerRef.current.releaseLock();
                writerRef.current = null;
            }
            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }
            setIsConnected(false);
        } catch (err: any) {
            setError(`Error al desconectar: ${err.message}`);
        }
    }, []);

    return { isConnected, isSupported, error, connect, sendSignal, disconnect };
}
