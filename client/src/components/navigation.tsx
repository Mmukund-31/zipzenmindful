import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, MessageCircle, Heart, TrendingUp, Settings, Brain, BookHeart, Trophy } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Home", icon: Home, path: "/" },
  { id: "gratitude", label: "Gratitude", icon: BookHeart, path: "/gratitude" },
  { id: "challenges", label: "Challenges", icon: Trophy, path: "/challenges" },
  { id: "insights", label: "Insights", icon: TrendingUp, path: "/insights" },
  { id: "wellness", label: "Wellness", icon: Brain, path: "/wellness" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white border-b border-border px-4 py-2 sticky top-0 z-10">
      <div className="flex justify-around">
        {tabs.map(({ id, label, icon: Icon, path }) => {
          const isActive = location === path;
          return (
            <Link key={id} href={path}>
              <button
                className={`nav-tab flex flex-col items-center py-2 px-3 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
