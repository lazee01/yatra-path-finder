import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from '@/components/ui/use-toast';

// Types for API responses
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

  // Custom data storage (in production, this would be a database)
  private static customData = {
    destinations: [] as any[],
    temples: [] as TempleData[],
    hotels: [] as HotelData[],
    trains: [] as TransportData[],
    attractions: [] as AttractionData[],
    userPreferences: {} as Record<string, any>
  };

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
  static addCustomTemple(temple: Omit<TempleData, 'coordinates'> & { coordinates?: { lat: number; lng: number } }) {
    this.loadCustomData();
    const newTemple: TempleData = {
      ...temple,
      coordinates: temple.coordinates || { lat: 25.3176, lng: 82.9739 }, // Default coordinates
      imageUrl: temple.imageUrl || `/api/placeholder/300/200?temple=${Date.now()}`
    };
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
  static getCustomData() {
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
  static updateCustomItem(type: 'temples' | 'hotels' | 'trains' | 'attractions', index: number, updates: any) {
    this.loadCustomData();
    if (this.customData[type] && this.customData[type][index]) {
      this.customData[type][index] = { ...this.customData[type][index], ...updates };
      this.saveCustomData();
      return this.customData[type][index];
    }
    return null;
  }

  // Set user preferences
  static setUserPreferences(preferences: Record<string, any>) {
    this.loadCustomData();
    this.customData.userPreferences = { ...this.customData.userPreferences, ...preferences };
    this.saveCustomData();
  }

  // Get user preferences
  static getUserPreferences() {
    this.loadCustomData();
    return this.customData.userPreferences;
  }

  // API keys
  private static API_KEYS = {
    opentripmap: import.meta.env.VITE_OPENTRIPMAP_API_KEY || 'YOUR_OPENTRIPMAP_KEY',
    opencage: import.meta.env.VITE_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_KEY', 
    openweather: import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_KEY',
    gemini: 'AIzaSyBTun7wQQLD0Dnq7V8mKPg1BcFkd3n4pbs',
    indianRail: {
      apiKey: '8762cddac5mshc01ca9fafddeb74p1fed3djsnd12f0ba62d78',
      host: 'indian-railway-irctc.p.rapidapi.com'
    },
    amadeus: {
      apiKey: 'ZJYMuk03HtvOZcyd99nABmF0lCEosGHA',
      apiSecret: 'xLfl6iYI5S8CtYCz'
    },
    booking: {
      apiKey: '8762cddac5mshc01ca9fafddeb74p1fed3djsnd12f0ba62d78',
      host: 'booking-com15.p.rapidapi.com'
    },
  };

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

  // Get coordinates for a destination
  static async getCoordinates(destination: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `${this.BASE_URLS.geocoding}?q=${encodeURIComponent(destination)}&key=${this.API_KEYS.opencage}&limit=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  }

  // Get temples and spiritual places (with custom data support)
  static async getTemples(destination: string): Promise<TempleData[]> {
    try {
      // Load custom temples for this destination
      this.loadCustomData();
      const customTemples = this.customData.temples.filter(
        temple => temple.location.toLowerCase().includes(destination.toLowerCase())
      );

      const coords = await this.getCoordinates(destination);
      if (!coords) {
        // Return custom temples + mock temples if no coordinates
        return [...customTemples, ...this.getMockTemples(destination)];
      }

      // Using OpenTripMap API for places of worship
      const response = await fetch(
        `${this.BASE_URLS.places}/radius?radius=10000&lon=${coords.lng}&lat=${coords.lat}&kinds=religion&format=json&apikey=${this.API_KEYS.opentripmap}`
      );

      let apiTemples: TempleData[] = [];
      if (response.ok) {
        const places = await response.json();
        apiTemples = places.slice(0, 5).map((place: any) => ({
          name: place.name || 'Sacred Temple',
          location: destination,
          pujaTimings: '5:00 AM - 12:00 PM, 4:00 PM - 9:00 PM',
          description: 'Ancient temple with rich spiritual heritage',
          imageUrl: place.preview?.source || '/api/placeholder/300/200',
          onlineBooking: Math.random() > 0.5,
          coordinates: { lat: place.point.lat, lng: place.point.lon }
        }));
      }

      // Combine custom temples, API temples, and mock temples
      const allTemples = [...customTemples, ...apiTemples, ...this.getMockTemples(destination)];

      // Remove duplicates based on name
      const uniqueTemples = allTemples.filter((temple, index, self) =>
        index === self.findIndex(t => t.name === temple.name)
      );

      return uniqueTemples.slice(0, 8); // Return up to 8 temples
    } catch (error) {
      console.error('Error fetching temples:', error);
      // Return custom temples + mock temples on error
      this.loadCustomData();
      const customTemples = this.customData.temples.filter(
        temple => temple.location.toLowerCase().includes(destination.toLowerCase())
      );
      return [...customTemples, ...this.getMockTemples(destination)];
    }
  }


  // Mock data fallbacks when APIs are not available or fail
  private static getMockTemples(destination: string): TempleData[] {
    const temples = {
      varanasi: [
        { name: 'Kashi Vishwanath Temple', pujaTimings: '4:00 AM - 11:00 PM', onlineBooking: true },
        { name: 'Sankat Mochan Hanuman Temple', pujaTimings: '5:00 AM - 10:00 PM', onlineBooking: false },
        { name: 'Durga Temple', pujaTimings: '6:00 AM - 12:00 PM, 4:00 PM - 9:00 PM', onlineBooking: true }
      ],
      tirupati: [
        { name: 'Sri Venkateswara Temple', pujaTimings: '2:30 AM - 1:00 AM', onlineBooking: true },
        { name: 'Sri Kapileswara Swamy Temple', pujaTimings: '6:00 AM - 8:00 PM', onlineBooking: false },
        { name: 'ISKCON Tirupati', pujaTimings: '4:30 AM - 1:00 PM, 4:00 PM - 8:30 PM', onlineBooking: true }
      ]
    };

    const defaultTemples = [
      { name: 'Main Temple', pujaTimings: '5:00 AM - 12:00 PM, 4:00 PM - 9:00 PM', onlineBooking: true },
      { name: 'Ancient Temple', pujaTimings: '6:00 AM - 11:00 PM', onlineBooking: false },
      { name: 'Sacred Shrine', pujaTimings: '4:00 AM - 10:00 PM', onlineBooking: true }
    ];

    const templeList = temples[destination.toLowerCase()] || defaultTemples;
    
    return templeList.map((temple, index) => ({
      ...temple,
      location: destination,
      description: 'Sacred temple with rich spiritual heritage and divine atmosphere',
      imageUrl: `/api/placeholder/300/200?temple=${index}`,
      coordinates: { lat: 25.3176 + Math.random() * 0.1, lng: 82.9739 + Math.random() * 0.1 }
    }));
  }

  private static getMockAttractions(destination: string): AttractionData[] {
    const attractions = [
      'Ganga Aarti Ghat',
      'Ancient Fort',
      'River Cruise',
      'Local Market',
      'Heritage Walk',
      'Spiritual Center'
    ];

    return attractions.map((name, index) => ({
      name,
      type: ['Heritage', 'Spiritual', 'Natural', 'Cultural'][index % 4],
      description: `Experience the beauty and culture of ${destination}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      imageUrl: `/api/placeholder/300/200?attraction=${index}`,
      coordinates: { lat: 25.3176 + Math.random() * 0.1, lng: 82.9739 + Math.random() * 0.1 }
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
  private static validatePreferences(preferences: any): { isValid: boolean; sanitized: any; warnings: string[] } {
    const sanitized: any = {};
    const warnings: string[] = [];

    if (preferences.budget) {
      const validBudgets = ['low', 'mid', 'high', 'luxury'];
      if (!validBudgets.includes(preferences.budget)) {
        warnings.push('Invalid budget type, using default');
      } else {
        sanitized.budget = preferences.budget;
      }
    }

    if (preferences.duration) {
      const duration = parseInt(preferences.duration);
      if (isNaN(duration) || duration < 1 || duration > 30) {
        warnings.push('Invalid duration, using default (3 days)');
        sanitized.duration = 3;
      } else {
        sanitized.duration = duration;
      }
    }

    if (preferences.travelers) {
      const travelers = parseInt(preferences.travelers);
      if (isNaN(travelers) || travelers < 1 || travelers > 20) {
        warnings.push('Invalid number of travelers, using default (2)');
        sanitized.travelers = 2;
      } else {
        sanitized.travelers = travelers;
      }
    }

    if (preferences.transport) {
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
    { isValid: boolean; sanitized: any; errors: string[] } {

    const errors: string[] = [];
    const sanitized: any = {};

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
  static async getTripDetailsWithGemini(destination: string, preferences: any = {}): Promise<string> {
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
      console.log('Falling back to Gemini AI');
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
        return this.getPersonalizedItinerary(validOrigin, validDest, validDuration, validBudget);
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
      console.log('Falling back to Gemini for itinerary');
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
      if (!apiKey || !apiKey.apiKey || apiKey.apiKey === 'YOUR_INDIAN_RAIL_API_KEY') {
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

      if (!apiKey || apiKey === 'YOUR_INDIAN_RAIL_API_KEY') {
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
          'X-Rapidapi-Key': apiKey,
          'X-Rapidapi-Host': apiHost,
          'X-Rapid-Api': 'rapid-api-database',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Indian Rail API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Indian Rail API Response:', data); // Debug logging

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
      console.log('Falling back to mock train data'); // Debug logging
      return this.getMockTrainsBetweenStations(fromStation, toStation);
    }
  }

  // Mock fallback for trains between stations
  private static getMockTrainsBetweenStations(fromStation: string, toStation: string) {
    console.log(`Using mock train data from ${fromStation} to ${toStation}`); // Debug logging
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

      if (!apiKey || !apiSecret || apiKey === 'YOUR_AMADEUS_API_KEY') {
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
  static async searchFlights(origin: string, destination: string, departureDate: string, returnDate?: string, passengers: number = 1): Promise<any[]> {
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
  private static getMockFlights(origin: string, destination: string, departureDate: string): any[] {
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

      if (!apiKey || apiKey === 'YOUR_BOOKING_API_KEY') {
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
      if (!apiKey || apiKey === 'YOUR_OPENTRIPMAP_KEY') {
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
      if (!apiKey || apiKey === 'YOUR_OPENTRIPMAP_KEY') {
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

  // Enhanced getAttractions with more detailed OpenTripMap data
  static async getAttractions(destination: string): Promise<AttractionData[]> {
    try {
      const coords = await this.getCoordinates(destination);
      if (!coords) return this.getMockAttractions(destination);

      // Try enhanced OpenTripMap first
      const enhancedPlaces = await this.getEnhancedPlacesByRadius(
        coords.lat,
        coords.lng,
        15000,
        'tourist_facilities,historic,museums,natural,religion'
      );

      if (enhancedPlaces.length > 0) {
        const attractions: AttractionData[] = enhancedPlaces.slice(0, 6).map((place: any) => ({
          name: place.name || 'Attraction',
          type: place.kinds?.split(',')[0] || 'Sightseeing',
          description: place.details?.description || place.wikipedia_extracts?.text || 'Popular tourist attraction worth visiting',
          rating: place.rate || Math.round((Math.random() * 2 + 3) * 10) / 10,
          imageUrl: place.details?.image || place.preview?.source || '/api/placeholder/300/200',
          coordinates: { lat: place.point.lat, lng: place.point.lon }
        }));

        return attractions.length > 0 ? attractions : this.getMockAttractions(destination);
      }

      // Fallback to original method
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
      this.loadCustomData();
      const customHotels = this.customData.hotels.filter(
        hotel => hotel.location.toLowerCase().includes(destination.toLowerCase())
      );

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
      this.loadCustomData();
      const customHotels = this.customData.hotels.filter(
        hotel => hotel.location.toLowerCase().includes(destination.toLowerCase())
      );
      return [...customHotels, ...this.getEnhancedMockHotels(destination, budget)];
    }
  }

  // Enhanced mock hotels with more realistic data
  private static getEnhancedMockHotels(destination: string, budget: string): HotelData[] {
    const budgetMultiplier = {
      low: 1,
      mid: 2,
      high: 3.5,
      luxury: 6
    };

    const basePrice = 2000;
    const multiplier = budgetMultiplier[budget as keyof typeof budgetMultiplier] || 1;

    const hotelTemplates = [
      {
        name: 'Temple View Hotel',
        location: `Near Main Temple, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Restaurant', 'Temple Shuttle', 'Prayer Room'],
        imageSuffix: 'temple'
      },
      {
        name: 'Spiritual Retreat',
        location: `Peaceful Area, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Meditation Garden', 'Yoga Classes', 'Vegetarian Restaurant'],
        imageSuffix: 'retreat'
      },
      {
        name: 'Pilgrim Comfort Inn',
        location: `City Center, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Room Service', 'Travel Desk', 'Laundry'],
        imageSuffix: 'comfort'
      },
      {
        name: 'Sacred Stay Boutique',
        location: `Heritage Area, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Spa', 'Restaurant', 'Cultural Tours'],
        imageSuffix: 'boutique'
      }
    ];

    return hotelTemplates.map((template, index) => ({
      name: template.name,
      rating: Math.round((Math.random() * 0.8 + 3.7) * 10) / 10,
      price: Math.round(basePrice * multiplier * (0.8 + Math.random() * 0.4)),
      location: template.location,
      amenities: template.amenities,
      imageUrl: `/api/placeholder/300/200?hotel=${template.imageSuffix}`,
      cancellation: Math.random() > 0.5 ? 'Free cancellation until 24 hours before check-in' : 'Non-refundable'
    }));
  }

  // Enhanced getTransportOptions with real flight data and custom data
  static async getTransportOptions(from: string, to: string, transport: string): Promise<TransportData[]> {
    console.log(`Getting transport options: ${transport} from ${from} to ${to}`); // Debug logging

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
        console.log('Train data received:', trains); // Debug logging

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

        console.log('Final transport data:', uniqueTrains); // Debug logging
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

    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTransport), 800);
    });
  }
}