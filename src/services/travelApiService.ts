// Free API integrations for travel data
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

  // Free API keys (replace with actual keys - these are demo)
  private static API_KEYS = {
    opentripmap: 'YOUR_OPENTRIPMAP_KEY', // Free at developer.opentripmap.org
    opencage: 'YOUR_OPENCAGE_KEY', // Free at opencagedata.com
    openweather: 'YOUR_OPENWEATHER_KEY', // Free at openweathermap.org
  };

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

  // Get temples and spiritual places
  static async getTemples(destination: string): Promise<TempleData[]> {
    try {
      const coords = await this.getCoordinates(destination);
      if (!coords) return this.getMockTemples(destination);

      // Using OpenTripMap API for places of worship
      const response = await fetch(
        `${this.BASE_URLS.places}/radius?radius=10000&lon=${coords.lng}&lat=${coords.lat}&kinds=religion&format=json&apikey=${this.API_KEYS.opentripmap}`
      );
      
      if (!response.ok) return this.getMockTemples(destination);
      
      const places = await response.json();
      
      const temples: TempleData[] = places.slice(0, 5).map((place: any) => ({
        name: place.name || 'Sacred Temple',
        location: destination,
        pujaTimings: '5:00 AM - 12:00 PM, 4:00 PM - 9:00 PM',
        description: 'Ancient temple with rich spiritual heritage',
        imageUrl: place.preview?.source || '/api/placeholder/300/200',
        onlineBooking: Math.random() > 0.5,
        coordinates: { lat: place.point.lat, lng: place.point.lon }
      }));

      return temples.length > 0 ? temples : this.getMockTemples(destination);
    } catch (error) {
      console.error('Error fetching temples:', error);
      return this.getMockTemples(destination);
    }
  }

  // Get attractions and sightseeing places
  static async getAttractions(destination: string): Promise<AttractionData[]> {
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

  // Get hotel data (mock for now, can integrate with booking APIs)
  static async getHotels(destination: string, budget: string): Promise<HotelData[]> {
    // Mock hotel data based on budget
    const budgetMultiplier = {
      low: 1,
      mid: 2,
      high: 3.5,
      luxury: 6
    };

    const basePrice = 2000;
    const multiplier = budgetMultiplier[budget as keyof typeof budgetMultiplier] || 1;

    const mockHotels: HotelData[] = [
      {
        name: 'Sacred Stay Hotel',
        rating: 4.2,
        price: Math.round(basePrice * multiplier),
        location: `Near main temple, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Restaurant', 'Room Service'],
        imageUrl: '/api/placeholder/300/200?hotel=1',
        cancellation: 'Free cancellation until 24 hours before check-in'
      },
      {
        name: 'Spiritual Retreat Inn',
        rating: 4.0,
        price: Math.round(basePrice * multiplier * 0.8),
        location: `City center, ${destination}`,
        amenities: ['Free WiFi', 'Breakfast', 'Parking', 'Temple Shuttle'],
        imageUrl: '/api/placeholder/300/200?hotel=2',
        cancellation: 'Free cancellation until 48 hours before check-in'
      },
      {
        name: 'Pilgrim Palace',
        rating: 4.5,
        price: Math.round(basePrice * multiplier * 1.2),
        location: `Riverside, ${destination}`,
        amenities: ['Free WiFi', 'AC', 'Pool', 'Spa', 'Restaurant'],
        imageUrl: '/api/placeholder/300/200?hotel=3',
        cancellation: 'Non-refundable'
      }
    ];

    return new Promise((resolve) => {
      setTimeout(() => resolve(mockHotels), 1000); // Simulate API delay
    });
  }

  // Get transport options (mock data)
  static async getTransportOptions(from: string, to: string, transport: string): Promise<TransportData[]> {
    const mockTransport: TransportData[] = [];

    if (transport === 'train') {
      mockTransport.push(
        {
          type: 'train',
          name: 'Shatabdi Express',
          departure: '06:00 AM',
          arrival: '02:30 PM',
          duration: '8h 30m',
          price: 1850,
          class: '2A'
        },
        {
          type: 'train',
          name: 'Jan Shatabdi',
          departure: '10:15 AM',
          arrival: '07:45 PM',
          duration: '9h 30m',
          price: 890,
          class: '3A'
        }
      );
    } else if (transport === 'flight') {
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
      setTimeout(() => resolve(mockTransport), 800); // Simulate API delay
    });
  }
}