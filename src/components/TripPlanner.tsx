import { useState } from 'react';
import { MapPin, Calendar, DollarSign, Users, Train, Plane, Bus, Hotel, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const budgetTypes = [
  { id: 'low', label: 'Budget', range: '₹5,000 - ₹15,000', color: 'bg-green-100 text-green-800' },
  { id: 'mid', label: 'Comfort', range: '₹15,000 - ₹35,000', color: 'bg-blue-100 text-blue-800' },
  { id: 'high', label: 'Premium', range: '₹35,000 - ₹75,000', color: 'bg-purple-100 text-purple-800' },
  { id: 'luxury', label: 'Luxury', range: '₹75,000+', color: 'bg-amber-100 text-amber-800' },
];

const transportOptions = [
  { id: 'train', label: 'Train', icon: Train, classes: ['3A', '2A', '1A'] },
  { id: 'flight', label: 'Flight', icon: Plane, classes: ['Economy', 'Business'] },
  { id: 'bus', label: 'Bus', icon: Bus, classes: ['AC Sleeper', 'AC Semi-Sleeper', 'Non-AC'] },
];

export function TripPlanner() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    homeLocation: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '2',
    transport: '',
    transportClass: '',
    foodPreference: 'veg',
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-peaceful p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sacred-gradient mb-2">Plan Your Sacred Journey</h1>
          <p className="text-muted-foreground">Let us help you create the perfect pilgrimage experience</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-sacred h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="container-peaceful">
          <CardContent className="p-8">
            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">Where are you traveling from and to?</h2>
                  <p className="text-muted-foreground">Tell us your starting point and spiritual destination</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="home">Your Home Location</Label>
                    <Input
                      id="home"
                      placeholder="e.g., Mumbai, Maharashtra"
                      value={formData.homeLocation}
                      onChange={(e) => updateFormData('homeLocation', e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="destination">Spiritual Destination</Label>
                    <Input
                      id="destination"
                      placeholder="e.g., Varanasi, Tirupati, Rishikesh, Kedarnath..."
                      value={formData.destination}
                      onChange={(e) => updateFormData('destination', e.target.value)}
                      className="h-12"
                    />
                    <div className="text-xs text-muted-foreground">
                      Popular destinations: Varanasi, Tirupati, Rishikesh, Haridwar, Mathura, Kedarnath, Badrinath, Amritsar
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Travel Dates & Travelers */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">When would you like to travel?</h2>
                  <p className="text-muted-foreground">Select your preferred travel dates and group size</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Departure Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateFormData('startDate', e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Return Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateFormData('endDate', e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelers">Number of Travelers</Label>
                    <Select value={formData.travelers} onValueChange={(value) => updateFormData('travelers', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Person' : 'People'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">What's your budget range?</h2>
                  <p className="text-muted-foreground">Choose a budget that suits your spiritual journey</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgetTypes.map((budget) => (
                    <Card 
                      key={budget.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-temple ${
                        formData.budget === budget.id ? 'ring-2 ring-primary shadow-sacred' : ''
                      }`}
                      onClick={() => updateFormData('budget', budget.id)}
                    >
                      <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold mb-2">{budget.label}</h3>
                        <Badge className={budget.color}>{budget.range}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Transport Options */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Train className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">How would you like to travel?</h2>
                  <p className="text-muted-foreground">Select your preferred mode of transportation</p>
                </div>

                <Tabs value={formData.transport} onValueChange={(value) => updateFormData('transport', value)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {transportOptions.map((transport) => (
                      <TabsTrigger key={transport.id} value={transport.id} className="flex items-center gap-2">
                        <transport.icon className="h-4 w-4" />
                        {transport.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {transportOptions.map((transport) => (
                    <TabsContent key={transport.id} value={transport.id} className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {transport.classes.map((cls) => (
                          <Card 
                            key={cls}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-temple ${
                              formData.transportClass === cls ? 'ring-2 ring-primary shadow-sacred' : ''
                            }`}
                            onClick={() => updateFormData('transportClass', cls)}
                          >
                            <CardContent className="p-4 text-center">
                              <transport.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                              <h4 className="font-medium">{cls}</h4>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Step 5: Food Preferences */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">Food Preferences</h2>
                  <p className="text-muted-foreground">Let us know your dietary requirements</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-temple ${
                      formData.foodPreference === 'veg' ? 'ring-2 ring-primary shadow-sacred' : ''
                    }`}
                    onClick={() => updateFormData('foodPreference', 'veg')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-green-600 font-bold">🌱</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Vegetarian</h3>
                      <p className="text-sm text-muted-foreground">Pure vegetarian meals only</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-temple ${
                      formData.foodPreference === 'nonveg' ? 'ring-2 ring-primary shadow-sacred' : ''
                    }`}
                    onClick={() => updateFormData('foodPreference', 'nonveg')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-orange-600 font-bold">🍗</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Non-Vegetarian</h3>
                      <p className="text-sm text-muted-foreground">Both veg and non-veg options</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="disabled:opacity-50"
              >
                Back
              </Button>

              <Button
                onClick={handleNext}
                className="btn-sacred"
                disabled={
                  (currentStep === 1 && (!formData.homeLocation || !formData.destination)) ||
                  (currentStep === 2 && (!formData.startDate || !formData.endDate)) ||
                  (currentStep === 3 && !formData.budget) ||
                  (currentStep === 4 && (!formData.transport || !formData.transportClass))
                }
              >
                {currentStep === totalSteps ? 'Generate Plan' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}