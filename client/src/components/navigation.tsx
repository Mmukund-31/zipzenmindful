import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, MessageCircle, Heart, TrendingUp, Settings, Brain, BookHeart, Trophy, Menu, X } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Home", icon: Home, path: "/" },
  { id: "gratitude", label: "Gratitude", icon: BookHeart, path: "/gratitude" },
  { id: "challenges", label: "Challenges", icon: Trophy, path: "/challenges" },
  { id: "wellness", label: "Wellness", icon: Brain, path: "/wellness" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

const extendedTabs = [
  ...tabs,
  { id: "chat", label: "Chat", icon: MessageCircle, path: "/chat" },
  { id: "talk", label: "Voice", icon: Brain, path: "/talk" },
  { id: "memories", label: "Memories", icon: Heart, path: "/memories" },
  { id: "insights", label: "Insights", icon: TrendingUp, path: "/insights" },
];

export default function Navigation() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayTabs = isMobile ? tabs : extendedTabs;
  const visibleTabs = isMobile && !isExpanded ? tabs.slice(0, 4) : displayTabs;

  return (
    <>
      {/* Enhanced Mobile Navigation */}
      <nav className="bg-white dark:bg-gray-950 border-b border-border px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 sticky top-0 z-50 animate-slide-in backdrop-blur-lg bg-white/95 dark:bg-gray-950/95">
        <div className="flex justify-around max-w-7xl mx-auto relative">
          {visibleTabs.map(({ id, label, icon: Icon, path }) => {
            const isActive = location === path;
            return (
              <Link key={id} href={path}>
                <button
                  className={`nav-tab flex flex-col items-center py-2 px-1 sm:px-2 md:px-3 lg:px-4 transition-all duration-200 min-w-0 flex-1 active:scale-95 min-h-[56px] sm:min-h-[64px] md:min-h-[72px] lg:min-h-[80px] relative touch-manipulation ${
                    isActive
                      ? "text-primary bg-primary/10 rounded-lg shadow-sm border border-primary/20"
                      : "text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg hover:shadow-sm"
                  }`}
                  aria-label={`Navigate to ${label}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsExpanded(false)}
                >
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 md:w-10 h-1 bg-primary rounded-full shadow-sm" />
                  )}
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-0.5 sm:mb-1 md:mb-2 transition-all duration-200" />
                  <span className="text-xs sm:text-sm md:text-base font-medium truncate leading-tight">{label}</span>
                </button>
              </Link>
            );
          })}
          
          {/* Mobile More Button */}
          {isMobile && (
            <button
              className={`nav-tab flex flex-col items-center py-2 px-1 transition-all duration-200 min-w-0 flex-1 active:scale-95 min-h-[56px] touch-manipulation rounded-lg ${
                isExpanded 
                  ? "text-primary bg-primary/10 shadow-sm border border-primary/20" 
                  : "text-muted-foreground hover:text-primary hover:bg-muted/50 hover:shadow-sm"
              }`}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Show more navigation options"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <X className="w-4 h-4 mb-0.5 transition-all duration-200" />
              ) : (
                <Menu className="w-4 h-4 mb-0.5 transition-all duration-200" />
              )}
              <span className="text-xs font-medium leading-tight">{isExpanded ? 'Less' : 'More'}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Expanded Mobile Menu */}
      {isMobile && isExpanded && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setIsExpanded(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-950 rounded-t-2xl p-4 animate-scale-in shadow-2xl border-t border-gray-200 dark:border-gray-800">
            <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 opacity-60" />
            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {extendedTabs.map(({ id, label, icon: Icon, path }) => {
                const isActive = location === path;
                return (
                  <Link key={id} href={path}>
                    <button
                      className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[80px] ${
                        isActive
                          ? "text-primary bg-primary/10 shadow-sm border border-primary/20"
                          : "text-muted-foreground hover:text-primary hover:bg-muted/50 hover:shadow-sm"
                      }`}
                      onClick={() => setIsExpanded(false)}
                      aria-label={`Navigate to ${label}`}
                    >
                      <Icon className="w-6 h-6 mb-2 transition-all duration-200" />
                      <span className="text-sm font-medium text-center leading-tight">{label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
