'use client';

import { useState, useEffect, useCallback } from 'react';

interface EcoNotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    url?: string;
}

/**
 * Hook for Web Push Notifications.
 * Registers service worker, requests permission,
 * and provides methods to send local notifications.
 */
export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported = 'Notification' in window && 'serviceWorker' in navigator;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            registerServiceWorker();
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });
            setSwRegistration(registration);
            return registration;
        } catch (err) {
            console.error('SW registration failed:', err);
            return null;
        }
    };

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch {
            return false;
        }
    }, [isSupported]);

    const sendLocalNotification = useCallback(
        async (options: EcoNotificationOptions) => {
            if (permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) return false;
            }

            try {
                // Try via service worker first (works in background)
                if (swRegistration) {
                    await swRegistration.showNotification(options.title, {
                        body: options.body,
                        icon: options.icon || '/icon-192.png',
                        badge: '/icon-192.png',
                        tag: options.tag || 'ecoscan-' + Date.now(),
                        data: { url: options.url || '/dashboard' },
                    });
                    return true;
                }

                // Fallback: direct Notification API
                new Notification(options.title, {
                    body: options.body,
                    icon: options.icon || '/icon-192.png',
                    tag: options.tag || 'ecoscan-' + Date.now(),
                });
                return true;
            } catch (err) {
                console.error('Notification failed:', err);
                return false;
            }
        },
        [permission, swRegistration, requestPermission]
    );

    // Pre-built notification for eco-points
    const notifyPointsClaimed = useCallback(
        (points: number, material: string) => {
            const materialNames: Record<string, string> = {
                plastico: 'Plástico',
                lata: 'Lata',
                comun: 'Basura Común',
            };

            return sendLocalNotification({
                title: '♻️ ¡Eco-Puntos Acreditados!',
                body: `¡Felicidades! +${points} puntos por reciclar ${materialNames[material] || material}. Revisa tu Dashboard.`,
                tag: 'ecoscan-points',
                url: '/dashboard',
            });
        },
        [sendLocalNotification]
    );

    // Pre-built notification for coupon redemption
    const notifyCouponRedeemed = useCallback(
        (description: string) => {
            return sendLocalNotification({
                title: '🎟️ ¡Cupón Generado!',
                body: `Tu cupón "${description}" está listo. Muéstralo en la UGB Store.`,
                tag: 'ecoscan-coupon',
                url: '/dashboard',
            });
        },
        [sendLocalNotification]
    );

    return {
        permission,
        isSupported,
        requestPermission,
        sendLocalNotification,
        notifyPointsClaimed,
        notifyCouponRedeemed,
    };
}
