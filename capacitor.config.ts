import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.db1ee6277c8f4a4ca47f1d57e5d34860',
  appName: 'Moksha Yatra AI',
  webDir: 'dist',
  // Removed server config to use local assets for better mobile compatibility
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FF6B35',
      showSpinner: false
    }
  }
};

export default config;