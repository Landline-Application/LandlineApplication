# Build Guide

This document provides instructions on how to build the project and run the application.

## Prerequisites

- Node.js
- pnpm
- Android Studio (for Android builds)
- Xcode (for iOS builds)

You can follow the official [Expo environment setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local) for your platform.

## Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:Landline-Application/LandlineApplication.git
   cd LandlineApplication
   ```

2. Install dependencies using pnpm:

   ```bash
   pnpm install
   ```

3. Run the application:

   ```bash
   pnpm start
   ```

4. To run the application on a specific platform, use one of the following commands:

   ```bash
   pnpm android # for Android
   pnpm ios     # for iOS
   pnpm web     # for Web
   ```

## Windows-Specific Setup

If you're building on Windows and encounter Gradle errors related to dependencies, you may need to regenerate the Android build files:

```bash
rm -r android
expo prebuild --clean
pnpm android
```

This is necessary because the Android project needs to be regenerated with the correct dependency linking for your environment. Additionally, configure pnpm to use a flattened node_modules structure, which can help avoid path length issues on Windows:

```bash
pnpm config set node-linker=hoisted
```
