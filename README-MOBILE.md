# 📱 Moksha Yatra AI - Mobile App Setup

## 🚀 Quick Start for Mobile Development

Your spiritual travel planner is now ready for mobile deployment! Follow these steps to create APK files and run on Android devices.

### 📋 Prerequisites
- Node.js installed
- Android Studio installed
- Git account

### 🔧 Setup Instructions

1. **Export to GitHub**
   - Click "Export to GitHub" button in Lovable
   - Clone your repository locally:
   ```bash
   git clone [your-github-repo-url]
   cd moksha-yatra-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Add Android Platform**
   ```bash
   npx cap add android
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Sync with Capacitor**
   ```bash
   npx cap sync android
   ```

6. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

### 📦 Creating APK File

1. **In Android Studio:**
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Wait for build to complete
   - APK will be generated in: `android/app/build/outputs/apk/debug/`

2. **For Release APK:**
   - Go to `Build` → `Generate Signed Bundle / APK`
   - Choose APK, create/use keystore
   - Select release build variant

### 🔄 Development Workflow

**After making code changes:**
```bash
npm run build
npx cap sync android
npx cap run android  # Runs on emulator/device
```

### 📱 Testing on Physical Device

1. **Enable Developer Options** on your Android phone
2. **Enable USB Debugging**
3. Connect phone via USB
4. Run: `npx cap run android --target [device-id]`

### 🌟 Features Included

✅ **All 29 Indian States** - Complete destination coverage  
✅ **Enhanced UI/UX** - Beautiful spiritual design  
✅ **Mobile-Optimized** - Perfect for phone usage  
✅ **Offline Capability** - Works without internet  
✅ **Fast Performance** - Optimized for mobile  

### 🔗 Useful Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/guide)
- [Lovable Mobile Blog](https://lovable.dev/blogs/TODO)

### 🐛 Troubleshooting

**Build Issues:**
- Clear cache: `npx cap clean android`
- Reinstall: `rm -rf node_modules && npm install`

**Device Not Detected:**
- Check USB debugging is enabled
- Try different USB cable/port
- Run: `adb devices` to verify connection

### 📈 Next Steps

1. **Backend Integration** - Add Supabase for data persistence
2. **Push Notifications** - Real-time travel alerts
3. **Payment Gateway** - Booking integration
4. **Analytics** - User behavior tracking

---

🙏 **Happy Pilgrimage Planning!** 
Your spiritual journey app is ready to guide devotees across India's sacred destinations.