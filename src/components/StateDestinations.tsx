import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Camera } from 'lucide-react';

const stateDestinations = [
  {
    state: 'Uttar Pradesh',
    destinations: [
      { name: 'Varanasi', type: 'Holy City', rating: 4.8, description: 'Oldest living city, Ganges ghats' },
      { name: 'Mathura', type: 'Birthplace', rating: 4.7, description: 'Krishna\'s birthplace' },
      { name: 'Ayodhya', type: 'Ancient City', rating: 4.6, description: 'Ram Janmabhoomi' },
      { name: 'Vrindavan', type: 'Sacred Town', rating: 4.7, description: 'Krishna\'s playground' },
    ]
  },
  {
    state: 'Uttarakhand',
    destinations: [
      { name: 'Haridwar', type: 'Holy City', rating: 4.7, description: 'Gateway to Gods' },
      { name: 'Rishikesh', type: 'Yoga Capital', rating: 4.8, description: 'World yoga capital' },
      { name: 'Kedarnath', type: 'Char Dham', rating: 4.9, description: 'Sacred Jyotirlinga' },
      { name: 'Badrinath', type: 'Char Dham', rating: 4.8, description: 'Vishnu\'s abode' },
    ]
  },
  {
    state: 'Gujarat',
    destinations: [
      { name: 'Somnath', type: 'Jyotirlinga', rating: 4.8, description: 'First Jyotirlinga' },
      { name: 'Dwarka', type: 'Char Dham', rating: 4.7, description: 'Krishna\'s kingdom' },
      { name: 'Ambaji', type: 'Shakti Peeth', rating: 4.6, description: 'Goddess Ambaji' },
      { name: 'Palitana', type: 'Jain Temple', rating: 4.7, description: 'Jain pilgrimage' },
    ]
  },
  {
    state: 'Andhra Pradesh',
    destinations: [
      { name: 'Tirupati', type: 'Vishnu Temple', rating: 4.9, description: 'Richest temple' },
      { name: 'Srisailam', type: 'Jyotirlinga', rating: 4.7, description: 'Mallikarjuna temple' },
      { name: 'Kanaka Durga', type: 'Goddess Temple', rating: 4.6, description: 'Durga temple' },
    ]
  },
  {
    state: 'Tamil Nadu',
    destinations: [
      { name: 'Madurai', type: 'Temple City', rating: 4.8, description: 'Meenakshi temple' },
      { name: 'Thanjavur', type: 'Heritage', rating: 4.7, description: 'Brihadeeswara' },
      { name: 'Kanchipuram', type: 'Temple Town', rating: 4.6, description: 'City of temples' },
      { name: 'Rameswaram', type: 'Char Dham', rating: 4.8, description: 'Sacred island' },
    ]
  },
  {
    state: 'Maharashtra',
    destinations: [
      { name: 'Shirdi', type: 'Sai Baba', rating: 4.8, description: 'Sai Baba shrine' },
      { name: 'Pandharpur', type: 'Vitthal Temple', rating: 4.7, description: 'Vithoba temple' },
      { name: 'Trimbakeshwar', type: 'Jyotirlinga', rating: 4.6, description: 'Sacred Jyotirlinga' },
      { name: 'Ashtavinayak', type: 'Ganesha Circuit', rating: 4.7, description: '8 Ganesha temples' },
    ]
  }
];

export function StateDestinations() {
  return (
    <div className="min-h-screen bg-gradient-peaceful p-6 state-destinations">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-sacred-gradient mb-4">
            Spiritual Destinations Across India
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore sacred temples, ancient cities, and spiritual centers across India's 29 states
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {stateDestinations.map((stateData, index) => (
            <Card key={index} className="container-peaceful hover:shadow-temple transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MapPin className="h-5 w-5 text-primary" />
                  {stateData.state}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stateData.destinations.map((destination, destIndex) => (
                  <div key={destIndex} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{destination.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{destination.rating}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="mb-2">
                      {destination.type}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{destination.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center">
          <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Discover More States</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            This is just a glimpse! Our platform covers all 29 Indian states with detailed information 
            about thousands of temples, sacred sites, and spiritual destinations.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            {['Bihar', 'Kerala', 'Karnataka', 'Rajasthan', 'Punjab', 'Odisha', 
              'West Bengal', 'Madhya Pradesh', 'Haryana', 'Jharkhand', 'Assam', 'Himachal Pradesh',
              'Chhattisgarh', 'Goa', 'Tripura', 'Manipur', 'Meghalaya', 'Nagaland',
              'Mizoram', 'Arunachal Pradesh', 'Sikkim', 'Telangana', 'Delhi'].map((state) => (
              <Badge key={state} variant="outline" className="justify-center">
                {state}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}