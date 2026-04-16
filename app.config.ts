import { ConfigContext, ExpoConfig } from 'expo/config';

import fs from 'fs';
import path from 'path';

/** Committed stub so prebuild works without a real Firebase file; replace for production auth. */
const PLACEHOLDER_GOOGLE_SERVICES = './config/google-services.placeholder.json';

/**
 * Prefer GOOGLE_SERVICES_JSON, then ./google-services.json (gitignored).
 * Fall back to a committed placeholder: @react-native-firebase/app requires a path during prebuild.
 */
function resolveGoogleServicesFile(): string {
  const envPath = process.env.GOOGLE_SERVICES_JSON?.trim();
  const fromEnv = envPath && envPath.length > 0;
  const candidate = fromEnv ? envPath! : path.join(process.cwd(), 'google-services.json');
  if (fs.existsSync(candidate)) {
    return fromEnv ? envPath! : './google-services.json';
  }
  return PLACEHOLDER_GOOGLE_SERVICES;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Landline',
    slug: 'landline',
    version: '0.9.0',
    orientation: 'portrait',
    icon: './assets/landline-icon.png',
    scheme: 'landlineapplication',
    userInterfaceStyle: 'automatic',

    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/landline-icon.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/landline-icon.png',
      },
      package: 'com.outersnail.Landline',
      permissions: [
        'android.permission.ACCESS_NOTIFICATION_POLICY',
        'android.permission.BIND_APPWIDGET',
        'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        'android.permission.CALL_PHONE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.READ_CONTACTS',
        'android.permission.READ_PHONE_STATE',
        'android.permission.RECEIVE_SMS',
        'android.permission.SEND_SMS',
        'android.permission.WAKE_LOCK',
      ],
      googleServicesFile: resolveGoogleServicesFile(),
    },

    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-google-signin/google-signin',
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/landline-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-web-browser',
      ['expo-notifications', { icon: './assets/landline-icon.png', color: '#5D7052' }],
      [
        'expo-font',
        {
          fonts: [
            'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
            'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
            'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
            'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
            'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf',
          ],
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: '9054e1e3-4810-4d81-acef-067671c365a8',
      },
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    },

    owner: 'landline-application',
  };
};
