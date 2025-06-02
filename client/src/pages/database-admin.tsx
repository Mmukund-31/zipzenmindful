import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Users, MessageSquare, Heart, Camera, BarChart3, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

export default function DatabaseAdmin() {
  const [expandedMotivation, setExpandedMotivation] = useState<string | null>(null);
  
  const { data: dbData, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/admin/database"],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refresh every 30 seconds instead of 5
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/database"] });
    refetch();
  };

  // Helper function to get user name by ID from onboarding data
  const getUserName = (userId: string) => {
    const userData = users.find((u: any) => u.user?.id === userId);
    if (userData?.user) {
      // First check for full name from onboarding
      if (userData.user.name && userData.user.name.trim()) {
        return userData.user.name;
      }
      
      // Then check for firstName/lastName combination
      if (userData.user.firstName && userData.user.firstName.trim()) {
        const lastName = userData.user.lastName && userData.user.lastName.trim() ? 
          ` ${userData.user.lastName}` : '';
        return `${userData.user.firstName}${lastName}`;
      }
      
      // Fall back to email username if available
      if (userData.user.email && userData.user.email.includes('@')) {
        return userData.user.email.split('@')[0];
      }
    }
    return 'Anonymous User';
  };

  // Toggle motivation text expansion
  const toggleMotivation = (userId: string) => {
    setExpandedMotivation(expandedMotivation === userId ? null : userId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading database...</p>
        </div>
      </div>
    );
  }

  const { users = [], totalUsers = 0, totalMoodEntries = 0, totalMemories = 0, totalChatMessages = 0, totalGratitudeEntries = 0, recentActivity = {} } = dbData || {};

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Database Administration</h1>
              <p className="text-gray-600">Real-time view of all user data and activity</p>
            </div>
          </div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalMoodEntries}</div>
              <div className="text-sm text-gray-600">Mood Entries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Camera className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalMemories}</div>
              <div className="text-sm text-gray-600">Memories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalChatMessages}</div>
              <div className="text-sm text-gray-600">Chat Messages</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalGratitudeEntries}</div>
              <div className="text-sm text-gray-600">Gratitude Entries</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="moods">Mood Entries</TabsTrigger>
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="chat">Chat Messages</TabsTrigger>
            <TabsTrigger value="gratitude">Gratitude</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Users Table */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({totalUsers})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Wellness Goals</TableHead>
                        <TableHead>Preferred Time</TableHead>
                        <TableHead>Motivation</TableHead>
                        <TableHead>Data Count</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData: any, index: number) => (
                        <TableRow key={userData.user?.id || index}>
                          <TableCell className="font-mono text-xs">
                            {userData.user?.id || 'N/A'}
                          </TableCell>
                          <TableCell>{userData.user?.name || 'Anonymous'}</TableCell>
                          <TableCell>{userData.user?.age || '-'}</TableCell>
                          <TableCell className="text-xs">{userData.user?.email || '-'}</TableCell>
                          <TableCell className="max-w-32">
                            {userData.user?.wellnessGoals ? (
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(userData.user.wellnessGoals).slice(0, 2).map((goal: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {goal}
                                  </Badge>
                                ))}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{userData.user?.preferredTime || '-'}</TableCell>
                          <TableCell className="max-w-60">
                            <div className="flex items-center gap-2">
                              <div className={`text-xs ${
                                expandedMotivation === userData.user?.id ? 'whitespace-pre-wrap' : 'truncate'
                              }`}>
                                {userData.user?.motivation || '-'}
                              </div>
                              {userData.user?.motivation && userData.user.motivation.length > 50 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMotivation(userData.user.id)}
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                >
                                  {expandedMotivation === userData.user.id ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>🎭 {userData.moodEntries?.length || 0}</div>
                              <div>📸 {userData.memories?.length || 0}</div>
                              <div>💬 {userData.chatMessages?.length || 0}</div>
                              <div>🙏 {userData.gratitudeEntries?.length || 0}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {userData.user?.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mood Entries Table */}
          <TabsContent value="moods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Mood Entries ({recentActivity.recentMoods?.length || 0} shown)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Mood</TableHead>
                        <TableHead>Emoji</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentActivity.recentMoods || []).map((mood: any) => (
                        <TableRow key={mood.id}>
                          <TableCell className="text-xs">
                            {new Date(mood.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{getUserName(mood.userId)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{mood.mood}</Badge>
                          </TableCell>
                          <TableCell className="text-xl">{mood.emoji}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{mood.rating}/5</span>
                              <div className="w-16 h-2 bg-gray-200 rounded">
                                <div 
                                  className="h-full bg-blue-500 rounded"
                                  style={{ width: `${(mood.rating / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            {mood.note || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memories Table */}
          <TabsContent value="memories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Memories ({recentActivity.recentMemories?.length || 0} shown)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Favorite</TableHead>
                        <TableHead>Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentActivity.recentMemories || []).map((memory: any) => (
                        <TableRow key={memory.id}>
                          <TableCell className="text-xs">
                            {new Date(memory.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{getUserName(memory.userId)}</TableCell>
                          <TableCell className="font-medium">{memory.title}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{memory.category}</Badge>
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            {memory.description || '-'}
                          </TableCell>
                          <TableCell>
                            {memory.isFavorite ? '❤️' : '-'}
                          </TableCell>
                          <TableCell>
                            {memory.imageUrl && (
                              <img 
                                src={memory.imageUrl} 
                                alt="Memory" 
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Messages Table */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Chat Messages ({recentActivity.recentChat?.length || 0} shown)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentActivity.recentChat || []).map((message: any) => (
                        <TableRow key={message.id}>
                          <TableCell className="text-xs">
                            {new Date(message.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{getUserName(message.userId)}</TableCell>
                          <TableCell>
                            <Badge variant={message.isFromUser ? "default" : "secondary"}>
                              {message.isFromUser ? "User" : "AI"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-96">
                            <div className="whitespace-pre-wrap text-sm">{message.message}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gratitude Table */}
          <TabsContent value="gratitude" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Gratitude Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Gratitude Content</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.flatMap((userData: any) => 
                        (userData.gratitudeEntries || []).map((entry: any) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-xs">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{getUserName(entry.userId)}</TableCell>
                            <TableCell className="max-w-96">
                              <div className="whitespace-pre-wrap">{entry.content}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Overview */}
          <TabsContent value="recent" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-Time Activity Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Active Users Today</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.filter((userData: any) => userData.moodEntries?.length > 0 || userData.memories?.length > 0).map((userData: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">{getUserName(userData.user?.id)}</div>
                            <div className="text-xs text-gray-600 mb-2">{userData.user?.id}</div>
                            <div className="text-sm space-y-1">
                              <div>🎭 {userData.moodEntries?.length || 0} moods</div>
                              <div>📸 {userData.memories?.length || 0} memories</div>
                              <div>💬 {userData.chatMessages?.length || 0} messages</div>
                              <div>🙏 {userData.gratitudeEntries?.length || 0} gratitude</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}