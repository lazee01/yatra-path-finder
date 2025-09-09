import { MapPin, Sparkles, Users, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import heroImage from '@/assets/hero-temple.jpg';

interface HeroSectionProps {
  onStartPlanning: () => void;
}

export function HeroSection({ onStartPlanning }: HeroSectionProps) {
  const stats = [
    { label: 'Sacred Destinations', value: '500+', icon: MapPin },
    { label: 'Happy Pilgrims', value: '50K+', icon: Users },
    { label: 'Years of Trust', value: '10+', icon: Award },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Sacred Hindu Temple at Sunrise"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 hidden lg:block animate-pulse">
        <div className="w-16 h-16 bg-gradient-sacred rounded-full flex items-center justify-center shadow-sacred">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
      </div>
      
      <div className="absolute bottom-32 left-20 hidden lg:block animate-bounce">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <MapPin className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>India's #1 Spiritual Travel Planner</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">Plan Your Sacred</span>
              <br />
              <span className="text-transparent bg-gradient-sacred bg-clip-text">
                Pilgrimage Journey
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Discover India's most sacred temples, optimize your spiritual journey with AI-powered planning, 
              and create unforgettable pilgrimage experiences.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={onStartPlanning}
              size="lg"
              className="btn-sacred text-lg px-8 py-6 group"
            >
              Start Planning Your Journey
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="text-white border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-lg px-8 py-6"
              onClick={() => {
                const destinationsSection = document.querySelector('.state-destinations');
                destinationsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore 29 States
            </Button>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-sacred rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}