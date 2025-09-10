import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TempleData, HotelData, TransportData, AttractionData } from './travelApiService';

// Extended types with Firestore ID
type TempleDataWithId = TempleData & { id: string };
type HotelDataWithId = HotelData & { id: string };
type TransportDataWithId = TransportData & { id: string };
type AttractionDataWithId = AttractionData & { id: string };

export class DatabaseService {
  // User preferences
  static async saveUserPreferences(userId: string, preferences: Record<string, unknown>) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        preferences,
        updatedAt: Timestamp.now()
      }, { merge: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getUserPreferences(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { success: true, data: userSnap.data().preferences || {} };
      } else {
        return { success: true, data: {} };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Custom temples
  static async saveCustomTemple(userId: string, temple: TempleData) {
    try {
      const templeRef = doc(collection(db, 'users', userId, 'temples'));
      await setDoc(templeRef, {
        ...temple,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: templeRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCustomTemples(userId: string) {
    try {
      const templesRef = collection(db, 'users', userId, 'temples');
      const q = query(templesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const temples: TempleDataWithId[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<TempleData, 'id'>;
        temples.push({ ...data, id: doc.id });
      });

      return { success: true, data: temples };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Custom hotels
  static async saveCustomHotel(userId: string, hotel: HotelData) {
    try {
      const hotelRef = doc(collection(db, 'users', userId, 'hotels'));
      await setDoc(hotelRef, {
        ...hotel,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: hotelRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCustomHotels(userId: string) {
    try {
      const hotelsRef = collection(db, 'users', userId, 'hotels');
      const q = query(hotelsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const hotels: HotelDataWithId[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<HotelData, 'id'>;
        hotels.push({ ...data, id: doc.id });
      });

      return { success: true, data: hotels };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Custom transport
  static async saveCustomTransport(userId: string, transport: TransportData) {
    try {
      const transportRef = doc(collection(db, 'users', userId, 'transport'));
      await setDoc(transportRef, {
        ...transport,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: transportRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCustomTransport(userId: string) {
    try {
      const transportRef = collection(db, 'users', userId, 'transport');
      const q = query(transportRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const transports: TransportDataWithId[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<TransportData, 'id'>;
        transports.push({ ...data, id: doc.id });
      });

      return { success: true, data: transports };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Custom attractions
  static async saveCustomAttraction(userId: string, attraction: AttractionData) {
    try {
      const attractionRef = doc(collection(db, 'users', userId, 'attractions'));
      await setDoc(attractionRef, {
        ...attraction,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: attractionRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCustomAttractions(userId: string) {
    try {
      const attractionsRef = collection(db, 'users', userId, 'attractions');
      const q = query(attractionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const attractions: AttractionDataWithId[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<AttractionData, 'id'>;
        attractions.push({ ...data, id: doc.id });
      });

      return { success: true, data: attractions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Trip history
  static async saveTrip(userId: string, tripData: any) {
    try {
      const tripRef = doc(collection(db, 'users', userId, 'trips'));
      await setDoc(tripRef, {
        ...tripData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: tripRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getTripHistory(userId: string) {
    try {
      const tripsRef = collection(db, 'users', userId, 'trips');
      const q = query(tripsRef, orderBy('createdAt', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);

      const trips: any[] = [];
      querySnapshot.forEach((doc) => {
        trips.push({ ...doc.data(), id: doc.id });
      });

      return { success: true, data: trips };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete custom item
  static async deleteCustomItem(userId: string, collectionName: string, itemId: string) {
    try {
      const itemRef = doc(db, 'users', userId, collectionName, itemId);
      await deleteDoc(itemRef);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update custom item
  static async updateCustomItem(userId: string, collectionName: string, itemId: string, updates: Record<string, unknown>) {
    try {
      const itemRef = doc(db, 'users', userId, collectionName, itemId);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}