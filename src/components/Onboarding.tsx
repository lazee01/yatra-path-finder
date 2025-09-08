import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Brain, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import onboarding1 from '@/assets/onboarding-1.jpg';
import onboarding2 from '@/assets/onboarding-2.jpg';
import onboarding3 from '@/assets/onboarding-3.jpg';

const slides = [
  {
    id: 1,
    title: 'Plan your hassle-free',
    highlight: 'Spiritual Journey',
    description: 'Discover sacred destinations across India with personalized pilgrimage planning tailored to your spiritual needs.',
    image: onboarding1,
    icon: Sparkles,
    color: 'from-primary to-accent',
  },
  {
    id: 2,
    title: 'Smart AI-powered',
    highlight: 'Trip Planner',
    description: 'Get optimal transport, hotel & temple suggestions powered by intelligent algorithms and real-time data.',
    image: onboarding2,
    icon: Brain,
    color: 'from-accent to-primary-glow',
  },
  {
    id: 3,
    title: 'Export & Book',
    highlight: 'Trips Easily',
    description: 'Save your spiritual journey plan as PDF or share with others. Book directly through our trusted partners.',
    image: onboarding3,
    icon: Share2,
    color: 'from-primary-glow to-secondary',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-peaceful flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-sacred rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-sacred-gradient">SpiritualJourney</span>
        </div>
        
        <Button variant="ghost" onClick={onComplete} className="text-muted-foreground hover:text-foreground">
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md container-peaceful border-0 shadow-peaceful">
          {/* Image */}
          <div className="relative h-64 rounded-xl overflow-hidden mb-6">
            <img 
              src={slide.image} 
              alt={`Onboarding ${slide.id}`}
              className="w-full h-full object-cover"
            />
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t opacity-20",
              `bg-gradient-to-t ${slide.color}`
            )} />
            <div className="absolute bottom-4 left-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm"
              )}>
                <slide.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-2xl font-bold leading-tight">
              {slide.title}{' '}
              <span className="text-sacred-gradient">{slide.highlight}</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentSlide 
                    ? "bg-primary w-8" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <Button
              onClick={nextSlide}
              className="btn-sacred"
            >
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}