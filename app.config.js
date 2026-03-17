/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'Landline',
  slug: 'landline',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'landlineapplication',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  android: {
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    package: 'com.outersnail.Landline',
    permissions: [
      'android.permission.ACCESS_NOTIFICATION_POLICY',
      'android.permission.BIND_APPWIDGET',
      'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.READ_CONTACTS',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'android.permission.WAKE_LOCK',
    ],
  },

  ios: {
    bundleIdentifier: 'com.outersnail.Landline',
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
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    'expo-web-browser',
    'expo-font',
    './plugins/withGradleOptimizations.js',
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
  },

  owner: 'landline-application',
};

module.exports = { expo: config };
