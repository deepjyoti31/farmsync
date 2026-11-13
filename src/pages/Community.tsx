
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import PageHeader from '@/components/common/PageHeader';
import PostComments from '@/components/community/PostComments';

const Community = () => {
  const [newPost, setNewPost] = useState('');
  const [activeForum, setActiveForum] = useState('');
  const [openComments, setOpenComments] = useState<string | null>(null);

  // Fetch user data
  const { user: userData } = useAuth();
  const queryClient = useQueryClient();

  // Fetch forums 
  const { data: forums = [] } = useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forums')
        .select('*, forum_posts(count)')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Open the first forum once forums have loaded
  useEffect(() => {
    if (!activeForum && forums.length > 0) {
      setActiveForum(forums[0].id);
    }
  }, [forums, activeForum]);

  // Real community totals for the stats card
  const { data: communityStats } = useQuery({
    queryKey: ['community_stats'],
    queryFn: async () => {
      const [members, discussions] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
      ]);
      return {
        members: members.count ?? 0,
        discussions: discussions.count ?? 0,
      };
    },
  });

  // Fetch posts for the active forum, with author profile and comment/like counts
  const { data: posts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['forum_posts', activeForum, userData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          user:profiles(first_name, last_name, avatar_url),
          comments:post_comments(count),
          likes:post_likes(user_id)
        `)
        .eq('forum_id', activeForum)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((post) => ({
        ...post,
        comment_count: post.comments?.[0]?.count ?? 0,
        like_count: post.likes?.length ?? 0,
        liked: !!userData && (post.likes ?? []).some((l) => l.user_id === userData.id),
      }));
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

  const toggleLike = async (post: { id: string; liked: boolean }) => {
    if (!userData) return;
    const { error } = post.liked
      ? await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userData.id)
      : await supabase.from('post_likes').insert({ post_id: post.id, user_id: userData.id });
    if (error) {
      toast({ title: 'Could not update your like', description: error.message, variant: 'destructive' });
      return;
    }
    refetchPosts();
  };

  const handleCreatePost = async () => {
    if (!activeForum) return;
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
          content: newPost.trim(),
          forum_id: activeForum,
          user_id: userData.id,
          // First sentence as the title, kept to a heading's length
          title: (newPost.trim().split(/[.\n]/)[0] || 'New post').slice(0, 120),
        });

      if (error) throw error;

      setNewPost('');
      toast({
        title: "Success",
        description: "Your post has been published",
      });
      refetchPosts();
      // The forum tabs and the stats card count posts too.
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      queryClient.invalidateQueries({ queryKey: ['community_stats'] });
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
    <div className="w-full">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Community"
          description="Connect with other farmers, share knowledge and learn from experts"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userData?.user_metadata?.avatar_url || undefined} />
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
            <Tabs value={activeForum} onValueChange={setActiveForum}>
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
                                  <AvatarImage src={post.user?.avatar_url || ""} />
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
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-pressed={post.liked}
                                      className={post.liked ? 'text-primary' : undefined}
                                      onClick={() => toggleLike(post)}
                                    >
                                      <ThumbsUp className={`h-4 w-4 mr-1 ${post.liked ? 'fill-current' : ''}`} />
                                      {post.like_count || 0}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-expanded={openComments === post.id}
                                      onClick={() => setOpenComments((id) => (id === post.id ? null : post.id))}
                                    >
                                      <MessageCircle className="h-4 w-4 mr-1" />
                                      {post.comment_count || 0}
                                    </Button>
                                  </div>
                                  {openComments === post.id && (
                                    <PostComments postId={post.id} userId={userData?.id ?? null} onChanged={() => refetchPosts()} />
                                  )}
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
                      <p className="text-2xl font-bold">{(communityStats?.members ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Discussions</p>
                      <p className="text-2xl font-bold">{(communityStats?.discussions ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
