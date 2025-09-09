import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.db1ee6277c8f4a4ca47f1d57e5d34860',
  appName: 'Moksha Yatra AI',
  webDir: 'dist',
  server: {
    url: 'https://db1ee627-7c8f-4a4c-a47f-1d57e5d34860.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FF6B35',
      showSpinner: false
    }
  }
};

export default config;