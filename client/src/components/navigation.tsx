import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, MessageCircle, Heart, TrendingUp, Settings, Brain, BookHeart, Trophy } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Home", icon: Home, path: "/" },
  { id: "gratitude", label: "Gratitude", icon: BookHeart, path: "/gratitude" },
  { id: "challenges", label: "Challenges", icon: Trophy, path: "/challenges" },
  { id: "wellness", label: "Wellness", icon: Brain, path: "/wellness" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-border px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 sticky top-0 z-10 animate-slide-in">
      <div className="flex justify-around max-w-7xl mx-auto">
        {tabs.map(({ id, label, icon: Icon, path }) => {
          const isActive = location === path;
          return (
            <Link key={id} href={path}>
              <button
                className={`nav-tab flex flex-col items-center py-2 px-1 sm:px-3 md:px-4 transition-all duration-200 min-w-0 flex-1 active:scale-95 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] ${
                  isActive
                    ? "text-primary bg-primary/10 rounded-lg shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg"
                }`}
                aria-label={`Navigate to ${label}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mb-0.5 sm:mb-1 md:mb-2" />
                <span className="text-xs sm:text-sm md:text-base font-medium truncate">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
