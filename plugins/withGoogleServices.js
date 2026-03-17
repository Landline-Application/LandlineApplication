const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies google-services.json into the android/app directory during prebuild.
 *
 * EAS local builds copy the project to /tmp before running prebuild, so
 * gitignored files like google-services.json are never present in the temp dir.
 * This plugin resolves the file from GOOGLE_SERVICES_JSON env var (absolute path)
 * or falls back to the project root, and copies it directly into place.
 */
const withGoogleServices = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // Resolve source: env var (absolute path) or project root
      const src =
        process.env.GOOGLE_SERVICES_JSON ??
        path.join(config.modRequest.projectRoot, 'google-services.json');

      const dest = path.join(config.modRequest.platformProjectRoot, 'app', 'google-services.json');

      if (!fs.existsSync(src)) {
        throw new Error(
          `google-services.json not found at: ${src}\n` +
            'Set GOOGLE_SERVICES_JSON to the absolute path of the file, ' +
            'or place it in the project root.',
        );
      }

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);

      return config;
    },
  ]);
};

module.exports = withGoogleServices;
