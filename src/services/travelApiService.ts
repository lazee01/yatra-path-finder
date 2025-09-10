import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from '@/components/ui/use-toast';
import { AuthService } from './authService';
import { DatabaseService } from './databaseService';
import { StorageService } from './storageService';

// Types for API responses
interface OpenTripMapPlace {
  xid: string;
  name: string;
  kinds: string;
  point: { lat: number; lon: number };
  preview?: { source: string };
  wikipedia_extracts?: { text: string };
}

interface BookingHotel {
  hotel_name?: string;
  name?: string;
  review_score?: string;
  price_breakdown?: { all_inclusive_price: number };
  city?: string;
  facilities?: string[];
  max_photo_url?: string;
  is_free_cancellable?: boolean;
  hotel_id?: string;
}

interface AmadeusFlight {
  id: string;
  validatingAirlineCodes: string[];
  price: { total: number; currency: string };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; terminal?: string; at: string };
      arrival: { iataCode: string; terminal?: string; at: string };
      carrierCode: string;
      number: string;
      aircraft?: { code: string };
      duration: string;
    }>;
  }>;
}

interface IndianRailFare {
  Name: string;
  Code: string;
  Fare: string;
}

interface IndianRailTrain {
  train_number?: string;
  train_name?: string;
  number?: string;
  name?: string;
  departure_time?: string;
  arrival_time?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  fares?: IndianRailFare[];
}
export interface HotelData {
  name: string;
  rating: number;
  price: number;
  location: string;
  amenities: string[];
  imageUrl: string;
  cancellation: string;
}

export interface TransportData {
  type: 'train' | 'flight' | 'bus';
  name: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  class: string;
}

export interface TempleData {
  name: string;
  location: string;
  pujaTimings: string;
  description: string;
  imageUrl: string;
  onlineBooking: boolean;
  coordinates: { lat: number; lng: number };
}

export interface AttractionData {
  name: string;
  type: string;
  description: string;
  rating: number;
  imageUrl: string;
  coordinates: { lat: number; lng: number };
}

export class TravelApiService {
  private static BASE_URLS = {
    places: 'https://api.opentripmap.com/0.1/en/places',
    geocoding: 'https://api.opencagedata.com/geocode/v1/json',
    weather: 'https://api.openweathermap.org/data/2.5/weather',
  };

  // ===== CUSTOM DATA MANAGEMENT =====

  // Custom data storage (fallback for non-authenticated users)
  private static customData = {
    destinations: [] as string[],
    temples: [] as TempleData[],
    hotels: [] as HotelData[],
    trains: [] as TransportData[],
    attractions: [] as AttractionData[],
    userPreferences: {} as Record<string, unknown>
  };

  // Helper method to get current user ID
  private static getCurrentUserId(): string | null {
    const user = AuthService.getCurrentUser();
    return user ? user.uid : null;
  }

  // Helper method to check if user is authenticated
  private static isAuthenticated(): boolean {
    return this.getCurrentUserId() !== null;
  }

  // Load custom data from localStorage
  private static loadCustomData() {
    try {
      const stored = localStorage.getItem('yatraCustomData');
      if (stored) {
        this.customData = { ...this.customData, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading custom data:', error);
    }
  }

  // Save custom data to localStorage
  private static saveCustomData() {
    try {
      localStorage.setItem('yatraCustomData', JSON.stringify(this.customData));
    } catch (error) {
      console.error('Error saving custom data:', error);
    }
  }

  // ===== CUSTOM DATA MANAGEMENT METHODS =====

  // Add custom temple
  static async addCustomTemple(temple: Omit<TempleData, 'coordinates'> & { coordinates?: { lat: number; lng: number } }) {
    const newTemple: TempleData = {
      ...temple,
      coordinates: temple.coordinates || { lat: 25.3176, lng: 82.9739 }, // Default coordinates
      imageUrl: temple.imageUrl || `/api/placeholder/300/200?temple=${Date.now()}`
    };

    if (this.isAuthenticated()) {
      const userId = this.getCurrentUserId()!;
      const result = await DatabaseService.saveCustomTemple(userId, newTemple);
      if (result.success) {
        return newTemple;
      } else {
        console.error('Failed to save temple to Firebase:', result.error);
        // Fallback to localStorage
      }
    }

    // Fallback to localStorage
    this.loadCustomData();
    this.customData.temples.push(newTemple);
    this.saveCustomData();
    return newTemple;
  }

  // Add custom hotel
  static addCustomHotel(hotel: Omit<HotelData, 'imageUrl'> & { imageUrl?: string }) {
    this.loadCustomData();
    const newHotel: HotelData = {
      ...hotel,
      imageUrl: hotel.imageUrl || `/api/placeholder/300/200?hotel=${Date.now()}`
    };
    this.customData.hotels.push(newHotel);
    this.saveCustomData();
    return newHotel;
  }

  // Add custom train
  static addCustomTrain(train: TransportData) {
    this.loadCustomData();
    this.customData.trains.push(train);
    this.saveCustomData();
    return train;
  }

  // Add custom attraction
  static addCustomAttraction(attraction: Omit<AttractionData, 'imageUrl'> & { imageUrl?: string }) {
    this.loadCustomData();
    const newAttraction: AttractionData = {
      ...attraction,
      imageUrl: attraction.imageUrl || `/api/placeholder/300/200?attraction=${Date.now()}`
    };
    this.customData.attractions.push(newAttraction);
    this.saveCustomData();
    return newAttraction;
  }

  // Get all custom data
  static async getCustomData() {
    if (this.isAuthenticated()) {
      const userId = this.getCurrentUserId()!;

      try {
        const [templesResult, hotelsResult, transportResult, attractionsResult, preferencesResult] = await Promise.all([
          DatabaseService.getCustomTemples(userId),
          DatabaseService.getCustomHotels(userId),
          DatabaseService.getCustomTransport(userId),
          DatabaseService.getCustomAttractions(userId),
          DatabaseService.getUserPreferences(userId)
        ]);

        return {
          destinations: [],
          temples: templesResult.success ? templesResult.data : [],
          hotels: hotelsResult.success ? hotelsResult.data : [],
          trains: transportResult.success ? transportResult.data : [],
          attractions: attractionsResult.success ? attractionsResult.data : [],
          userPreferences: preferencesResult.success ? preferencesResult.data : {}
        };
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        // Fallback to localStorage
      }
    }

    // Fallback to localStorage
    this.loadCustomData();
    return this.customData;
  }

  // Delete custom item
  static deleteCustomItem(type: 'temples' | 'hotels' | 'trains' | 'attractions', index: number) {
    this.loadCustomData();
    if (this.customData[type] && this.customData[type][index]) {
      this.customData[type].splice(index, 1);
      this.saveCustomData();
      return true;
    }
    return false;
  }

  // Update custom item
  static updateCustomItem(type: 'temples' | 'hotels' | 'trains' | 'attractions', index: number, updates: Record<string, unknown>) {
    this.loadCustomData();
    if (this.customData[type] && this.customData[type][index]) {
      this.customData[type][index] = { ...this.customData[type][index], ...updates };
      this.saveCustomData();
      return this.customData[type][index];
    }
    return null;
  }

  // Set user preferences
  static async setUserPreferences(preferences: Record<string, unknown>) {
    if (this.isAuthenticated()) {
      const userId = this.getCurrentUserId()!;
      const result = await DatabaseService.saveUserPreferences(userId, preferences);
      if (result.success) {
        return;
      } else {
        console.error('Failed to save preferences to Firebase:', result.error);
        // Fallback to localStorage
      }
    }

    // Fallback to localStorage
    this.loadCustomData();
    this.customData.userPreferences = { ...this.customData.userPreferences, ...preferences };
    this.saveCustomData();
  }

  // Get user preferences
  static async getUserPreferences() {
    if (this.isAuthenticated()) {
      const userId = this.getCurrentUserId()!;
      const result = await DatabaseService.getUserPreferences(userId);
      if (result.success) {
        return result.data;
      } else {
        console.error('Failed to get preferences from Firebase:', result.error);
        // Fallback to localStorage
      }
    }

    // Fallback to localStorage
    this.loadCustomData();
    return this.customData.userPreferences;
  }

  // API keys with validation
  private static API_KEYS = {
    opentripmap: import.meta.env.VITE_OPENTRIPMAP_API_KEY || '',
    opencage: import.meta.env.VITE_OPENCAGE_API_KEY || '',
    openweather: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
    gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
    indianRail: {
      apiKey: import.meta.env.VITE_INDIAN_RAIL_API_KEY || '',
      host: import.meta.env.VITE_INDIAN_RAIL_API_HOST || 'indian-railway-irctc.p.rapidapi.com'
    },
    amadeus: {
      apiKey: import.meta.env.VITE_AMADEUS_API_KEY || '',
      apiSecret: import.meta.env.VITE_AMADEUS_API_SECRET || ''
    },
    booking: {
      apiKey: import.meta.env.VITE_BOOKING_API_KEY || '',
      host: import.meta.env.VITE_BOOKING_API_HOST || 'booking-com15.p.rapidapi.com'
    },
  };

  // API validation and status tracking
  private static apiStatus = {
    opentripmap: { working: false, lastChecked: 0 },
    opencage: { working: false, lastChecked: 0 },
    openweather: { working: false, lastChecked: 0 },
    gemini: { working: false, lastChecked: 0 },
    indianRail: { working: false, lastChecked: 0 },
    amadeus: { working: false, lastChecked: 0 },
    booking: { working: false, lastChecked: 0 }
  };

  // Check if API key is valid (not empty, not demo, not placeholder)
  private static isValidApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === '') return false;
    if (apiKey.toLowerCase().includes('demo')) return false;
    if (apiKey.toLowerCase().includes('your_')) return false;
    if (apiKey.toLowerCase().includes('placeholder')) return false;
    if (apiKey.length < 10) return false; // Most API keys are longer than 10 chars
    return true;
  }

  // Test API connectivity
  private static async testApiConnectivity(apiName: string, testUrl: string, headers?: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: headers || {},
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const isWorking = response.ok || response.status === 401; // 401 means API key issues, but API is reachable
      this.apiStatus[apiName as keyof typeof this.apiStatus] = {
        working: isWorking,
        lastChecked: Date.now()
      };

      console.log(`${apiName} API test: ${isWorking ? '✅ Working' : '❌ Failed'} (${response.status})`);
      return isWorking;
    } catch (error) {
      console.warn(`${apiName} API test failed:`, error);
      this.apiStatus[apiName as keyof typeof this.apiStatus] = {
        working: false,
        lastChecked: Date.now()
      };
      return false;
    }
  }

  // AI Models Configuration
  private static genAI = new GoogleGenerativeAI(this.API_KEYS.gemini);

  // Hugging Face API Configuration (for future backend integration)
  private static HUGGINGFACE_CONFIG = {
    apiUrl: 'https://api-inference.huggingface.co/models',
    travelModel: 'google/flan-t5-large', // More accurate than small
    apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY || '',
    fallbackEnabled: true
  };

  // Amadeus access token storage
  private static amadeusToken: { token: string; expires: number } | null = null;

  // Get coordinates for a destination with improved error handling
  static async getCoordinates(destination: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Validate destination input
      const validation = this.validateDestination(destination);
      if (!validation.isValid) {
        console.warn('Invalid destination:', validation.error);
        return this.getMockCoordinates(destination);
      }

      const cleanDestination = validation.sanitized;

      // Check if OpenCage API key is valid
      if (!this.isValidApiKey(this.API_KEYS.opencage)) {
        console.warn('OpenCage API key not configured or invalid, using mock coordinates');
        return this.getMockCoordinates(cleanDestination);
      }

      // Test API connectivity if not recently checked
      const lastChecked = this.apiStatus.opencage.lastChecked;
      if (Date.now() - lastChecked > 300000) { // Check every 5 minutes
        const testUrl = `${this.BASE_URLS.geocoding}?q=test&key=${this.API_KEYS.opencage}&limit=1`;
        await this.testApiConnectivity('opencage', testUrl);
      }

      // Skip API call if we know it's not working
      if (!this.apiStatus.opencage.working && Date.now() - lastChecked < 3600000) { // Within last hour
        console.warn('OpenCage API previously failed, using mock coordinates');
        return this.getMockCoordinates(cleanDestination);
      }

      console.log(`🔍 Fetching coordinates for: ${cleanDestination}`);

      const response = await fetch(
        `${this.BASE_URLS.geocoding}?q=${encodeURIComponent(cleanDestination)}&key=${this.API_KEYS.opencage}&limit=1`,
        {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (!response.ok) {
        console.warn(`OpenCage API error: ${response.status} ${response.statusText}`);
        return this.getMockCoordinates(cleanDestination);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const coordinates = {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        };

        console.log(`✅ Found coordinates for ${cleanDestination}:`, coordinates);
        return coordinates;
      }

      console.warn(`No coordinates found for ${cleanDestination}, using mock data`);
      return this.getMockCoordinates(cleanDestination);

    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return this.getMockCoordinates(destination);
    }
  }

  // Mock coordinates for destinations when API is not available
  private static getMockCoordinates(destination: string): { lat: number; lng: number } {
    const coordinates: Record<string, { lat: number; lng: number }> = {
      'varanasi': { lat: 25.3176, lng: 82.9739 },
      'tirupati': { lat: 13.6288, lng: 79.4192 },
      'rishikesh': { lat: 30.0869, lng: 78.2676 },
      'haridwar': { lat: 29.9457, lng: 78.1642 },
      'kedarnath': { lat: 30.7346, lng: 79.0669 },
      'badrinath': { lat: 30.7433, lng: 79.4938 },
      'amritsar': { lat: 31.6340, lng: 74.8723 },
      'mysore': { lat: 12.2958, lng: 76.6394 },
      'hampi': { lat: 15.3350, lng: 76.4600 },
      'goa': { lat: 15.2993, lng: 74.1240 },
      'kerala': { lat: 10.8505, lng: 76.2711 },
      'kanyakumari': { lat: 8.0883, lng: 77.5385 },
      'madurai': { lat: 9.9252, lng: 78.1198 },
      'thanjavur': { lat: 10.7870, lng: 79.1378 },
      'puri': { lat: 19.8135, lng: 85.8312 },
      'konark': { lat: 19.8876, lng: 86.0945 },
      'ajmer': { lat: 26.4499, lng: 74.6399 },
      'pushkar': { lat: 26.4897, lng: 74.5511 },
      'udaipur': { lat: 24.5854, lng: 73.7125 },
      'jaipur': { lat: 26.9124, lng: 75.7873 },
      'jodhpur': { lat: 26.2389, lng: 73.0243 },
      'jaisalmer': { lat: 26.9157, lng: 70.9083 },
      'bikaner': { lat: 28.0229, lng: 73.3119 },
      'mount abu': { lat: 24.5925, lng: 72.7156 },
      'chittorgarh': { lat: 24.8887, lng: 74.6269 }
    };

    const normalizedDestination = destination.toLowerCase().trim();
    return coordinates[normalizedDestination] || { lat: 20.5937, lng: 78.9629 }; // Default to India center
  }

  // Get temples and spiritual places with improved API handling
  static async getTemples(destination: string): Promise<TempleData[]> {
    console.log(`🏛️ Fetching temples for: ${destination}`);

    try {
      // Load custom temples for this destination
      let customTemples: TempleData[] = [];

      if (this.isAuthenticated()) {
        const userId = this.getCurrentUserId()!;
        const result = await DatabaseService.getCustomTemples(userId);
        if (result.success) {
          customTemples = result.data.filter(
            temple => temple.location.toLowerCase().includes(destination.toLowerCase())
          );
          console.log(`📋 Found ${customTemples.length} custom temples`);
        }
      } else {
        // Fallback to localStorage
        this.loadCustomData();
        customTemples = this.customData.temples.filter(
          temple => temple.location.toLowerCase().includes(destination.toLowerCase())
        );
      }

      const coords = await this.getCoordinates(destination);
      if (!coords) {
        console.warn('No coordinates available, using mock temples');
        return [...customTemples, ...this.getMockTemples(destination)];
      }

      // Check if OpenTripMap API key is valid
      if (!this.isValidApiKey(this.API_KEYS.opentripmap)) {
        console.warn('OpenTripMap API key not configured or invalid, using mock temples');
        return [...customTemples, ...this.getMockTemples(destination)];
      }

      // Test API connectivity if not recently checked
      const lastChecked = this.apiStatus.opentripmap.lastChecked;
      if (Date.now() - lastChecked > 300000) { // Check every 5 minutes
        const testUrl = `${this.BASE_URLS.places}/radius?radius=1000&lon=0&lat=0&kinds=religion&format=json&apikey=${this.API_KEYS.opentripmap}`;
        await this.testApiConnectivity('opentripmap', testUrl);
      }

      // Skip API call if we know it's not working
      if (!this.apiStatus.opentripmap.working && Date.now() - lastChecked < 3600000) { // Within last hour
        console.warn('OpenTripMap API previously failed, using mock temples');
        return [...customTemples, ...this.getMockTemples(destination)];
      }

      console.log(`🔍 Searching for temples near ${destination} (${coords.lat}, ${coords.lng})`);

      // Using OpenTripMap API for places of worship with timeout
      const response = await fetch(
        `${this.BASE_URLS.places}/radius?radius=15000&lon=${coords.lng}&lat=${coords.lat}&kinds=religion&format=json&apikey=${this.API_KEYS.opentripmap}`,
        {
          signal: AbortSignal.timeout(15000) // 15 second timeout
        }
      );

      let apiTemples: TempleData[] = [];
      if (response.ok) {
        const places = await response.json();
        console.log(`✅ OpenTripMap returned ${places.length} places`);

        apiTemples = places.slice(0, 5).map((place: OpenTripMapPlace) => ({
          name: place.name || 'Sacred Temple',
          location: destination,
          pujaTimings: '5:00 AM - 12:00 PM, 4:00 PM - 9:00 PM',
          description: place.wikipedia_extracts?.text || 'Ancient temple with rich spiritual heritage',
          imageUrl: place.preview?.source || `/api/placeholder/300/200?temple=${Date.now()}`,
          onlineBooking: Math.random() > 0.5,
          coordinates: { lat: place.point.lat, lng: place.point.lon }
        }));

        console.log(`✅ Processed ${apiTemples.length} temples from API`);
      } else {
        console.warn(`OpenTripMap API error: ${response.status} ${response.statusText}`);
      }

      // Combine custom temples, API temples, and mock temples
      const allTemples = [...customTemples, ...apiTemples, ...this.getMockTemples(destination)];

      // Remove duplicates based on name
      const uniqueTemples = allTemples.filter((temple, index, self) =>
        index === self.findIndex(t => t.name.toLowerCase() === temple.name.toLowerCase())
      );

      const finalTemples = uniqueTemples.slice(0, 8);
      console.log(`📋 Returning ${finalTemples.length} unique temples`);

      return finalTemples;

    } catch (error) {
      console.error('Error fetching temples:', error);

      // Return custom temples + mock temples on error
      let customTemples: TempleData[] = [];

      if (this.isAuthenticated()) {
        const userId = this.getCurrentUserId()!;
        const result = await DatabaseService.getCustomTemples(userId);
        if (result.success) {
          customTemples = result.data.filter(
            temple => temple.location.toLowerCase().includes(destination.toLowerCase())
          );
        }
      } else {
        this.loadCustomData();
        customTemples = this.customData.temples.filter(
          temple => temple.location.toLowerCase().includes(destination.toLowerCase())
        );
      }

      return [...customTemples, ...this.getMockTemples(destination)];
    }
  }


  // Enhanced mock data with realistic variety for each destination
  private static getMockTemples(destination: string): TempleData[] {
    const temples: Record<string, Array<{ name: string; pujaTimings: string; onlineBooking: boolean; description: string }>> = {
      varanasi: [
        { name: 'Kashi Vishwanath Temple', pujaTimings: '4:00 AM - 11:00 PM', onlineBooking: true, description: 'One of the 12 Jyotirlingas, dedicated to Lord Shiva with golden dome' },
        { name: 'Sankat Mochan Hanuman Temple', pujaTimings: '5:00 AM - 10:00 PM', onlineBooking: false, description: 'Famous temple known for removing obstacles, founded by Tulsidas' },
        { name: 'Durga Temple', pujaTimings: '6:00 AM - 12:00 PM, 4:00 PM - 9:00 PM', onlineBooking: true, description: 'Ancient temple dedicated to Goddess Durga with rich history' },
        { name: 'Tulsi Manas Temple', pujaTimings: '5:30 AM - 9:00 PM', onlineBooking: false, description: 'Temple dedicated to Lord Rama, built by Tulsidas himself' },
        { name: 'Kal Bhairav Temple', pujaTimings: '6:00 AM - 10:00 PM', onlineBooking: false, description: 'Temple dedicated to Lord Bhairav, protector of Varanasi' },
        { name: 'Annapurna Temple', pujaTimings: '7:00 AM - 12:00 PM, 4:00 PM - 8:00 PM', onlineBooking: true, description: 'Temple dedicated to Goddess Annapurna, provider of food' },
        { name: 'Ram Nagar Fort Temple', pujaTimings: '8:00 AM - 6:00 PM', onlineBooking: false, description: 'Ancient fort with temple dedicated to Lord Rama' },
        { name: 'Bindhyabasini Temple', pujaTimings: '5:00 AM - 9:00 PM', onlineBooking: true, description: 'Temple dedicated to Goddess Durga with scenic views' }
      ],
      tirupati: [
        { name: 'Sri Venkateswara Temple', pujaTimings: '2:30 AM - 1:00 AM', onlineBooking: true, description: 'World-famous temple, one of the richest temples in the world' },
        { name: 'Sri Kapileswara Swamy Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Ancient temple dedicated to Lord Shiva on the hill' },
        { name: 'ISKCON Tirupati', pujaTimings: '4:30 AM - 1:00 PM, 4:00 PM - 8:30 PM', onlineBooking: true, description: 'Modern Krishna temple with daily spiritual programs' },
        { name: 'Padmavathi Temple', pujaTimings: '5:00 AM - 9:00 PM', onlineBooking: true, description: 'Temple dedicated to Goddess Padmavathi, consort of Lord Venkateswara' },
        { name: 'Govindaraja Swamy Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Ancient temple with beautiful architecture and sculptures' },
        { name: 'Kodandaramaswamy Temple', pujaTimings: '5:30 AM - 9:00 PM', onlineBooking: true, description: 'Temple dedicated to Lord Rama with family' }
      ],
      rishikesh: [
        { name: 'Triveni Ghat Temple', pujaTimings: '5:00 AM - 10:00 PM', onlineBooking: false, description: 'Sacred confluence of Ganges, Yamuna and Saraswati rivers' },
        { name: 'Kedar Nath Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Ancient temple dedicated to Lord Shiva in the mountains' },
        { name: 'Ramana\'s Garden Cafe Temple', pujaTimings: '7:00 AM - 7:00 PM', onlineBooking: false, description: 'Peaceful meditation center with yoga and spiritual activities' },
        { name: 'Neer Garh Waterfall Temple', pujaTimings: '8:00 AM - 6:00 PM', onlineBooking: false, description: 'Natural waterfall with spiritual ambiance' },
        { name: 'Parmarth Niketan Ashram', pujaTimings: '5:00 AM - 9:00 PM', onlineBooking: true, description: 'Spiritual retreat center with daily prayers and meditation' },
        { name: 'Chotiwala Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Ancient temple with traditional Garhwali architecture' }
      ],
      haridwar: [
        { name: 'Har Ki Pauri', pujaTimings: '24 Hours', onlineBooking: false, description: 'Most sacred bathing ghat, site of famous Ganga Aarti ceremony' },
        { name: 'Chandi Devi Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Temple dedicated to Goddess Chandi on Chandikund hill' },
        { name: 'Maya Devi Temple', pujaTimings: '5:30 AM - 9:00 PM', onlineBooking: false, description: 'Ancient temple with rich mythology and history' },
        { name: 'Mansa Devi Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: true, description: 'Temple dedicated to Goddess Mansa Devi with cable car access' },
        { name: 'Bharat Mata Temple', pujaTimings: '7:00 AM - 7:00 PM', onlineBooking: false, description: 'Unique temple with relief map of India carved in marble' },
        { name: 'Sapt Rishi Ashram', pujaTimings: '5:00 AM - 9:00 PM', onlineBooking: false, description: 'Ancient ashram associated with seven sages' }
      ],
      amritsar: [
        { name: 'Golden Temple', pujaTimings: '24 Hours', onlineBooking: false, description: 'The holiest Sikh shrine, Harmandir Sahib with golden dome' },
        { name: 'Durgiana Temple', pujaTimings: '5:00 AM - 10:00 PM', onlineBooking: false, description: 'Beautiful Hindu temple with golden dome and lake' },
        { name: 'Jallianwala Bagh Memorial', pujaTimings: '9:00 AM - 5:00 PM', onlineBooking: false, description: 'Historical site commemorating Jallianwala Bagh massacre' },
        { name: 'Akal Takht', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Supreme Sikh authority seat, part of Golden Temple complex' },
        { name: 'Ram Bagh Gardens', pujaTimings: '8:00 AM - 6:00 PM', onlineBooking: false, description: 'Historic Mughal gardens with fountains and pavilions' },
        { name: 'Partition Museum', pujaTimings: '10:00 AM - 5:00 PM', onlineBooking: true, description: 'Museum documenting the 1947 partition of India' }
      ],
      mysore: [
        { name: 'Chamundeshwari Temple', pujaTimings: '7:30 AM - 2:00 PM, 3:30 PM - 8:00 PM', onlineBooking: false, description: 'Temple dedicated to Goddess Chamundi on Chamundi Hill' },
        { name: 'Lalitha Mahal Palace Temple', pujaTimings: '9:00 AM - 5:00 PM', onlineBooking: false, description: 'Historic palace with Italian architecture and spiritual ambiance' },
        { name: 'St. Philomena\'s Church', pujaTimings: '6:00 AM - 6:00 PM', onlineBooking: false, description: 'Neo-Gothic church with stunning stained glass windows' },
        { name: 'Someshwara Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false, description: 'Ancient temple dedicated to Lord Shiva with Hoysala architecture' },
        { name: 'Ganesha Temple', pujaTimings: '6:00 AM - 9:00 PM', onlineBooking: true, description: 'Temple dedicated to Lord Ganesha with beautiful sculptures' },
        { name: 'Bull Temple', pujaTimings: '7:00 AM - 7:00 PM', onlineBooking: false, description: 'Famous temple with massive monolithic Nandi bull statue' }
      ]
    };

    const normalizedDestination = destination.toLowerCase().trim();
    const templeList = temples[normalizedDestination];

    if (templeList) {
      // Return 4-6 random temples to add variety
      const shuffled = [...templeList].sort(() => 0.5 - Math.random());
      const selectedTemples = shuffled.slice(0, Math.floor(Math.random() * 3) + 4); // 4-6 temples

      return selectedTemples.map((temple, index) => ({
        ...temple,
        location: destination,
        imageUrl: `/api/placeholder/300/200?temple=${normalizedDestination}_${index}_${Date.now()}`,
        coordinates: this.getMockCoordinates(destination)
      }));
    }

    // Enhanced default temples for unknown destinations
    const defaultTemples = [
      { name: `${destination} Main Temple`, pujaTimings: '5:00 AM - 12:00 PM, 4:00 PM - 9:00 PM', onlineBooking: true, description: `Primary spiritual center of ${destination} with rich history` },
      { name: `${destination} Ancient Shrine`, pujaTimings: '6:00 AM - 11:00 PM', onlineBooking: false, description: `Historic temple showcasing ${destination}'s cultural heritage` },
      { name: `${destination} Sacred Temple`, pujaTimings: '4:00 AM - 10:00 PM', onlineBooking: true, description: `Popular pilgrimage site in ${destination} with divine atmosphere` },
      { name: `${destination} Spiritual Center`, pujaTimings: '5:30 AM - 8:30 PM', onlineBooking: false, description: `Meditation and prayer center in ${destination}` },
      { name: `${destination} Heritage Temple`, pujaTimings: '6:00 AM - 9:00 PM', onlineBooking: true, description: `Architecturally significant temple in ${destination}` },
      { name: `${destination} Peace Temple`, pujaTimings: '7:00 AM - 7:00 PM', onlineBooking: false, description: `Tranquil temple offering spiritual peace in ${destination}` }
    ];

    // Return random selection of default temples
    const shuffled = [...defaultTemples].sort(() => 0.5 - Math.random());
    const selectedTemples = shuffled.slice(0, Math.floor(Math.random() * 2) + 4); // 4-5 temples

    return selectedTemples.map((temple, index) => ({
      ...temple,
      location: destination,
      imageUrl: `/api/placeholder/300/200?temple=${normalizedDestination}_${index}_${Date.now()}`,
      coordinates: this.getMockCoordinates(destination)
    }));
  }

  private static getMockAttractions(destination: string): AttractionData[] {
    const attractions: Record<string, Array<{ name: string; type: string; description: string }>> = {
      varanasi: [
        { name: 'Ganga Aarti at Dashashwamedh Ghat', type: 'Spiritual', description: 'Spectacular evening prayer ceremony with lamps on the Ganges River' },
        { name: 'Sarnath Archaeological Museum', type: 'Heritage', description: 'Ancient Buddhist site where Buddha gave his first sermon, UNESCO site' },
        { name: 'Banaras Hindu University Campus', type: 'Cultural', description: 'Largest residential university in Asia with beautiful colonial architecture' },
        { name: 'Ramanagar Fort & Museum', type: 'Heritage', description: '18th-century fort with panoramic Ganges view and royal artifacts' },
        { name: 'Tulsi Manas Temple Complex', type: 'Spiritual', description: 'Temple dedicated to the author of Ramcharitmanas with beautiful gardens' },
        { name: 'Assi Ghat Cultural Center', type: 'Cultural', description: 'Popular ghat for boat rides, music performances and cultural activities' },
        { name: 'Dhamek Stupa', type: 'Heritage', description: 'Massive stupa marking the spot of Buddha\'s first teaching' },
        { name: 'Alamgir Mosque', type: 'Heritage', description: '17th-century mosque with stunning Mughal architecture' }
      ],
      tirupati: [
        { name: 'Tirumala Hills', type: 'Natural', description: 'Sacred hills surrounding the temple with scenic views' },
        { name: 'Sri Padmavati Temple', type: 'Spiritual', description: 'Temple dedicated to Goddess Padmavathi' },
        { name: 'Talakona Waterfall', type: 'Natural', description: 'Beautiful waterfall in the nearby forest area' },
        { name: 'Sri Venkateswara National Park', type: 'Natural', description: 'Wildlife sanctuary with diverse flora and fauna' },
        { name: 'Kapila Theertham', type: 'Spiritual', description: 'Sacred water body associated with Hindu mythology' },
        { name: 'TTD Gardens', type: 'Cultural', description: 'Beautiful gardens maintained by temple trust' }
      ],
      rishikesh: [
        { name: 'Triveni Ghat', type: 'Spiritual', description: 'Sacred confluence of Ganges, Yamuna and Saraswati rivers' },
        { name: 'Beatles Ashram', type: 'Cultural', description: 'Historic ashram where The Beatles stayed in 1968' },
        { name: 'Neer Garh Waterfall', type: 'Natural', description: 'Beautiful waterfall surrounded by lush greenery' },
        { name: 'Parmarth Niketan', type: 'Spiritual', description: 'Spiritual retreat center with yoga and meditation' },
        { name: 'Ramana\'s Garden Cafe', type: 'Cultural', description: 'Peaceful cafe with spiritual ambiance' },
        { name: 'Chotiwala', type: 'Cultural', description: 'Ancient village with traditional Garhwali culture' }
      ],
      haridwar: [
        { name: 'Har Ki Pauri', type: 'Spiritual', description: 'Most sacred ghat for ritual bathing in Ganges' },
        { name: 'Chandi Devi Temple', type: 'Spiritual', description: 'Temple dedicated to Goddess Chandi on a hill' },
        { name: 'Mansa Devi Temple', type: 'Spiritual', description: 'Temple dedicated to Goddess Mansa Devi' },
        { name: 'Rajaji National Park', type: 'Natural', description: 'Wildlife sanctuary with elephants and tigers' },
        { name: 'Bharat Mata Temple', type: 'Cultural', description: 'Unique temple with relief map of India' },
        { name: 'Sapt Rishi Ashram', type: 'Spiritual', description: 'Ancient ashram associated with seven sages' }
      ],
      amritsar: [
        { name: 'Golden Temple', type: 'Spiritual', description: 'Holiest Sikh shrine with stunning golden architecture' },
        { name: 'Jallianwala Bagh', type: 'Heritage', description: 'Historical site commemorating freedom struggle' },
        { name: 'Wagah Border', type: 'Cultural', description: 'Famous border ceremony between India and Pakistan' },
        { name: 'Durgiana Temple', type: 'Spiritual', description: 'Beautiful Hindu temple with golden dome' },
        { name: 'Ram Bagh Gardens', type: 'Natural', description: 'Historic Mughal gardens with fountains' },
        { name: 'Partition Museum', type: 'Heritage', description: 'Museum documenting the 1947 partition' }
      ],
      mysore: [
        { name: 'Mysore Palace', type: 'Heritage', description: 'Magnificent royal palace with Indo-Saracenic architecture' },
        { name: 'Chamundi Hills', type: 'Natural', description: 'Sacred hill with temple and panoramic city views' },
        { name: 'Brindavan Gardens', type: 'Natural', description: 'Beautiful gardens with musical fountain show' },
        { name: 'St. Philomena\'s Church', type: 'Cultural', description: 'Neo-Gothic church with stunning stained glass' },
        { name: 'Jaganmohan Palace', type: 'Heritage', description: 'Art gallery and museum in royal palace' },
        { name: 'Kukkarahalli Lake', type: 'Natural', description: 'Peaceful lake with walking paths and gardens' }
      ]
    };

    const normalizedDestination = destination.toLowerCase().trim();
    const attractionList = attractions[normalizedDestination];

    if (attractionList) {
      return attractionList.map((attraction, index) => ({
        ...attraction,
        rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        imageUrl: `/api/placeholder/300/200?attraction=${normalizedDestination}_${index}`,
        coordinates: this.getMockCoordinates(destination)
      }));
    }

    // Default attractions for unknown destinations
    const defaultAttractions = [
      { name: `${destination} Heritage Site`, type: 'Heritage', description: `Historic landmark showcasing ${destination}'s rich cultural heritage` },
      { name: `${destination} Nature Spot`, type: 'Natural', description: `Beautiful natural location in ${destination} perfect for relaxation` },
      { name: `${destination} Cultural Center`, type: 'Cultural', description: `Cultural hub featuring local traditions and arts of ${destination}` },
      { name: `${destination} Sacred Place`, type: 'Spiritual', description: `Spiritual site offering peace and reflection in ${destination}` },
      { name: `${destination} Local Market`, type: 'Cultural', description: `Bustling market showcasing local crafts and cuisine of ${destination}` },
      { name: `${destination} Scenic View`, type: 'Natural', description: `Panoramic viewpoint offering stunning vistas of ${destination}` }
    ];

    return defaultAttractions.map((attraction, index) => ({
      ...attraction,
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      imageUrl: `/api/placeholder/300/200?attraction=${normalizedDestination}_${index}`,
      coordinates: this.getMockCoordinates(destination)
    }));
  }



  // ===== INPUT VALIDATION & SANITIZATION =====

  // Validate and sanitize destination input
  private static validateDestination(destination: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!destination || typeof destination !== 'string') {
      return { isValid: false, sanitized: '', error: 'Destination is required and must be a string' };
    }

    const sanitized = destination.trim();

    if (sanitized.length < 2) {
      return { isValid: false, sanitized, error: 'Destination name must be at least 2 characters long' };
    }

    if (sanitized.length > 100) {
      return { isValid: false, sanitized: sanitized.substring(0, 100), error: 'Destination name is too long (max 100 characters)' };
    }

    // Remove potentially harmful characters
    const cleanDestination = sanitized.replace(/[<>{}[\]\\]/g, '');

    // Check for common Indian destinations to validate it's a real place
    const commonDestinations = [
      'varanasi', 'tirupati', 'rishikesh', 'haridwar', 'kedarnath', 'badrinath',
      'amritsar', 'golden temple', 'mysore', 'hampi', 'goa', 'kerala', 'kanyakumari',
      'madurai', 'thanjavur', 'puri', 'konark', 'ajmer', 'pushkar', 'udaipur',
      'jaipur', 'jodhpur', 'jaisalmer', 'bikaner', 'mount abu', 'chittorgarh'
    ];

    const isLikelyValid = commonDestinations.some(dest =>
      cleanDestination.toLowerCase().includes(dest) ||
      dest.includes(cleanDestination.toLowerCase())
    );

    return {
      isValid: true,
      sanitized: cleanDestination,
      error: isLikelyValid ? undefined : 'Please enter a valid Indian destination'
    };
  }

  // Validate travel preferences
  private static validatePreferences(preferences: Record<string, unknown>): { isValid: boolean; sanitized: Record<string, unknown>; warnings: string[] } {
    const sanitized: Record<string, unknown> = {};
    const warnings: string[] = [];

    if (preferences.budget && typeof preferences.budget === 'string') {
      const validBudgets = ['low', 'mid', 'high', 'luxury'];
      if (!validBudgets.includes(preferences.budget)) {
        warnings.push('Invalid budget type, using default');
      } else {
        sanitized.budget = preferences.budget;
      }
    }

    if (preferences.duration && typeof preferences.duration === 'string') {
      const duration = parseInt(preferences.duration);
      if (isNaN(duration) || duration < 1 || duration > 30) {
        warnings.push('Invalid duration, using default (3 days)');
        sanitized.duration = 3;
      } else {
        sanitized.duration = duration;
      }
    }

    if (preferences.travelers && typeof preferences.travelers === 'string') {
      const travelers = parseInt(preferences.travelers);
      if (isNaN(travelers) || travelers < 1 || travelers > 20) {
        warnings.push('Invalid number of travelers, using default (2)');
        sanitized.travelers = 2;
      } else {
        sanitized.travelers = travelers;
      }
    }

    if (preferences.transport && typeof preferences.transport === 'string') {
      const validTransport = ['train', 'flight', 'bus', 'car'];
      if (!validTransport.includes(preferences.transport)) {
        warnings.push('Invalid transport type, using default (train)');
        sanitized.transport = 'train';
      } else {
        sanitized.transport = preferences.transport;
      }
    }

    return { isValid: true, sanitized, warnings };
  }

  // Validate itinerary parameters
  private static validateItineraryParams(origin: string, destination: string, duration: number, budget: string):
    { isValid: boolean; sanitized: Record<string, unknown>; errors: string[] } {

    const errors: string[] = [];
    const sanitized: Record<string, unknown> = {};

    // Validate origin
    const originValidation = this.validateDestination(origin);
    if (!originValidation.isValid) {
      errors.push(`Origin: ${originValidation.error}`);
    } else {
      sanitized.origin = originValidation.sanitized;
    }

    // Validate destination
    const destValidation = this.validateDestination(destination);
    if (!destValidation.isValid) {
      errors.push(`Destination: ${destValidation.error}`);
    } else {
      sanitized.destination = destValidation.sanitized;
    }

    // Validate duration
    if (!duration || duration < 1 || duration > 30) {
      errors.push('Duration must be between 1 and 30 days');
    } else {
      sanitized.duration = Math.round(duration);
    }

    // Validate budget
    const validBudgets = ['low', 'mid', 'high', 'luxury'];
    if (!budget || !validBudgets.includes(budget)) {
      errors.push('Invalid budget type. Must be: low, mid, high, or luxury');
    } else {
      sanitized.budget = budget;
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  // ===== GEMINI AI ENHANCED METHODS =====

  // Get detailed trip information with Gemini AI
  static async getTripDetailsWithGemini(destination: string, preferences: Record<string, unknown> = {}): Promise<string> {
    // Validate inputs first
    const destValidation = this.validateDestination(destination);
    if (!destValidation.isValid) {
      return `❌ Invalid destination: ${destValidation.error}\n\nPlease enter a valid Indian spiritual destination like Varanasi, Tirupati, or Rishikesh.`;
    }

    const prefValidation = this.validatePreferences(preferences);
    if (prefValidation.warnings.length > 0) {
      console.warn('Preference validation warnings:', prefValidation.warnings);
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Create a comprehensive spiritual travel guide for ${destination} in India with:

**Essential Information:**
- Best time to visit for spiritual purposes
- Current travel requirements and restrictions
- Cultural etiquette and dos/don'ts for pilgrims

**Spiritual Sites & Temples:**
- Major temples and their significance
- Puja timings and important festivals
- Dress code and entry requirements

**Practical Travel Tips:**
- Transportation options from major cities
- Accommodation recommendations for pilgrims
- Local cuisine and dietary considerations
- Health and safety precautions

**Itinerary Suggestions:**
- 1-day spiritual itinerary
- 3-day comprehensive pilgrimage
- Weekend retreat options

**Budget Breakdown:**
- Estimated costs for different budget levels
- Money-saving tips for pilgrims

User preferences: ${JSON.stringify(preferences)}
Focus on authentic spiritual experiences and cultural respect.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error with Gemini API:', error);
      return `Unable to generate detailed information for ${destination}. Please check your internet connection and try again.`;
    }
  }

  // Generate personalized itinerary
  static async getPersonalizedItinerary(origin: string, destination: string, duration: number, budget: string): Promise<string> {
    // Validate inputs first
    const validation = this.validateItineraryParams(origin, destination, duration, budget);
    if (!validation.isValid) {
      return `❌ Invalid itinerary parameters:\n${validation.errors.map(error => `• ${error}`).join('\n')}\n\nPlease check your inputs and try again.`;
    }

    const { origin: validOrigin, destination: validDest, duration: validDuration, budget: validBudget } = validation.sanitized;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Create a detailed ${validDuration}-day spiritual journey itinerary from ${validOrigin} to ${validDest}:

**Day-by-Day Schedule:**
- Morning spiritual activities and temple visits
- Afternoon cultural experiences and meals
- Evening meditation and reflection time
- Travel between locations

**Transportation:**
- Recommended modes of transport
- Best times to travel
- Cost estimates

**Accommodation:**
- ${budget} budget options suitable for pilgrims
- Locations near spiritual sites
- Amenities important for travelers

**Spiritual Focus:**
- Key temples and sacred sites to visit
- Meditation and prayer opportunities
- Local spiritual guides or teachers

**Practical Details:**
- Packing list for spiritual journey
- Health precautions
- Emergency contacts
- Local customs to respect

**Budget Breakdown:**
- Daily estimated costs
- Total trip cost estimate
- Money-saving tips

Ensure the itinerary respects local customs and focuses on meaningful spiritual experiences.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating itinerary:', error);
      return `Unable to generate itinerary. Please try again later.`;
    }
  }

  // Get real-time travel advice
  static async getTravelAdvice(destination: string, travelDate: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Provide current travel advice for visiting ${destination} on ${travelDate}:

**Weather & Best Time:**
- Current weather conditions
- Best time of year for spiritual visits
- Weather-related travel tips

**Current Events & Festivals:**
- Ongoing festivals or religious events
- Temple ceremonies schedule
- Special spiritual gatherings

**Travel Requirements:**
- Current visa requirements for Indians
- Temple entry restrictions
- COVID-19 or health requirements

**Local Conditions:**
- Road conditions and transportation updates
- Accommodation availability
- Local market and shopping tips

**Safety & Health:**
- Health precautions for pilgrims
- Safety tips for solo travelers
- Emergency services contact

**Cultural Tips:**
- Current dress code expectations
- Photography restrictions at temples
- Local customs to be aware of

Focus on practical, current information that would help a pilgrim plan their visit.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error getting travel advice:', error);
      return `Unable to fetch current travel advice. Please check official sources for the latest information.`;
    }
  }

  // Enhanced temple information
  static async getEnhancedTempleInfo(templeName: string, location: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Provide detailed information about ${templeName} in ${location}, India:

**Temple History & Significance:**
- Historical background and founding
- Religious importance and mythology
- Architectural style and features

**Current Practices:**
- Daily puja timings
- Special ceremonies and festivals
- Priest services available

**Visitor Information:**
- Entry requirements and fees
- Dress code and photography rules
- Facilities available (parking, restrooms, etc.)

**Spiritual Experience:**
- Best times for meaningful visits
- Meditation and prayer opportunities
- Nearby spiritual sites to combine

**Practical Details:**
- How to reach the temple
- Nearby accommodation options
- Local food and refreshment options

**Cultural Context:**
- Local customs and traditions
- Appropriate behavior for visitors
- Ways to show respect

Provide accurate, respectful information that helps pilgrims have a meaningful spiritual experience.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error getting temple information:', error);
      return `Unable to fetch detailed temple information. Please try again later.`;
    }
  }

  // ===== HUGGING FACE AI INTEGRATION =====

  // Get travel information using Hugging Face models (for more accurate results)
  static async getTravelInfoWithHuggingFace(destination: string, queryType: 'general' | 'temples' | 'hotels' | 'transport' = 'general'): Promise<string> {
    // Validate destination input first
    const destValidation = this.validateDestination(destination);
    if (!destValidation.isValid) {
      return `❌ Invalid destination: ${destValidation.error}\n\nPlease enter a valid Indian spiritual destination.`;
    }

    const validDestination = destValidation.sanitized;

    try {
      const apiKey = this.HUGGINGFACE_CONFIG.apiKey;
      if (!apiKey || apiKey === '') {
        console.warn('Hugging Face API key not configured, falling back to Gemini');
        return this.getTripDetailsWithGemini(validDestination, { focus: 'spiritual' });
      }

      let prompt = '';

      switch (queryType) {
        case 'temples':
          prompt = `Provide detailed information about temples and spiritual sites in ${validDestination}, India. Include:
          - Major temples and their significance
          - Historical background and mythology
          - Current practices and puja timings
          - Best times to visit for spiritual purposes
          - Cultural etiquette and dress code
          - Nearby spiritual attractions`;
          break;

        case 'hotels':
          prompt = `Recommend accommodation options for pilgrims visiting ${validDestination}, India:
          - Budget-friendly options near temples
          - Spiritual retreat centers
          - Hotels with prayer facilities
          - Cleanliness and comfort considerations
          - Proximity to spiritual sites
          - Vegetarian food availability`;
          break;

        case 'transport':
          prompt = `Provide transportation information for traveling to ${validDestination}, India:
          - Best modes of transport from major cities
          - Train routes and schedules
          - Flight options and airports
          - Road conditions and bus services
          - Local transportation within the destination
          - Travel time estimates`;
          break;

        default:
          prompt = `Create a comprehensive spiritual travel guide for ${validDestination} in India:
          - Best time to visit for spiritual purposes
          - Major pilgrimage sites and temples
          - Cultural and religious significance
          - Practical travel information
          - Accommodation recommendations
          - Local customs and etiquette
          - Health and safety considerations`;
      }

      const response = await fetch(`${this.HUGGINGFACE_CONFIG.apiUrl}/${this.HUGGINGFACE_CONFIG.travelModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 512,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data[0] && data[0].generated_text) {
        return data[0].generated_text.trim();
      }

      // Fallback to Gemini if Hugging Face response is unexpected
      console.warn('Unexpected Hugging Face response format, falling back to Gemini');
      return this.getTripDetailsWithGemini(destination, { focus: 'spiritual' });

    } catch (error) {
      console.error('Error with Hugging Face API:', error);
      
      return this.getTripDetailsWithGemini(destination, { focus: 'spiritual' });
    }
  }

  // Enhanced itinerary generation with Hugging Face
  static async getEnhancedItineraryWithHuggingFace(origin: string, destination: string, duration: number, budget: string): Promise<string> {
    // Validate inputs first
    const validation = this.validateItineraryParams(origin, destination, duration, budget);
    if (!validation.isValid) {
      return `❌ Invalid itinerary parameters:\n${validation.errors.map(error => `• ${error}`).join('\n')}\n\nPlease check your inputs and try again.`;
    }

    const { origin: validOrigin, destination: validDest, duration: validDuration, budget: validBudget } = validation.sanitized;

    try {
      const apiKey = this.HUGGINGFACE_CONFIG.apiKey;
      if (!apiKey || apiKey === '') {
        console.warn('Hugging Face API key not configured, falling back to Gemini');
        return this.getPersonalizedItinerary(
          validOrigin as string,
          validDest as string,
          validDuration as number,
          validBudget as string
        );
      }

      const prompt = `Create a detailed ${validDuration}-day spiritual pilgrimage itinerary from ${validOrigin} to ${validDest} in India:

**Spiritual Journey Overview:**
- Sacred sites to visit each day
- Morning meditation and prayer times
- Temple darshan schedule
- Evening spiritual activities

**Daily Schedule:**
- Day 1: Arrival and initial blessings
- Days 2-${duration - 1}: Main pilgrimage activities
- Day ${duration}: Departure with final blessings

**Transportation:**
- Recommended travel modes between locations
- Local transport within ${destination}
- Travel time considerations

**Accommodation (${budget} budget):**
- Spiritual guesthouses and ashrams
- Clean, comfortable options near temples
- Facilities important for pilgrims

**Spiritual Practices:**
- Daily puja and meditation times
- Local spiritual guides
- Cultural immersion activities
- Self-reflection opportunities

**Practical Details:**
- Packing list for spiritual journey
- Health precautions for pilgrims
- Emergency contacts
- Respectful behavior guidelines

**Budget Breakdown:**
- Daily estimated costs
- Total pilgrimage cost
- Donation and offering guidelines

Ensure the itinerary focuses on meaningful spiritual experiences and respects local customs and traditions.`;

      const response = await fetch(`${this.HUGGINGFACE_CONFIG.apiUrl}/${this.HUGGINGFACE_CONFIG.travelModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 1024,
            temperature: 0.8,
            do_sample: true,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data[0] && data[0].generated_text) {
        return data[0].generated_text.trim();
      }

      // Fallback to Gemini
      console.warn('Unexpected Hugging Face response, falling back to Gemini');
      return this.getPersonalizedItinerary(origin, destination, duration, budget);

    } catch (error) {
      console.error('Error with Hugging Face itinerary generation:', error);
      
      return this.getPersonalizedItinerary(origin, destination, duration, budget);
    }
  }

  // Hybrid method: Combine existing APIs with both Gemini and Hugging Face
  static async getEnhancedTripData(destination: string): Promise<{
    basicInfo: { temples: TempleData[], attractions: AttractionData[] },
    aiEnhancedDetails: string,
    travelAdvice: string,
    huggingFaceInsights?: string
  }> {
    try {
      // Get basic data from existing APIs
      const [temples, attractions] = await Promise.all([
        this.getTemples(destination),
        this.getAttractions(destination)
      ]);

      // Get AI-enhanced details (try Hugging Face first, fallback to Gemini)
      let aiDetails: string;
      let huggingFaceInsights: string | undefined;

      try {
        huggingFaceInsights = await this.getTravelInfoWithHuggingFace(destination, 'general');
        aiDetails = huggingFaceInsights;
      } catch (error) {
        console.warn('Hugging Face failed, using Gemini');
        aiDetails = await this.getTripDetailsWithGemini(destination, {
          focus: 'spiritual',
          duration: 'flexible',
          groupSize: 'individual'
        });
      }

      // Get current travel advice
      const travelAdvice = await this.getTravelAdvice(destination, new Date().toISOString().split('T')[0]);

      return {
        basicInfo: { temples, attractions },
        aiEnhancedDetails: aiDetails,
        travelAdvice: travelAdvice,
        huggingFaceInsights: huggingFaceInsights
      };
    } catch (error) {
      console.error('Error in hybrid trip data fetch:', error);
      // Fallback to basic data only
      const [temples, attractions] = await Promise.all([
        this.getTemples(destination),
        this.getAttractions(destination)
      ]);

      return {
        basicInfo: { temples, attractions },
        aiEnhancedDetails: 'AI enhancement temporarily unavailable',
        travelAdvice: 'Please check official sources for current travel information'
      };
    }
  }

  // Smart AI selection based on query complexity
  static async getSmartTravelInfo(destination: string, queryType: 'simple' | 'complex' | 'detailed' = 'simple'): Promise<string> {
    // Validate destination first
    const destValidation = this.validateDestination(destination);
    if (!destValidation.isValid) {
      return `❌ Invalid destination: ${destValidation.error}\n\nPlease enter a valid Indian spiritual destination.`;
    }

    const validDestination = destValidation.sanitized;

    // For simple queries, use faster Gemini
    if (queryType === 'simple') {
      return this.getTripDetailsWithGemini(validDestination, { focus: 'spiritual' });
    }

    // For complex/detailed queries, try Hugging Face first
    try {
      const huggingFaceResult = await this.getTravelInfoWithHuggingFace(validDestination, 'general');
      if (huggingFaceResult && huggingFaceResult.length > 100) {
        return huggingFaceResult;
      }
    } catch (error) {
      console.warn('Hugging Face failed for complex query, falling back to Gemini');
    }

    // Fallback to Gemini for all cases
    return this.getTripDetailsWithGemini(validDestination, {
      focus: 'spiritual',
      detailLevel: queryType
    });
  }

  // ===== INDIAN RAIL API INTEGRATION =====

  // Get real train fare data from Indian Rail API
  static async getTrainFare(trainNumber: string, fromStation: string, toStation: string, quota: string = 'GN') {
    try {
      const apiKey = this.API_KEYS.indianRail;
      if (!apiKey || !apiKey.apiKey || apiKey.apiKey === '') {
        console.warn('Indian Rail API key not configured, using mock data');
        return this.getMockTrainFare(trainNumber, fromStation, toStation, quota);
      }

      const url = `http://indianrailapi.com/api/v2/TrainFare/apikey/${apiKey}/TrainNumber/${trainNumber}/From/${fromStation}/To/${toStation}/Quota/${quota}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.Status === 'SUCCESS' && data.ResponseCode === '200') {
        return {
          trainNumber: data.TrainNumber,
          trainName: data.TrainName,
          from: data.From,
          to: data.To,
          distance: data.Distance,
          trainType: data.TrainType,
          fares: data.Fares.map((fare: any) => ({
            name: fare.Name,
            code: fare.Code,
            fare: parseInt(fare.Fare)
          })),
          status: 'success'
        };
      } else {
        throw new Error(`API Error: ${data.Status}`);
      }
    } catch (error) {
      console.error('Error fetching train fare:', error);
      return this.getMockTrainFare(trainNumber, fromStation, toStation, quota);
    }
  }

  // Mock fallback for train fare data
  private static getMockTrainFare(trainNumber: string, fromStation: string, toStation: string, quota: string) {
    const mockFares = [
      { name: 'AC First Class', code: '1A', fare: Math.floor(Math.random() * 2000) + 3000 },
      { name: 'AC 2-Tier', code: '2A', fare: Math.floor(Math.random() * 1000) + 1500 },
      { name: 'AC 3-Tier', code: '3A', fare: Math.floor(Math.random() * 500) + 800 },
      { name: 'Sleeper', code: 'SL', fare: Math.floor(Math.random() * 300) + 300 },
      { name: 'General', code: 'GN', fare: Math.floor(Math.random() * 200) + 100 }
    ];

    return {
      trainNumber,
      trainName: 'Express Train',
      from: fromStation,
      to: toStation,
      distance: Math.floor(Math.random() * 1000) + 200,
      trainType: 'SF',
      fares: mockFares,
      status: 'mock'
    };
  }

  // Get train between stations using Indian Rail API via RapidAPI
  static async getTrainsBetweenStations(fromStation: string, toStation: string, date?: string) {
    try {
      const apiKey = this.API_KEYS.indianRail.apiKey;
      const apiHost = this.API_KEYS.indianRail.host;

      if (!apiKey || !apiKey.apiKey || apiKey.apiKey === '') {
        console.warn('Indian Rail API key not configured, using mock data');
        return this.getMockTrainsBetweenStations(fromStation, toStation);
      }

      // Use RapidAPI Indian Railway train status endpoint
      const url = `https://${apiHost}/api/trains/v1/train/status`;

      // Get future date for train search (API requires future dates)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
      const departureDate = futureDate.toISOString().split('T')[0].replace(/-/g, ''); // Format: YYYYMMDD

      const params = new URLSearchParams({
        departure_date: departureDate,
        isH5: 'true',
        client: 'web',
        deviceIdentifier: 'Mozilla%2520Firefox-138.0.0.0',
        train_number: '12051' // Default train number, can be made dynamic
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey.apiKey,
          'X-Rapidapi-Host': apiHost,
          'X-Rapid-Api': 'rapid-api-database',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Indian Rail API error: ${response.status}`);
      }

      const data = await response.json();
       // Debug logging

      if (data && (data.status === 'success' || data.ResponseCode === '200')) {
        // Handle different API response formats
        let trainData = data.data || data;

        // If trainData is an array, use the first item
        if (Array.isArray(trainData)) {
          trainData = trainData[0] || {};
        }

        // Transform the API response to our expected format
        return [{
          number: trainData.train_number || trainData.number || '12051',
          name: trainData.train_name || trainData.name || 'Express Train',
          departure: trainData.departure_time || trainData.departure || '06:00 AM',
          arrival: trainData.arrival_time || trainData.arrival || '02:30 PM',
          duration: trainData.duration || '8h 30m',
          fares: trainData.fares || [
            { name: 'AC First Class', code: '1A', fare: 3230 },
            { name: 'AC 2-Tier', code: '2A', fare: 1895 },
            { name: 'AC 3-Tier', code: '3A', fare: 1320 },
            { name: 'Sleeper', code: 'SL', fare: 500 },
            { name: 'General', code: 'GN', fare: 275 }
          ]
        }];
      }

      // Fallback to mock data if no results
      return this.getMockTrainsBetweenStations(fromStation, toStation);
    } catch (error) {
      console.error('Error fetching train data:', error);
       // Debug logging
      return this.getMockTrainsBetweenStations(fromStation, toStation);
    }
  }

  // Mock fallback for trains between stations
  private static getMockTrainsBetweenStations(fromStation: string, toStation: string) {
     // Debug logging
    return [
      {
        number: '12565',
        name: 'Bihar S Kranti Express',
        type: 'SF',
        departure: '6:00 AM',
        arrival: '2:30 PM',
        duration: '8h 30m',
        fares: [
          { name: 'AC First Class', code: '1A', fare: 3230 },
          { name: 'AC 2-Tier', code: '2A', fare: 1895 },
          { name: 'AC 3-Tier', code: '3A', fare: 1320 },
          { name: 'Sleeper', code: 'SL', fare: 500 },
          { name: 'General', code: 'GN', fare: 275 }
        ]
      },
      {
        number: '12561',
        name: 'Swatantrata Senani Express',
        type: 'SF',
        departure: '10:15 AM',
        arrival: '7:45 PM',
        duration: '9h 30m',
        fares: [
          { name: 'AC First Class', code: '1A', fare: 3100 },
          { name: 'AC 2-Tier', code: '2A', fare: 1750 },
          { name: 'AC 3-Tier', code: '3A', fare: 1200 },
          { name: 'Sleeper', code: 'SL', fare: 450 },
          { name: 'General', code: 'GN', fare: 250 }
        ]
      }
    ];
  }


  // ===== AMADEUS FLIGHT API INTEGRATION =====

  // Get Amadeus access token
  private static async getAmadeusToken(): Promise<string | null> {
    try {
      // Check if we have a valid token
      if (this.amadeusToken && Date.now() < this.amadeusToken.expires) {
        return this.amadeusToken.token;
      }

      const apiKey = this.API_KEYS.amadeus.apiKey;
      const apiSecret = this.API_KEYS.amadeus.apiSecret;

      if (!apiKey || !apiSecret || apiKey === '') {
        console.warn('Amadeus API credentials not configured');
        return null;
      }

      const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: apiSecret,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.amadeusToken = {
          token: data.access_token,
          expires: Date.now() + (data.expires_in * 1000) - 60000, // Expire 1 minute early
        };
        return data.access_token;
      }

      return null;
    } catch (error) {
      console.error('Error getting Amadeus token:', error);
      return null;
    }
  }

  // Search flights using Amadeus API
  static async searchFlights(origin: string, destination: string, departureDate: string, returnDate?: string, passengers: number = 1): Promise<AmadeusFlight[]> {
    try {
      const token = await this.getAmadeusToken();
      if (!token) {
        console.warn('No Amadeus token available, using mock data');
        return this.getMockFlights(origin, destination, departureDate);
      }

      const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: passengers.toString(),
        currencyCode: 'INR',
      });

      if (returnDate) {
        params.append('returnDate', returnDate);
      }

      const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        return data.data.slice(0, 5).map((flight: any) => ({
          id: flight.id,
          airline: flight.validatingAirlineCodes[0],
          price: {
            total: parseFloat(flight.price.total),
            currency: flight.price.currency,
          },
          itineraries: flight.itineraries.map((itinerary: any) => ({
            duration: itinerary.duration,
            segments: itinerary.segments.map((segment: any) => ({
              departure: {
                iataCode: segment.departure.iataCode,
                terminal: segment.departure.terminal,
                at: segment.departure.at,
              },
              arrival: {
                iataCode: segment.arrival.iataCode,
                terminal: segment.arrival.terminal,
                at: segment.arrival.at,
              },
              carrierCode: segment.carrierCode,
              flightNumber: segment.number,
              aircraft: segment.aircraft?.code,
              duration: segment.duration,
            })),
          })),
        }));
      }

      return this.getMockFlights(origin, destination, departureDate);
    } catch (error) {
      console.error('Error searching flights:', error);
      return this.getMockFlights(origin, destination, departureDate);
    }
  }

  // Mock flight data fallback
  private static getMockFlights(origin: string, destination: string, departureDate: string): AmadeusFlight[] {
    const airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'GoAir'];
    const flights = [];

    for (let i = 0; i < 3; i++) {
      flights.push({
        id: `flight-${i}`,
        airline: airlines[i % airlines.length],
        price: {
          total: Math.floor(Math.random() * 5000) + 3000,
          currency: 'INR',
        },
        itineraries: [{
          duration: 'PT2H30M',
          segments: [{
            departure: {
              iataCode: origin,
              terminal: 'T1',
              at: `${departureDate}T06:00:00`,
            },
            arrival: {
              iataCode: destination,
              terminal: 'T2',
              at: `${departureDate}T08:30:00`,
            },
            carrierCode: airlines[i % airlines.length].substring(0, 2).toUpperCase(),
            flightNumber: `${Math.floor(Math.random() * 900) + 100}`,
            aircraft: '320',
            duration: 'PT2H30M',
          }],
        }],
      });
    }

    return flights;
  }

  // ===== BOOKING.COM HOTEL API INTEGRATION =====

  // Get destination ID for Booking.com API
  private static async getBookingDestinationId(destination: string, apiKey: string, apiHost: string): Promise<string | null> {
    try {
      const url = `https://${apiHost}/api/v1/hotels/searchDestination`;

      const params = new URLSearchParams({
        query: destination,
        locale: 'en-gb'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': apiHost,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data && data.length > 0) {
        return data[0].dest_id || data[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error getting destination ID:', error);
      return null;
    }
  }

  // Search hotels using Booking.com API via RapidAPI
  static async searchHotels(destination: string, checkin: string, checkout: string, rooms: number = 1, guests: number = 2): Promise<HotelData[]> {
    try {
      const apiKey = this.API_KEYS.booking.apiKey;
      const apiHost = this.API_KEYS.booking.host;

      if (!apiKey || apiKey === '') {
        console.warn('Booking.com API key not configured, using mock data');
        return this.getHotels(destination, 'mid'); // Use existing mock method
      }

      // First, get destination ID
      const destId = await this.getBookingDestinationId(destination, apiKey, apiHost);
      if (!destId) {
        console.warn('Could not find destination ID, using mock data');
        return this.getHotels(destination, 'mid');
      }

      // Use RapidAPI Booking.com endpoint
      const url = `https://${apiHost}/api/v1/hotels/searchHotels`;

      const params = new URLSearchParams({
        dest_id: destId,
        search_type: 'CITY',
        arrival_date: checkin,
        departure_date: checkout,
        adults: guests.toString(),
        children: '0',
        room_qty: rooms.toString(),
        page_number: '1',
        units: 'metric',
        temperature_unit: 'c',
        languagecode: 'en-us',
        currency_code: 'INR'
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': apiHost,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Booking.com API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.hotels && data.data.hotels.length > 0) {
        return data.data.hotels.slice(0, 5).map((hotel: any) => ({
          name: hotel.hotel_name || hotel.name || 'Hotel',
          rating: hotel.review_score ? parseFloat(hotel.review_score) : 4.0,
          price: hotel.price_breakdown ? parseInt(hotel.price_breakdown.all_inclusive_price) : Math.floor(Math.random() * 3000) + 2000,
          location: hotel.city || destination,
          amenities: hotel.facilities ? hotel.facilities.slice(0, 4) : ['Free WiFi', 'AC', 'Restaurant'],
          imageUrl: hotel.max_photo_url || `/api/placeholder/300/200?hotel=${hotel.hotel_id || 'default'}`,
          cancellation: hotel.is_free_cancellable ? 'Free cancellation available' : 'Non-refundable'
        }));
      }

      // Fallback to mock data if no results
      return this.getHotels(destination, 'mid');
    } catch (error) {
      console.error('Error searching hotels:', error);
      return this.getHotels(destination, 'mid'); // Fallback to existing mock
    }
  }

  // ===== ENHANCED OPEN TRIP MAP INTEGRATION =====

  // Get detailed place information from OpenTripMap
  static async getDetailedPlaceInfo(xid: string): Promise<any> {
    try {
      const apiKey = this.API_KEYS.opentripmap;
      if (!apiKey || apiKey === '') {
        console.warn('OpenTripMap API key not configured');
        return null;
      }

      const response = await fetch(
        `${this.BASE_URLS.places}/xid/${xid}?apikey=${apiKey}`
      );

      if (!response.ok) return null;

      const placeDetails = await response.json();

      return {
        xid: placeDetails.xid,
        name: placeDetails.name,
        address: placeDetails.address,
        kinds: placeDetails.kinds,
        wikipedia: placeDetails.wikipedia,
        image: placeDetails.preview?.source,
        description: placeDetails.wikipedia_extracts?.text,
        coordinates: {
          lat: placeDetails.point?.lat,
          lng: placeDetails.point?.lon,
        },
        rate: placeDetails.rate,
        osm: placeDetails.osm,
        otm: placeDetails.otm,
      };
    } catch (error) {
      console.error('Error getting detailed place info:', error);
      return null;
    }
  }

  // Get places by radius with enhanced information
  static async getEnhancedPlacesByRadius(lat: number, lng: number, radius: number = 10000, kinds?: string): Promise<any[]> {
    try {
      const apiKey = this.API_KEYS.opentripmap;
      if (!apiKey || apiKey === '') {
        console.warn('OpenTripMap API key not configured');
        return [];
      }

      let url = `${this.BASE_URLS.places}/radius?radius=${radius}&lon=${lng}&lat=${lat}&format=json&apikey=${apiKey}`;

      if (kinds) {
        url += `&kinds=${kinds}`;
      }

      const response = await fetch(url);

      if (!response.ok) return [];

      const places = await response.json();

      // Enhance each place with detailed information
      const enhancedPlaces = await Promise.all(
        places.slice(0, 10).map(async (place: any) => {
          const details = await this.getDetailedPlaceInfo(place.xid);
          return {
            ...place,
            details: details,
            enhanced: true,
          };
        })
      );

      return enhancedPlaces;
    } catch (error) {
      console.error('Error getting enhanced places:', error);
      return [];
    }
  }

  // ===== UPDATED METHODS WITH REAL API INTEGRATION =====

  // Enhanced getAttractions with improved API handling
  static async getAttractions(destination: string): Promise<AttractionData[]> {
    console.log(`🎭 Fetching attractions for: ${destination}`);

    try {
      const coords = await this.getCoordinates(destination);
      if (!coords) {
        console.warn('No coordinates available, using mock attractions');
        return this.getMockAttractions(destination);
      }

      // Check if OpenTripMap API key is valid
      if (!this.isValidApiKey(this.API_KEYS.opentripmap)) {
        console.warn('OpenTripMap API key not configured or invalid, using mock attractions');
        return this.getMockAttractions(destination);
      }

      // Test API connectivity if not recently checked
      const lastChecked = this.apiStatus.opentripmap.lastChecked;
      if (Date.now() - lastChecked > 300000) { // Check every 5 minutes
        const testUrl = `${this.BASE_URLS.places}/radius?radius=1000&lon=0&lat=0&kinds=tourist_facilities&format=json&apikey=${this.API_KEYS.opentripmap}`;
        await this.testApiConnectivity('opentripmap', testUrl);
      }

      // Skip API call if we know it's not working
      if (!this.apiStatus.opentripmap.working && Date.now() - lastChecked < 3600000) { // Within last hour
        console.warn('OpenTripMap API previously failed, using mock attractions');
        return this.getMockAttractions(destination);
      }

      console.log(`🔍 Searching for attractions near ${destination} (${coords.lat}, ${coords.lng})`);

      // Try enhanced OpenTripMap with timeout
      const enhancedPlaces = await this.getEnhancedPlacesByRadius(
        coords.lat,
        coords.lng,
        15000,
        'tourist_facilities,historic,museums,natural,religion'
      );

      if (enhancedPlaces.length > 0) {
        console.log(`✅ Found ${enhancedPlaces.length} enhanced places from OpenTripMap`);

        const attractions: AttractionData[] = enhancedPlaces.slice(0, 6).map((place: any) => ({
          name: place.name || 'Attraction',
          type: place.kinds?.split(',')[0] || 'Sightseeing',
          description: place.details?.description || place.wikipedia_extracts?.text || 'Popular tourist attraction worth visiting',
          rating: place.rate || Math.round((Math.random() * 2 + 3) * 10) / 10,
          imageUrl: place.details?.image || place.preview?.source || `/api/placeholder/300/200?attraction=${Date.now()}`,
          coordinates: { lat: place.point.lat, lng: place.point.lon }
        }));

        console.log(`✅ Processed ${attractions.length} attractions from enhanced API`);
        return attractions.length > 0 ? attractions : this.getMockAttractions(destination);
      }

      // Fallback to original method
      console.log('Enhanced API returned no results, trying original method');
      return await this.getOriginalAttractions(destination);

    } catch (error) {
      console.error('Error fetching attractions:', error);
      return this.getMockAttractions(destination);
    }
  }

  // Keep original attractions method as fallback
  private static async getOriginalAttractions(destination: string): Promise<AttractionData[]> {
    try {
      const coords = await this.getCoordinates(destination);
      if (!coords) return this.getMockAttractions(destination);

      const response = await fetch(
        `${this.BASE_URLS.places}/radius?radius=15000&lon=${coords.lng}&lat=${coords.lat}&kinds=tourist_facilities,historic,museums,natural&format=json&apikey=${this.API_KEYS.opentripmap}`
      );

      if (!response.ok) return this.getMockAttractions(destination);

      const places = await response.json();

      const attractions: AttractionData[] = places.slice(0, 6).map((place: any) => ({
        name: place.name || 'Attraction',
        type: place.kinds?.split(',')[0] || 'Sightseeing',
        description: 'Popular tourist attraction worth visiting',
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        imageUrl: place.preview?.source || '/api/placeholder/300/200',
        coordinates: { lat: place.point.lat, lng: place.point.lon }
      }));

      return attractions.length > 0 ? attractions : this.getMockAttractions(destination);
    } catch (error) {
      console.error('Error fetching attractions:', error);
      return this.getMockAttractions(destination);
    }
  }

  // Enhanced getHotels with Booking.com integration and custom data
  static async getHotels(destination: string, budget: string): Promise<HotelData[]> {
    try {
      // Load custom hotels for this destination
      let customHotels: HotelData[] = [];

      if (this.isAuthenticated()) {
        const userId = this.getCurrentUserId()!;
        const result = await DatabaseService.getCustomHotels(userId);
        if (result.success) {
          customHotels = result.data.filter(
            hotel => hotel.location.toLowerCase().includes(destination.toLowerCase())
          );
        }
      } else {
        this.loadCustomData();
        customHotels = this.customData.hotels.filter(
          hotel => hotel.location.toLowerCase().includes(destination.toLowerCase())
        );
      }

      // Try Booking.com API first
      const coords = await this.getCoordinates(destination);
      let apiHotels: HotelData[] = [];

      if (coords) {
        // Use future dates for API calls (API doesn't accept past dates)
        const today = new Date();
        const checkin = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from now
        const checkout = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 8 days from now

        apiHotels = await this.searchHotels(destination, checkin, checkout, 1, 2);
      }

      // Combine custom hotels, API hotels, and mock hotels
      const allHotels = [...customHotels, ...apiHotels, ...this.getEnhancedMockHotels(destination, budget)];

      // Remove duplicates based on name
      const uniqueHotels = allHotels.filter((hotel, index, self) =>
        index === self.findIndex(h => h.name === hotel.name)
      );

      return uniqueHotels.slice(0, 6); // Return up to 6 hotels
    } catch (error) {
      console.error('Error fetching hotels:', error);
      // Return custom hotels + mock hotels on error
      let customHotels: HotelData[] = [];

      if (this.isAuthenticated()) {
        const userId = this.getCurrentUserId()!;
        const result = await DatabaseService.getCustomHotels(userId);
        if (result.success) {
          customHotels = result.data.filter(
            hotel => hotel.location.toLowerCase().includes(destination.toLowerCase())
          );
        }
      } else {
        this.loadCustomData();
        customHotels = this.customData.hotels.filter(
          hotel => hotel.location.toLowerCase().includes(destination.toLowerCase())
        );
      }

      return [...customHotels, ...this.getEnhancedMockHotels(destination, budget)];
    }
  }

  // Enhanced mock hotels with location-specific data
  private static getEnhancedMockHotels(destination: string, budget: string): HotelData[] {
    const budgetMultiplier = {
      low: 1,
      mid: 2,
      high: 3.5,
      luxury: 6
    };

    const basePrice = 2000;
    const multiplier = budgetMultiplier[budget as keyof typeof budgetMultiplier] || 1;

    const hotels: Record<string, Array<{ name: string; location: string; amenities: string[]; description: string }>> = {
      varanasi: [
        { name: 'Ganges View Hotel', location: 'Assi Ghat, Varanasi', amenities: ['Ganges View', 'Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle'], description: 'Riverside hotel with stunning Ganges views' },
        { name: 'Kashi Spiritual Retreat', location: 'Near Kashi Vishwanath Temple', amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'], description: 'Peaceful retreat near the main temple' },
        { name: 'Pilgrim Comfort Inn Varanasi', location: 'City Center, Varanasi', amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'], description: 'Comfortable stay in the heart of the city' },
        { name: 'Sarnath Heritage Hotel', location: 'Near Sarnath, Varanasi', amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'], description: 'Heritage hotel near Buddhist sites' }
      ],
      tirupati: [
        { name: 'Tirumala Temple View', location: 'Near Tirupati Temple', amenities: ['Temple View', 'Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle'], description: 'Hotel with direct temple views' },
        { name: 'Balaji Spiritual Center', location: 'Tirupati Hills', amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'], description: 'Spiritual retreat in the hills' },
        { name: 'Tirupati Pilgrim Lodge', location: 'City Center, Tirupati', amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'], description: 'Convenient lodging for pilgrims' },
        { name: 'Padmavati Boutique Hotel', location: 'Heritage Area, Tirupati', amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'], description: 'Luxury boutique in historic area' }
      ],
      rishikesh: [
        { name: 'Ganges Riverside Resort', location: 'Triveni Ghat, Rishikesh', amenities: ['River View', 'Free WiFi', 'AC', 'Restaurant', 'Yoga Classes'], description: 'Riverside resort with yoga facilities' },
        { name: 'Himalayan Spiritual Retreat', location: 'Foothills, Rishikesh', amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'], description: 'Mountain retreat for spiritual seekers' },
        { name: 'Beatles Ashram Lodge', location: 'Near Beatles Ashram, Rishikesh', amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'], description: 'Historic lodge near cultural sites' },
        { name: 'Ramana\'s Garden Resort', location: 'Peaceful Valley, Rishikesh', amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'], description: 'Garden resort with wellness facilities' }
      ],
      haridwar: [
        { name: 'Har Ki Pauri Hotel', location: 'Near Har Ki Pauri Ghat', amenities: ['Ghat View', 'Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle'], description: 'Hotel overlooking the sacred ghat' },
        { name: 'Ganges Spiritual Center', location: 'Riverside, Haridwar', amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'], description: 'Spiritual center by the Ganges' },
        { name: 'Haridwar Pilgrim Inn', location: 'City Center, Haridwar', amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'], description: 'Convenient inn for pilgrims' },
        { name: 'Sapt Rishi Heritage Hotel', location: 'Ancient Quarter, Haridwar', amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'], description: 'Heritage hotel in ancient area' }
      ],
      amritsar: [
        { name: 'Golden Temple View Hotel', location: 'Near Golden Temple', amenities: ['Temple View', 'Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle'], description: 'Hotel with Golden Temple views' },
        { name: 'Wagah Border Resort', location: 'Near Wagah Border', amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'], description: 'Resort near the historic border' },
        { name: 'Amritsar Heritage Inn', location: 'City Center, Amritsar', amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'], description: 'Heritage inn in city center' },
        { name: 'Punjab Cultural Hotel', location: 'Cultural District, Amritsar', amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'], description: 'Hotel showcasing Punjabi culture' }
      ],
      mysore: [
        { name: 'Palace View Hotel', location: 'Near Mysore Palace', amenities: ['Palace View', 'Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle'], description: 'Hotel with palace views' },
        { name: 'Chamundi Hill Resort', location: 'Foothills, Mysore', amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'], description: 'Hill resort with spiritual ambiance' },
        { name: 'Mysore Royal Inn', location: 'City Center, Mysore', amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'], description: 'Royal inn in city center' },
        { name: 'Karnataka Heritage Hotel', location: 'Heritage Area, Mysore', amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'], description: 'Heritage hotel in historic area' }
      ]
    };

    const normalizedDestination = destination.toLowerCase().trim();
    const hotelList = hotels[normalizedDestination];

    if (hotelList) {
      return hotelList.map((hotel, index) => ({
        name: hotel.name,
        rating: Math.round((Math.random() * 0.8 + 3.7) * 10) / 10,
        price: Math.round(basePrice * multiplier * (0.8 + Math.random() * 0.4)),
        location: hotel.location,
        amenities: hotel.amenities,
        imageUrl: `/api/placeholder/300/200?hotel=${normalizedDestination}_${index}`,
        cancellation: Math.random() > 0.5 ? 'Free cancellation until 24 hours before check-in' : 'Non-refundable'
      }));
    }

    // Default hotels for unknown destinations
    const defaultHotels = [
      {
        name: `${destination} Temple View Hotel`,
        location: `Near Main Temple, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle', 'Prayer Room'],
        description: `Hotel near main temple in ${destination}`
      },
      {
        name: `${destination} Spiritual Retreat`,
        location: `Peaceful Area, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'],
        description: `Spiritual retreat in ${destination}`
      },
      {
        name: `${destination} Pilgrim Comfort Inn`,
        location: `City Center, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'],
        description: `Comfortable inn for pilgrims in ${destination}`
      },
      {
        name: `${destination} Heritage Boutique`,
        location: `Heritage Area, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'],
        description: `Boutique hotel in heritage area of ${destination}`
      }
    ];

    return defaultHotels.map((hotel, index) => ({
      name: hotel.name,
      rating: Math.round((Math.random() * 0.8 + 3.7) * 10) / 10,
      price: Math.round(basePrice * multiplier * (0.8 + Math.random() * 0.4)),
      location: hotel.location,
      amenities: hotel.amenities,
      imageUrl: `/api/placeholder/300/200?hotel=${normalizedDestination}_${index}`,
      cancellation: Math.random() > 0.5 ? 'Free cancellation until 24 hours before check-in' : 'Non-refundable'
    }));
  }

  // Enhanced getTransportOptions with real flight data and custom data
  static async getTransportOptions(from: string, to: string, transport: string): Promise<TransportData[]> {
     // Debug logging

    if (transport === 'train') {
      try {
        // Load custom trains for this route
        this.loadCustomData();
        const customTrains = this.customData.trains.filter(
          train => train.type === 'train' &&
          (train.name.toLowerCase().includes(from.toLowerCase()) ||
           train.name.toLowerCase().includes(to.toLowerCase()))
        );

        const trains = await this.getTrainsBetweenStations(from, to);
         // Debug logging

        // Transform API response to TransportData format
        const transformedTrains: TransportData[] = trains.map((train: any): TransportData => ({
          type: 'train' as const,
          name: `${train.name || 'Express Train'} (${train.number || 'XXXX'})`,
          departure: train.departure || '06:00 AM',
          arrival: train.arrival || '02:30 PM',
          duration: train.duration || '8h 30m',
          price: train.fares?.[0]?.fare || 500,
          class: train.fares?.[0]?.code || 'SL'
        }));

        // Combine custom trains and transformed API trains
        const allTrains = [...customTrains, ...transformedTrains];

        // Remove duplicates based on name
        const uniqueTrains = allTrains.filter((train, index, self) =>
          index === self.findIndex(t => t.name === train.name)
        );

         // Debug logging
        return uniqueTrains;
      } catch (error) {
        console.error('Error fetching train data:', error);
        // Fallback to original mock data
      }
    } else if (transport === 'flight') {
      try {
        // Try Amadeus API for real flight data
        const flights = await this.searchFlights(from, to, new Date().toISOString().split('T')[0]);

        if (flights.length > 0) {
          return flights.map((flight: any) => ({
            type: 'flight' as const,
            name: `${flight.airline} ${flight.itineraries[0].segments[0].carrierCode}${flight.itineraries[0].segments[0].flightNumber}`,
            departure: new Date(flight.itineraries[0].segments[0].departure.at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            arrival: new Date(flight.itineraries[0].segments[0].arrival.at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            duration: flight.itineraries[0].duration.replace('PT', '').toLowerCase(),
            price: flight.price.total,
            class: 'Economy'
          }));
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    }

    // Original mock data for flights and buses
    const mockTransport: TransportData[] = [];

    if (transport === 'flight') {
      mockTransport.push(
        {
          type: 'flight',
          name: 'IndiGo 6E-234',
          departure: '08:30 AM',
          arrival: '10:15 AM',
          duration: '1h 45m',
          price: 4500,
          class: 'Economy'
        },
        {
          type: 'flight',
          name: 'SpiceJet SG-568',
          departure: '02:20 PM',
          arrival: '04:05 PM',
          duration: '1h 45m',
          price: 3890,
          class: 'Economy'
        }
      );
    } else if (transport === 'bus') {
      mockTransport.push(
        {
          type: 'bus',
          name: 'Volvo Multi-Axle AC Sleeper',
          departure: '09:00 PM',
          arrival: '08:00 AM',
          duration: '11h 00m',
          price: 1200,
          class: 'AC Sleeper'
        },
        {
          type: 'bus',
          name: 'Ordinary Express',
          departure: '11:30 PM',
          arrival: '10:30 AM',
          duration: '11h 00m',
          price: 650,
          class: 'AC Semi-Sleeper'
        }
      );
    }

    return mockTransport;
  }

  // ===== API DIAGNOSTICS AND TESTING =====

  // Test all APIs and return status report
  static async testAllApis(): Promise<Record<string, { working: boolean; error?: string; lastChecked: number }>> {
    console.log('🔧 Testing all API connections...');

    const results: Record<string, { working: boolean; error?: string; lastChecked: number }> = {};

    // Test OpenCage (Geocoding)
    try {
      if (this.isValidApiKey(this.API_KEYS.opencage)) {
        const testUrl = `${this.BASE_URLS.geocoding}?q=test&key=${this.API_KEYS.opencage}&limit=1`;
        const working = await this.testApiConnectivity('opencage', testUrl);
        results.opencage = {
          working,
          lastChecked: this.apiStatus.opencage.lastChecked
        };
      } else {
        results.opencage = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.opencage = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    // Test OpenTripMap
    try {
      if (this.isValidApiKey(this.API_KEYS.opentripmap)) {
        const testUrl = `${this.BASE_URLS.places}/radius?radius=1000&lon=0&lat=0&kinds=religion&format=json&apikey=${this.API_KEYS.opentripmap}`;
        const working = await this.testApiConnectivity('opentripmap', testUrl);
        results.opentripmap = {
          working,
          lastChecked: this.apiStatus.opentripmap.lastChecked
        };
      } else {
        results.opentripmap = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.opentripmap = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    // Test OpenWeather
    try {
      if (this.isValidApiKey(this.API_KEYS.openweather)) {
        const testUrl = `${this.BASE_URLS.weather}?q=test&appid=${this.API_KEYS.openweather}`;
        const working = await this.testApiConnectivity('openweather', testUrl);
        results.openweather = {
          working,
          lastChecked: this.apiStatus.openweather.lastChecked
        };
      } else {
        results.openweather = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.openweather = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    // Test Gemini AI
    try {
      if (this.isValidApiKey(this.API_KEYS.gemini)) {
        results.gemini = {
          working: true, // Assume working if key is valid
          lastChecked: Date.now()
        };
      } else {
        results.gemini = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.gemini = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    // Test Indian Rail
    try {
      if (this.isValidApiKey(this.API_KEYS.indianRail.apiKey)) {
        const testUrl = `https://${this.API_KEYS.indianRail.host}/api/trains/v1/train/status`;
        const headers = {
          'X-Rapidapi-Key': this.API_KEYS.indianRail.apiKey,
          'X-Rapidapi-Host': this.API_KEYS.indianRail.host
        };
        const working = await this.testApiConnectivity('indianRail', testUrl, headers);
        results.indianRail = {
          working,
          lastChecked: this.apiStatus.indianRail.lastChecked
        };
      } else {
        results.indianRail = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.indianRail = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    // Test Amadeus
    try {
      if (this.isValidApiKey(this.API_KEYS.amadeus.apiKey)) {
        results.amadeus = {
          working: true, // Assume working if key is valid (will be tested on actual use)
          lastChecked: Date.now()
        };
      } else {
        results.amadeus = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.amadeus = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    // Test Booking.com
    try {
      if (this.isValidApiKey(this.API_KEYS.booking.apiKey)) {
        const testUrl = `https://${this.API_KEYS.booking.host}/api/v1/hotels/searchDestination`;
        const headers = {
          'X-Rapidapi-Key': this.API_KEYS.booking.apiKey,
          'X-Rapidapi-Host': this.API_KEYS.booking.host
        };
        const working = await this.testApiConnectivity('booking', testUrl, headers);
        results.booking = {
          working,
          lastChecked: this.apiStatus.booking.lastChecked
        };
      } else {
        results.booking = {
          working: false,
          error: 'Invalid or missing API key',
          lastChecked: Date.now()
        };
      }
    } catch (error: any) {
      results.booking = {
        working: false,
        error: error.message,
        lastChecked: Date.now()
      };
    }

    console.log('📊 API Test Results:', results);
    return results;
  }

  // Get API status summary
  static getApiStatusSummary(): { total: number; working: number; failed: number; details: Record<string, boolean> } {
    const details: Record<string, boolean> = {};
    let working = 0;
    let failed = 0;

    Object.entries(this.apiStatus).forEach(([api, status]) => {
      details[api] = status.working;
      if (status.working) {
        working++;
      } else {
        failed++;
      }
    });

    return {
      total: Object.keys(this.apiStatus).length,
      working,
      failed,
      details
    };
  }

  // Reset API status cache (useful for debugging)
  static resetApiStatusCache(): void {
    Object.keys(this.apiStatus).forEach(api => {
      this.apiStatus[api as keyof typeof this.apiStatus] = {
        working: false,
        lastChecked: 0
      };
    });
    console.log('🔄 API status cache reset');
  }
}