import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Wifi, Car, Utensils, Phone, Calendar, Train, Plane, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TravelApiService, HotelData, TempleData, TransportData, AttractionData } from '@/services/travelApiService';

interface TripResultsProps {
  formData: {
    homeLocation: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    travelers: string;
    transport: string;
    transportClass: string;
    foodPreference: string;
  };
  onBack: () => void;
}

export function TripResults({ formData, onBack }: TripResultsProps) {
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [temples, setTemples] = useState<TempleData[]>([]);
  const [attractions, setAttractions] = useState<AttractionData[]>([]);
  const [transport, setTransport] = useState<TransportData[]>([]);

  useEffect(() => {
    loadTripData();
  }, []);

  const loadTripData = async () => {
    setLoading(true);
    try {
      const [hotelData, templeData, attractionData, transportData] = await Promise.all([
        TravelApiService.getHotels(formData.destination, formData.budget),
        TravelApiService.getTemples(formData.destination),
        TravelApiService.getAttractions(formData.destination),
        TravelApiService.getTransportOptions(formData.homeLocation, formData.destination, formData.transport)
      ]);

      setHotels(hotelData);
      setTemples(templeData);
      setAttractions(attractionData);
      setTransport(transportData);
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'train': return Train;
      case 'flight': return Plane;
      case 'bus': return Bus;
      default: return Train;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-peaceful p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-peaceful p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sacred-gradient mb-2">Your Spiritual Journey Plan</h1>
          <p className="text-muted-foreground mb-4">
            {formData.homeLocation} → {formData.destination} | {formData.startDate} to {formData.endDate} | {formData.travelers} travelers
          </p>
          <Button onClick={onBack} variant="outline">← Modify Plan</Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="temples">Temples</TabsTrigger>
            <TabsTrigger value="attractions">Attractions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transport Summary */}
              <Card className="container-peaceful">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const Icon = getTransportIcon(formData.transport);
                      return <Icon className="h-5 w-5" />;
                    })()}
                    Transport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transport.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium">{transport[0].name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transport[0].departure} - {transport[0].arrival}
                      </p>
                      <p className="text-lg font-bold text-primary">₹{transport[0].price.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Hotels Summary */}
              <Card className="container-peaceful">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hotels.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium">{hotels[0].name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{hotels[0].rating}</span>
                      </div>
                      <p className="text-lg font-bold text-primary">₹{hotels[0].price.toLocaleString()}/night</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Temples Summary */}
              <Card className="container-peaceful">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Temples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{temples.length} sacred places found</p>
                  {temples.slice(0, 2).map((temple, index) => (
                    <div key={index} className="text-sm mb-1">
                      • {temple.name}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transport Tab */}
          <TabsContent value="transport" className="space-y-4">
            {transport.map((option, index) => {
              const Icon = getTransportIcon(option.type);
              return (
                <Card key={index} className="container-peaceful">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">{option.name}</h3>
                          <p className="text-sm text-muted-foreground">{option.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{option.price.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{option.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm">{option.departure}</span>
                      <span className="text-sm text-muted-foreground">→</span>
                      <span className="text-sm">{option.arrival}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hotels.map((hotel, index) => (
              <Card key={index} className="container-peaceful">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <img 
                    src={hotel.imageUrl} 
                    alt={hotel.name}
                    className="w-full h-full object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/300/200';
                    }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{hotel.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{hotel.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{hotel.location}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {hotel.amenities.slice(0, 4).map((amenity, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{amenity}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">₹{hotel.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                    <Button className="btn-sacred">Book Now</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{hotel.cancellation}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Temples Tab */}
          <TabsContent value="temples" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {temples.map((temple, index) => (
              <Card key={index} className="container-peaceful">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <img 
                    src={temple.imageUrl} 
                    alt={temple.name}
                    className="w-full h-full object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/300/200';
                    }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{temple.name}</h3>
                    {temple.onlineBooking && <Badge className="bg-green-100 text-green-800">Online Booking</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">📍 {temple.location}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">{temple.pujaTimings}</span>
                  </div>
                  <p className="text-sm mb-4">{temple.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      Directions
                    </Button>
                    {temple.onlineBooking && (
                      <Button className="btn-sacred flex-1" size="sm">
                        Book Darshan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Attractions Tab */}
          <TabsContent value="attractions" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {attractions.map((attraction, index) => (
              <Card key={index} className="container-peaceful">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <img 
                    src={attraction.imageUrl} 
                    alt={attraction.name}
                    className="w-full h-full object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/300/200';
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{attraction.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{attraction.rating}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="mb-2">{attraction.type}</Badge>
                  <p className="text-sm text-muted-foreground mb-3">{attraction.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <MapPin className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Export Options */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button className="btn-sacred">
            📄 Export as PDF
          </Button>
          <Button variant="outline">
            🔗 Get Shareable Link
          </Button>
          <Button variant="outline">
            📱 Send to WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}