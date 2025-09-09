import { useState } from 'react';
import { Home, MapPin, Calendar, User, HelpCircle, MessageCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import mokshayatraLogo from '@/assets/moksha-yatra-logo.png';

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'plan', label: 'Plan Trip', icon: MapPin, path: '/plan' },
  { id: 'trips', label: 'My Trips', icon: Calendar, path: '/trips' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
  { id: 'chat', label: 'Chat Support', icon: MessageCircle, path: '/chat' },
];

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function Navigation({ activeTab = 'home', onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden lg:flex items-center justify-between bg-background/95 backdrop-blur-sm border-b px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <img 
            src={mokshayatraLogo} 
            alt="Moksha Yatra AI" 
            className="h-10 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center space-x-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "flex items-center space-x-2 transition-all duration-200",
                activeTab === item.id 
                  ? "bg-gradient-sacred text-white shadow-sacred" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50">
        <div className="flex items-center justify-around py-2 px-2">
          {navigationItems.slice(0, 5).map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "flex flex-col items-center space-y-1 h-14 w-14 p-1 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-gradient-sacred text-white shadow-sacred" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center space-y-1 h-14 w-14 p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            <Menu className="h-4 w-4" />
            <span className="text-xs font-medium">More</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background rounded-t-2xl p-6 w-full animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full w-8 h-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => handleTabClick(item.id)}
                  className={cn(
                    "w-full justify-start space-x-3 h-12 text-left transition-all duration-200",
                    activeTab === item.id 
                      ? "bg-gradient-sacred text-white shadow-sacred" 
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}