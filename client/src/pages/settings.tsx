import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, LogOut, Shield, Bell, Palette, HelpCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);

  const { data: userStats } = useQuery({
    queryKey: ["/api/mood"],
    select: (data) => ({
      totalMoodEntries: data?.length || 0,
      streakDays: 0, // Could calculate streak from data
    }),
  });

  const { data: memoriesCount } = useQuery({
    queryKey: ["/api/memories"],
    select: (data) => data?.length || 0,
  });

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email;
    }
    return 'User';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Settings</h2>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName(user)} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{getUserDisplayName(user)}</h3>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
              <Badge variant="secondary" className="mt-2">
                <Heart className="w-3 h-3 mr-1" />
                Wellness Member
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{userStats?.totalMoodEntries || 0}</div>
              <div className="text-sm text-muted-foreground">Mood Entries</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">{memoriesCount || 0}</div>
              <div className="text-sm text-muted-foreground">Memories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-sm font-medium">
                Daily Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Get gentle reminders to check in with your mood
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-reports" className="text-sm font-medium">
                Weekly Reports
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive weekly insights about your wellness journey
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-sm font-medium">
                Dark Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Switch to dark theme for comfortable viewing
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Privacy & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Data Privacy</p>
              <p className="text-xs text-muted-foreground">
                Your data is encrypted and securely stored
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Secure
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Account Status</p>
              <p className="text-xs text-muted-foreground">
                Your account is active and verified
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-start">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Center
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Shield className="w-4 h-4 mr-2" />
            Privacy Policy
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/20">
        <CardContent className="p-4">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}