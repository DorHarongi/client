import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.emperium.game',
  appName: 'Emperium',
  webDir: 'dist/client',
  server: {
    url: 'https://emperium.hopto.org',
    cleartext: true,
  },
};

export default config;
