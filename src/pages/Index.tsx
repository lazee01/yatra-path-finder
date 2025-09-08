import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Onboarding } from '@/components/Onboarding';
import { HeroSection } from '@/components/HeroSection';
import { TripPlanner } from '@/components/TripPlanner';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleStartPlanning = () => {
    setActiveTab('plan');
  };

  // Show onboarding if user hasn't seen it
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="pb-20 lg:pb-0">
        {activeTab === 'home' && (
          <HeroSection onStartPlanning={handleStartPlanning} />
        )}
        
        {activeTab === 'plan' && (
          <TripPlanner />
        )}
        
        {activeTab === 'trips' && (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-sacred-gradient">My Trips</h1>
              <p className="text-muted-foreground">Your saved spiritual journeys will appear here</p>
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-w-md">
                This feature requires backend integration with Supabase for user authentication and data storage.
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-sacred-gradient">Profile</h1>
              <p className="text-muted-foreground">Manage your spiritual journey preferences</p>
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-w-md">
                Authentication system requires Supabase integration for user management.
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'help' && (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-sacred-gradient">Help & Support</h1>
              <p className="text-muted-foreground">Get assistance with your spiritual journey planning</p>
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-w-md">
                Help system and knowledge base ready for content integration.
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'chat' && (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-sacred-gradient">Chat Support</h1>
              <p className="text-muted-foreground">Real-time assistance for your pilgrimage planning</p>
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-w-md">
                Chat functionality requires backend integration with Supabase and real-time messaging.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
