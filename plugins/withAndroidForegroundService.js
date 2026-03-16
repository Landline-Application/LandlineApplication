const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add the NotificationForegroundService to AndroidManifest.xml
 */
const withAndroidForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;

    // Ensure application tag exists
    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];

    // Initialize service array if it doesn't exist
    if (!application.service) {
      application.service = [];
    }

    // Check if our service already exists
    const serviceExists = application.service.some(
      (service) =>
        service.$?.['android:name'] ===
        'expo.modules.backgroundservicemanager.NotificationForegroundService',
    );

    // Add the service if it doesn't exist
    if (!serviceExists) {
      application.service.push({
        $: {
          'android:name': 'expo.modules.backgroundservicemanager.NotificationForegroundService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'Notification monitoring service for Landline Mode',
            },
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withAndroidForegroundService;
