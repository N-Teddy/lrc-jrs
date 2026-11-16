import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev =
    process.env.APP_ENV === 'development' ||
    process.env.NODE_ENV !== 'production';

  const appName = isDev ? 'LRC JRS (Dev)' : 'LRC JRS';
  const appSlug = isDev ? 'lrc-jrs-dev' : 'lrc-jrs';
  const appScheme = isDev ? 'lrc-jrs-dev' : 'lrc-jrs';
  const appId = isDev ? 'com.lrc.jrs.dev' : 'com.lrc.jrs';

  return {
    ...config,
    name: appName,
    slug: appSlug,
    scheme: appScheme,
    version: config.version || '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: appId,
    },
    android: {
      ...config.android,
      package: appId,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      ...config.web,
      favicon: './assets/favicon.png',
    },
    extra: {
      ...config.extra,
      isDev,
    },
  };
};
