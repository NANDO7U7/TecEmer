'use client';

import React from 'react';
import { useNotifications } from '@/lib/useNotifications';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * Notification settings component for the Dashboard.
 * Allows users to enable/disable push notifications.
 */
export default function NotificationSettings() {
    const { permission, isSupported, requestPermission } = useNotifications();

    if (!isSupported) return null;

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-eco-green/10 rounded-xl flex items-center justify-center text-xl">
                        🔔
                    </div>
                    <div>
                        <h4 className="font-semibold text-eco-green-dark text-sm">
                            Notificaciones Push
                        </h4>
                        <p className="text-xs text-eco-gray mt-0.5">
                            {permission === 'granted'
                                ? 'Recibirás alertas al ganar puntos'
                                : permission === 'denied'
                                    ? 'Las notificaciones están bloqueadas'
                                    : 'Activa para recibir alertas de puntos'}
                        </p>
                    </div>
                </div>
                <div>
                    {permission === 'granted' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Activas
                        </span>
                    ) : permission === 'denied' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-medium">
                            Bloqueadas
                        </span>
                    ) : (
                        <Button onClick={requestPermission} variant="primary" size="sm">
                            Activar
                        </Button>
                    )}
                </div>
            </div>

            {permission === 'denied' && (
                <p className="text-xs text-gray-400 mt-3 bg-gray-50 rounded-lg p-2">
                    💡 Para habilitar, ve a la configuración de tu navegador → Permisos del sitio → Notificaciones.
                </p>
            )}
        </Card>
    );
}
