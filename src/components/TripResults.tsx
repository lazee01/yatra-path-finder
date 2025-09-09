import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Star, Wifi, Car, Utensils, Phone, Calendar, Train, Plane, Bus, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [aiDetails, setAiDetails] = useState<string>('');
  const [travelAdvice, setTravelAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Custom data management
  const [customData, setCustomData] = useState<any>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customFormData, setCustomFormData] = useState({
    type: 'temple',
    name: '',
    location: formData.destination,
    pujaTimings: '',
    description: '',
    price: '',
    amenities: '',
    departure: '',
    arrival: '',
    duration: '',
    class: 'SL'
  });

  const loadAIData = useCallback(async () => {
    setAiLoading(true);
    try {
      const duration = Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24));

      const [details, advice] = await Promise.all([
        TravelApiService.getTripDetailsWithGemini(formData.destination, {
          budget: formData.budget,
          duration: duration,
          transport: formData.transport,
          travelers: formData.travelers
        }),
        TravelApiService.getTravelAdvice(formData.destination, formData.startDate)
      ]);

      setAiDetails(details);
      setTravelAdvice(advice);
    } catch (error) {
      console.error('Error loading AI data:', error);
      setAiDetails('AI enhancement temporarily unavailable');
      setTravelAdvice('Please check official sources for current travel information');
    } finally {
      setAiLoading(false);
    }
  }, [formData.destination, formData.budget, formData.startDate, formData.endDate, formData.transport, formData.travelers]);

  const loadTripData = useCallback(async () => {
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

      // Load AI-enhanced data in background
      loadAIData();
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  }, [formData.destination, formData.budget, formData.homeLocation, formData.transport, loadAIData]);

  // Load custom data
  const loadCustomData = useCallback(async () => {
    try {
      const data = await TravelApiService.getCustomData();
      setCustomData(data);
    } catch (error) {
      console.error('Error loading custom data:', error);
    }
  }, []);

  // Handle adding custom data
  const handleAddCustomData = async () => {
    try {
      if (customFormData.type === 'temple') {
        await TravelApiService.addCustomTemple({
          name: customFormData.name,
          location: customFormData.location,
          pujaTimings: customFormData.pujaTimings,
          description: customFormData.description,
          onlineBooking: true,
          imageUrl: `/api/placeholder/300/200?temple=${Date.now()}`
        });
      } else if (customFormData.type === 'hotel') {
        await TravelApiService.addCustomHotel({
          name: customFormData.name,
          location: customFormData.location,
          rating: 4.5,
          price: parseInt(customFormData.price) || 2000,
          amenities: customFormData.amenities.split(',').map(a => a.trim()),
          cancellation: 'Free cancellation available'
        });
      } else if (customFormData.type === 'train') {
        await TravelApiService.addCustomTrain({
          type: 'train',
          name: customFormData.name,
          departure: customFormData.departure,
          arrival: customFormData.arrival,
          duration: customFormData.duration,
          price: parseInt(customFormData.price) || 500,
          class: customFormData.class
        });
      }

      // Reset form and reload data
      setCustomFormData({
        type: 'temple',
        name: '',
        location: formData.destination,
        pujaTimings: '',
        description: '',
        price: '',
        amenities: '',
        departure: '',
        arrival: '',
        duration: '',
        class: 'SL'
      });
      setShowCustomDialog(false);
      loadCustomData();
      loadTripData(); // Reload trip data to include new custom entries
    } catch (error) {
      console.error('Error adding custom data:', error);
    }
  };

  // Handle deleting custom data
  const handleDeleteCustom = async (type: string, index: number) => {
    try {
      await TravelApiService.deleteCustomItem(type as any, index);
      loadCustomData();
      loadTripData();
    } catch (error) {
      console.error('Error deleting custom data:', error);
    }
  };

  useEffect(() => {
    loadTripData();
    loadCustomData();
  }, [loadTripData, loadCustomData]);


  const calculateDuration = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="temples">Temples</TabsTrigger>
            <TabsTrigger value="attractions">Attractions</TabsTrigger>
            <TabsTrigger value="ai-insights">🤖 AI Insights</TabsTrigger>
            <TabsTrigger value="custom">🎯 Custom Data</TabsTrigger>
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

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-sacred-gradient mb-2">🤖 Advanced AI Travel Intelligence</h2>
              <p className="text-muted-foreground">Experience the power of multiple AI models working together</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detailed Trip Information */}
              <Card className="container-peaceful">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    AI Trip Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {aiDetails.split('\n').map((line, index) => (
                        <p key={index} className="mb-2 text-sm leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Travel Advice */}
              <Card className="container-peaceful">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Current Travel Advice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {travelAdvice.split('\n').map((line, index) => (
                        <p key={index} className="mb-2 text-sm leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Model Comparison */}
            <Card className="container-peaceful">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  AI-Powered Travel Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-3">
                  <Button
                    onClick={async () => {
                      setAiLoading(true);
                      try {
                        const itinerary = await TravelApiService.getPersonalizedItinerary(
                          formData.homeLocation,
                          formData.destination,
                          calculateDuration(),
                          formData.budget
                        );
                        setAiDetails(prev => prev + '\n\n=== GEMINI ITINERARY ===\n\n' + itinerary);
                      } catch (error) {
                        console.error('Error generating Gemini itinerary:', error);
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    className="btn-sacred w-full"
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Generating...' : '🎯 Generate Itinerary (Gemini - Fast)'}
                  </Button>

                  <Button
                    onClick={async () => {
                      setAiLoading(true);
                      try {
                        const enhancedItinerary = await TravelApiService.getEnhancedItineraryWithHuggingFace(
                          formData.homeLocation,
                          formData.destination,
                          calculateDuration(),
                          formData.budget
                        );
                        setAiDetails(prev => prev + '\n\n=== HUGGING FACE ITINERARY ===\n\n' + enhancedItinerary);
                      } catch (error) {
                        console.error('Error generating Hugging Face itinerary:', error);
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    variant="outline"
                    className="w-full border-purple-300 hover:border-purple-500"
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Generating...' : '🧠 Generate Enhanced Itinerary (Hugging Face - Detailed)'}
                  </Button>

                  <Button
                    onClick={async () => {
                      setAiLoading(true);
                      try {
                        const smartInfo = await TravelApiService.getSmartTravelInfo(
                          formData.destination,
                          'detailed'
                        );
                        setAiDetails(prev => prev + '\n\n=== SMART AI TRAVEL GUIDE ===\n\n' + smartInfo);
                      } catch (error) {
                        console.error('Error getting smart travel info:', error);
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    variant="outline"
                    className="w-full border-green-300 hover:border-green-500"
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Generating...' : '🎪 Smart AI Guide (Auto-select best model)'}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>🚀 <strong>Advanced AI Features:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Gemini:</strong> Fast, conversational AI for quick responses and general guidance</li>
                    <li><strong>Hugging Face:</strong> Specialized travel models for detailed, accurate information</li>
                    <li><strong>Smart Selection:</strong> Automatically chooses best AI model for your query type</li>
                    <li><strong>Hybrid Approach:</strong> Combines multiple AI sources for comprehensive results</li>
                    <li><strong>Real-time Data:</strong> Current travel information and local insights</li>
                    <li><strong>Cultural Accuracy:</strong> Deep understanding of Indian spiritual traditions</li>
                  </ul>

                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-800 mb-1">🎯 Hugging Face Integration Status:</p>
                    <p className="text-xs text-purple-700">
                      To enable Hugging Face models, add your API key to <code className="bg-purple-100 px-1 rounded">VITE_HUGGINGFACE_API_KEY</code> in .env file.
                      Get your key at <a href="https://huggingface.co/settings/tokens" className="underline hover:text-purple-900" target="_blank" rel="noopener noreferrer">huggingface.co</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Data Tab */}
          <TabsContent value="custom" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-sacred-gradient mb-2">🎯 Custom Data Management</h2>
              <p className="text-muted-foreground">Add your own temples, hotels, and trains to personalize your travel experience</p>
            </div>

            {/* Add Custom Data Button */}
            <div className="flex justify-center mb-6">
              <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-sacred">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Custom Entry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={customFormData.type} onValueChange={(value) => setCustomFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temple">🕉️ Temple</SelectItem>
                          <SelectItem value="hotel">🏨 Hotel</SelectItem>
                          <SelectItem value="train">🚂 Train</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={customFormData.name}
                        onChange={(e) => setCustomFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={customFormData.location}
                        onChange={(e) => setCustomFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter location"
                      />
                    </div>

                    {customFormData.type === 'temple' && (
                      <>
                        <div>
                          <Label htmlFor="pujaTimings">Puja Timings</Label>
                          <Input
                            id="pujaTimings"
                            value={customFormData.pujaTimings}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, pujaTimings: e.target.value }))}
                            placeholder="e.g., 5:00 AM - 9:00 PM"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={customFormData.description}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Temple description"
                          />
                        </div>
                      </>
                    )}

                    {customFormData.type === 'hotel' && (
                      <>
                        <div>
                          <Label htmlFor="price">Price per night (₹)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={customFormData.price}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="2000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                          <Input
                            id="amenities"
                            value={customFormData.amenities}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, amenities: e.target.value }))}
                            placeholder="WiFi, AC, Restaurant"
                          />
                        </div>
                      </>
                    )}

                    {customFormData.type === 'train' && (
                      <>
                        <div>
                          <Label htmlFor="departure">Departure Time</Label>
                          <Input
                            id="departure"
                            value={customFormData.departure}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, departure: e.target.value }))}
                            placeholder="6:00 AM"
                          />
                        </div>
                        <div>
                          <Label htmlFor="arrival">Arrival Time</Label>
                          <Input
                            id="arrival"
                            value={customFormData.arrival}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, arrival: e.target.value }))}
                            placeholder="2:30 PM"
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration">Duration</Label>
                          <Input
                            id="duration"
                            value={customFormData.duration}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="8h 30m"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Price (₹)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={customFormData.price}
                            onChange={(e) => setCustomFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="class">Class</Label>
                          <Select value={customFormData.class} onValueChange={(value) => setCustomFormData(prev => ({ ...prev, class: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SL">Sleeper (SL)</SelectItem>
                              <SelectItem value="3A">AC 3-Tier (3A)</SelectItem>
                              <SelectItem value="2A">AC 2-Tier (2A)</SelectItem>
                              <SelectItem value="1A">AC First Class (1A)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddCustomData} className="flex-1 btn-sacred">
                        Add Entry
                      </Button>
                      <Button variant="outline" onClick={() => setShowCustomDialog(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Display Custom Data */}
            {customData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Custom Temples */}
                <Card className="container-peaceful">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🕉️</span>
                      Custom Temples ({customData.temples?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customData.temples?.slice(0, 3).map((temple: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm font-medium">{temple.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustom('temples', index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!customData.temples || customData.temples.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No custom temples added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Hotels */}
                <Card className="container-peaceful">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🏨</span>
                      Custom Hotels ({customData.hotels?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customData.hotels?.slice(0, 3).map((hotel: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <span className="text-sm font-medium">{hotel.name}</span>
                            <span className="text-xs text-muted-foreground block">₹{hotel.price}/night</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustom('hotels', index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!customData.hotels || customData.hotels.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No custom hotels added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Trains */}
                <Card className="container-peaceful">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🚂</span>
                      Custom Trains ({customData.trains?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customData.trains?.slice(0, 3).map((train: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <span className="text-sm font-medium">{train.name}</span>
                            <span className="text-xs text-muted-foreground block">{train.class} - ₹{train.price}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustom('trains', index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!customData.trains || customData.trains.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No custom trains added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Usage Instructions */}
            <Card className="container-peaceful">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  How Custom Data Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>🎯 Priority System:</strong> Custom data appears first, followed by API data, then mock data</p>
                  <p><strong>🔄 Auto-Integration:</strong> Your custom entries are automatically included in search results</p>
                  <p><strong>💾 Local Storage:</strong> Custom data is saved locally in your browser</p>
                  <p><strong>🎨 Personalization:</strong> Add temples, hotels, or trains specific to your preferences</p>
                  <p><strong>📱 Cross-Session:</strong> Your custom data persists across browser sessions</p>
                </div>
              </CardContent>
            </Card>
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