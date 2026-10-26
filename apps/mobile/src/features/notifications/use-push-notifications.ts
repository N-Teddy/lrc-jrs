import { useAuth, useRegisterPushTokenMutation } from '@jrs/client-core';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Hook to request push notification permissions and register push token
 */
export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth();
  const registerPushTokenMutation = useRegisterPushTokenMutation();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      registeredTokenRef.current = null;
      return;
    }

    let isMounted = true;

    async function registerForPushAsync() {
      try {
        // Dynamic import to support SSR and testing environments
        const Notifications = await import('expo-notifications').catch(
          () => null,
        );
        if (!Notifications) {
          return;
        }

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return;
        }
        cd;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const expoPushToken = tokenData.data;

        if (
          !isMounted ||
          !expoPushToken ||
          registeredTokenRef.current === expoPushToken
        ) {
          return;
        }

        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerPushTokenMutation.mutateAsync({
          token: expoPushToken,
          platform,
        });

        registeredTokenRef.current = expoPushToken;
      } catch {
        // Silently handle environments where push notifications are unsupported (e.g. simulator without certs)
      }
    }

    void registerForPushAsync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, registerPushTokenMutation]);
}
