import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  ThumbsUp,
  Users,
  Share2,
  SendHorizontal,
  Sprout,
  Tractor,
  Book,
  MessageCircle,
  Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const Community = () => {
  const [newPost, setNewPost] = useState('');
  const [activeForum, setActiveForum] = useState('general');

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch forums 
  const { data: forums = [] } = useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching forums:', error);
        return [
          { id: 'general', title: 'General Discussion', description: 'Talk about anything farming related' },
          { id: 'crops', title: 'Crop Management', description: 'Share tips and advice about crop cultivation' },
          { id: 'equipment', title: 'Farm Equipment', description: 'Discuss farming equipment and tools' },
          { id: 'market', title: 'Market & Prices', description: 'Updates about agricultural markets and pricing' },
        ];
      }

      return data;
    },
  });

  // Fetch posts for the active forum
  const { data: posts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['forum_posts', activeForum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles(first_name, last_name, profile_image_url)
        `)
        .eq('forum_id', activeForum)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        // If table doesn't exist, return mock data
        return [
          {
            id: '1',
            title: 'Tips for managing pests in organic farming',
            content: 'I've been trying organic methods to control pests in my vegetable garden. Has anyone tried neem oil spray?',
            created_at: new Date().toISOString(),
            user: { 
              first_name: 'Arjun', 
              last_name: 'Patel',
              profile_image_url: null 
            },
            comment_count: 5,
            like_count: 12
          },
          {
            id: '2',
            title: 'Best practices for soil health maintenance',
            content: 'I'm looking to improve my soil health naturally. What cover crops do you recommend for sandy soils?',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            user: { 
              first_name: 'Priya', 
              last_name: 'Sharma',
              profile_image_url: null 
            },
            comment_count: 8,
            like_count: 19
          },
        ];
      }

      // Process the data to add comment counts and user info
      const processedPosts = data.map((post) => ({
        ...post,
        user: post.profiles ? {
          first_name: post.profiles.first_name,
          last_name: post.profiles.last_name,
          profile_image_url: post.profiles.profile_image_url
        } : null,
        comment_count: 0, // You might want to fetch this separately
        like_count: Math.floor(Math.random() * 20)
      }));

      return processedPosts;
    },
    enabled: !!activeForum,
  });

  // Fetch expert tips
  const { data: expertTips = [] } = useQuery({
    queryKey: ['expert_tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expert_tips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching expert tips:', error);
        return [
          {
            id: '1',
            title: 'Crop Rotation Basics',
            content: 'Rotating crops helps prevent soil depletion and reduces pest problems. Try to avoid planting the same family of crops in the same spot for at least 3 years.',
            category: 'crop',
            is_verified: true,
          },
          {
            id: '2',
            title: 'Water Conservation Tips',
            content: 'Drip irrigation can save up to 60% of water compared to conventional methods. Consider installing a rainwater harvesting system to supplement your water needs.',
            category: 'general',
            is_verified: true,
          },
        ];
      }

      return data;
    },
  });

  const handleCreatePost = async () => {
    if (!newPost.trim() || !userData) {
      toast({
        title: "Error",
        description: "Please write something to post",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          content: newPost,
          forum_id: activeForum,
          user_id: userData.id,
          title: newPost.split('.')[0] || 'New post',  // Use first sentence as title
        });

      if (error) throw error;

      setNewPost('');
      toast({
        title: "Success",
        description: "Your post has been published",
      });
      refetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to publish your post",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'crop':
        return <Sprout className="h-4 w-4" />;
      case 'equipment':
        return <Tractor className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };

  const getInitials = (firstName = '', lastName = '') => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">FarmSync Community</h1>
            <p className="text-muted-foreground">Connect with other farmers, share knowledge and learn from experts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/avatar.png" />
                    <AvatarFallback>
                      {userData ? getInitials(userData.user_metadata?.first_name, userData.user_metadata?.last_name) : 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Textarea 
                      placeholder="Share your farming experience or ask a question..." 
                      className="resize-none"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleCreatePost}>
                        <SendHorizontal className="mr-2 h-4 w-4" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forum Tabs */}
            <Tabs defaultValue="general" value={activeForum} onValueChange={setActiveForum}>
              <TabsList className="w-full mb-4">
                {forums.map((forum) => (
                  <TabsTrigger key={forum.id} value={forum.id} className="flex-1">
                    {forum.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {forums.map((forum) => (
                <TabsContent key={forum.id} value={forum.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{forum.title}</CardTitle>
                      <CardDescription>{forum.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPosts ? (
                        <div className="py-10 text-center">
                          <MessageSquare className="h-10 w-10 mx-auto animate-pulse text-muted-foreground" />
                          <p className="mt-4 text-muted-foreground">Loading discussions...</p>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="py-10 text-center">
                          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50" />
                          <p className="mt-4 text-muted-foreground">No discussions yet</p>
                          <p className="text-sm text-muted-foreground/70">Be the first to start a conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {posts.map((post) => (
                            <div key={post.id} className="p-4 border rounded-md">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={post.user?.profile_image_url || ""} />
                                  <AvatarFallback>
                                    {getInitials(post.user?.first_name, post.user?.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{post.user?.first_name} {post.user?.last_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(post.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <h3 className="font-medium mt-2">{post.title}</h3>
                                  <p className="text-sm mt-1">{post.content}</p>
                                  <div className="flex items-center gap-4 mt-4">
                                    <Button variant="ghost" size="sm">
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      {post.like_count || 0}
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <MessageCircle className="h-4 w-4 mr-1" />
                                      {post.comment_count || 0}
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Share2 className="h-4 w-4 mr-1" />
                                      Share
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Expert Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expert Tips</CardTitle>
                <CardDescription>Farming advice from agricultural experts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expertTips.map((tip) => (
                    <div key={tip.id} className="p-3 border rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(tip.category)}
                        <h4 className="font-medium text-sm">{tip.title}</h4>
                        {tip.is_verified && (
                          <Badge variant="outline" className="ml-auto text-xs">Verified</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{tip.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">View All Tips</Button>
              </CardFooter>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Active Members</p>
                      <p className="text-2xl font-bold">823</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Discussions</p>
                      <p className="text-2xl font-bold">1,246</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Groups</CardTitle>
                <CardDescription>Join specialized farming groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Sprout className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Organic Farming</p>
                        <p className="text-xs text-muted-foreground">342 members</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Tractor className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Modern Equipment</p>
                        <p className="text-xs text-muted-foreground">215 members</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">View All Groups</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
