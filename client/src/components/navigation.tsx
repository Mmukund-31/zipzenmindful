import { useLocation, Link } from "wouter";
import { Home, MessageCircle, Camera, Heart, Trophy, BarChart3, Settings, Database } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const tabs = [
    { id: "dashboard", label: "Home", icon: Home, path: "/" },
    { id: "chat", label: "Chat", icon: MessageCircle, path: "/chat" },
    { id: "memories", label: "Memories", icon: Camera, path: "/memories" },
    { id: "gratitude", label: "Gratitude", icon: Heart, path: "/gratitude" },
    { id: "challenges", label: "Challenges", icon: Trophy, path: "/challenges" },
    { id: "insights", label: "Insights", icon: BarChart3, path: "/insights" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    { id: "database", label: "Database", icon: Database, path: "/database-admin" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-border p-4 sticky top-0 z-50">
      <div className="flex justify-around max-w-7xl mx-auto">
        {tabs.map(({ id, label, icon: Icon, path }) => {
          const isActive = location === path;
          return (
            <Link key={id} href={path}>
              <button
                className={`flex flex-col items-center py-2 px-3 transition-colors min-w-0 flex-1 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
                aria-label={`Navigate to ${label}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}