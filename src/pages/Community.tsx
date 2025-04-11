
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Users, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  ThumbsUp, 
  Send,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  forum_id: string;
  user_name?: string;
  comment_count?: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  user_name?: string;
}

interface Forum {
  id: string;
  title: string;
  description: string;
  created_at: string;
  post_count?: number;
}

interface CommunityUser {
  id: string;
  full_name: string;
  profile_image_url?: string;
}

const Community = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('forums');
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPostDialog, setNewPostDialog] = useState(false);
  const [newForumDialog, setNewForumDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', forumId: '' });
  const [newForum, setNewForum] = useState({ title: '', description: '' });
  const [newComment, setNewComment] = useState('');

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch profile data
  const { data: profileData } = useQuery({
    queryKey: ['profile', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!userData?.id,
  });

  // Fetch forums
  const { data: forums = [], isLoading: forumsLoading } = useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching forums:', error);
        throw error;
      }
      
      // Get post counts for each forum
      const forumIds = data.map(forum => forum.id);
      const { data: postCounts, error: postCountError } = await supabase
        .from('forum_posts')
        .select('forum_id, count(*)', { count: 'exact' })
        .in('forum_id', forumIds)
        .group('forum_id');
      
      if (postCountError) {
        console.error('Error fetching post counts:', postCountError);
      }
      
      // Map post counts to forums
      return data.map(forum => ({
        ...forum,
        post_count: postCounts?.find(pc => pc.forum_id === forum.id)?.count || 0
      }));
    },
  });

  // Fetch posts for a specific forum
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', selectedForum?.id],
    queryFn: async () => {
      if (!selectedForum) return [];
      
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('forum_id', selectedForum.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      // Fetch user profiles to get names
      const userIds = [...new Set(data.map(post => post.user_id))];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Get comment counts for each post
      const postIds = data.map(post => post.id);
      const { data: commentCounts, error: commentCountError } = await supabase
        .from('forum_comments')
        .select('post_id, count(*)', { count: 'exact' })
        .in('post_id', postIds)
        .group('post_id');
      
      if (commentCountError) {
        console.error('Error fetching comment counts:', commentCountError);
      }
      
      // Map user names and comment counts to posts
      return data.map(post => {
        const userProfile = profiles?.find(p => p.id === post.user_id);
        const userName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Unknown User';
        
        return {
          ...post,
          user_name: userName,
          comment_count: commentCounts?.find(cc => cc.post_id === post.id)?.count || 0
        };
      });
    },
    enabled: !!selectedForum,
  });

  // Fetch comments for a specific post
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', selectedPost?.id],
    queryFn: async () => {
      if (!selectedPost) return [];
      
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', selectedPost.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
      
      // Fetch user profiles to get names
      const userIds = [...new Set(data.map(comment => comment.user_id))];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Map user names to comments
      return data.map(comment => {
        const userProfile = profiles?.find(p => p.id === comment.user_id);
        const userName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Unknown User';
        
        return {
          ...comment,
          user_name: userName
        };
      });
    },
    enabled: !!selectedPost,
  });

  // Fetch community users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['community_users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image_url')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching community users:', error);
        throw error;
      }
      
      return profiles.map(profile => ({
        id: profile.id,
        full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous User',
        profile_image_url: profile.profile_image_url
      }));
    },
  });

  // Create a new forum
  const createForumMutation = useMutation({
    mutationFn: async () => {
      if (!newForum.title) {
        throw new Error('Forum title is required');
      }
      
      const { data, error } = await supabase
        .from('forums')
        .insert([{
          title: newForum.title,
          description: newForum.description
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      setNewForumDialog(false);
      setNewForum({ title: '', description: '' });
      toast({
        title: 'Success',
        description: 'Forum created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating forum:', error);
      toast({
        title: 'Error',
        description: 'Failed to create forum',
        variant: 'destructive',
      });
    },
  });

  // Create a new post
  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id) throw new Error('You must be logged in to post');
      if (!newPost.title) throw new Error('Post title is required');
      if (!newPost.content) throw new Error('Post content is required');
      if (!newPost.forumId) throw new Error('Forum selection is required');
      
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([{
          title: newPost.title,
          content: newPost.content,
          forum_id: newPost.forumId,
          user_id: userData.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      setNewPostDialog(false);
      setNewPost({ title: '', content: '', forumId: '' });
      
      // Navigate to the new post
      const forum = forums.find(f => f.id === data.forum_id);
      if (forum) {
        setSelectedForum(forum);
        setSelectedPost(data);
        setActiveTab('posts');
      }
      
      toast({
        title: 'Success',
        description: 'Post created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      });
    },
  });

  // Add a comment
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id) throw new Error('You must be logged in to comment');
      if (!selectedPost) throw new Error('No post selected');
      if (!newComment.trim()) throw new Error('Comment cannot be empty');
      
      const { data, error } = await supabase
        .from('forum_comments')
        .insert([{
          content: newComment,
          post_id: selectedPost.id,
          user_id: userData.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        variant: 'destructive',
      });
    },
  });

  const handleForumSelect = (forum: Forum) => {
    setSelectedForum(forum);
    setSelectedPost(null);
    setActiveTab('posts');
  };

  const handlePostSelect = (post: Post) => {
    setSelectedPost(post);
    setActiveTab('comments');
  };

  const handleGoBack = () => {
    if (activeTab === 'comments') {
      setActiveTab('posts');
      setSelectedPost(null);
    } else if (activeTab === 'posts') {
      setActiveTab('forums');
      setSelectedForum(null);
    }
  };

  const handleAddComment = () => {
    addCommentMutation.mutate();
  };

  const handleCreateForum = () => {
    createForumMutation.mutate();
  };

  const handleCreatePost = () => {
    createPostMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground">Connect with other farmers, share knowledge and ask questions</p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          {activeTab === 'forums' && (
            <Button onClick={() => setNewForumDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Forum
            </Button>
          )}
          {activeTab === 'posts' && selectedForum && (
            <Button onClick={() => setNewPostDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          )}
          {(activeTab === 'posts' || activeTab === 'comments') && (
            <Button variant="outline" onClick={handleGoBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="forums" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="forums" onClick={() => {
                setSelectedForum(null);
                setSelectedPost(null);
              }}>
                Forums
              </TabsTrigger>
              <TabsTrigger value="posts" disabled={!selectedForum}>
                {selectedForum ? `Posts - ${selectedForum.title}` : 'Posts'}
              </TabsTrigger>
              <TabsTrigger value="comments" disabled={!selectedPost}>
                {selectedPost ? `Discussion - ${selectedPost.title}` : 'Discussion'}
              </TabsTrigger>
            </TabsList>
            
            {/* Forums Tab */}
            <TabsContent value="forums">
              <Card>
                <CardHeader>
                  <CardTitle>Discussion Forums</CardTitle>
                  <CardDescription>Browse topics and join conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {forumsLoading ? (
                    <div className="flex justify-center p-8">
                      <Users className="h-8 w-8 animate-pulse text-muted-foreground" />
                    </div>
                  ) : forums.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No forums available</p>
                      <p className="text-sm mt-2">Be the first to create a discussion forum</p>
                      <Button className="mt-4" onClick={() => setNewForumDialog(true)}>Create Forum</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {forums.map((forum) => (
                        <div 
                          key={forum.id} 
                          className="flex justify-between p-4 rounded-md border hover:bg-accent transition cursor-pointer"
                          onClick={() => handleForumSelect(forum)}
                        >
                          <div>
                            <h3 className="font-medium">{forum.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{forum.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Created: {formatDate(forum.created_at)}
                              </span>
                              <Badge variant="secondary">{forum.post_count} posts</Badge>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Posts Tab */}
            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedForum?.title}</CardTitle>
                  <CardDescription>{selectedForum?.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {postsLoading ? (
                    <div className="flex justify-center p-8">
                      <MessageSquare className="h-8 w-8 animate-pulse text-muted-foreground" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No posts in this forum yet</p>
                      <p className="text-sm mt-2">Start the conversation by creating the first post</p>
                      <Button className="mt-4" onClick={() => setNewPostDialog(true)}>Create Post</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div 
                          key={post.id} 
                          className="flex justify-between p-4 rounded-md border hover:bg-accent transition cursor-pointer"
                          onClick={() => handlePostSelect(post)}
                        >
                          <div>
                            <h3 className="font-medium">{post.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {post.content.length > 120 ? `${post.content.substring(0, 120)}...` : post.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Posted by: {post.user_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(post.created_at)}
                              </span>
                              <Badge variant="secondary">{post.comment_count} comments</Badge>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Comments Tab */}
            <TabsContent value="comments">
              {selectedPost && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedPost.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        Posted by: {selectedPost.user_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(selectedPost.created_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 mb-6 bg-accent/20 rounded-md">
                      <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                    </div>
                    
                    <h3 className="font-medium text-lg mb-4">Comments</h3>
                    
                    {commentsLoading ? (
                      <div className="flex justify-center p-8">
                        <MessageSquare className="h-8 w-8 animate-pulse text-muted-foreground" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No comments yet</p>
                        <p className="text-sm mt-2">Be the first to comment</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 p-2">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4 p-3 rounded-md border">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{getUserInitials(comment.user_name || '')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-sm">{comment.user_name}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                              <div className="flex gap-2 mt-2">
                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  Like
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {userData ? (
                      <div className="flex gap-3 items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {profileData ? getUserInitials(`${profileData.first_name || ''} ${profileData.last_name || ''}`) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                          <Textarea 
                            placeholder="Write a comment..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="pr-12"
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="absolute right-2 top-2"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        You need to be logged in to comment
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Members</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center p-4">
                  <Users className="h-6 w-6 animate-pulse text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No members found</p>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile_image_url || ''} alt={user.full_name} />
                        <AvatarFallback>{getUserInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.full_name}</span>
                    </div>
                  ))}
                  {users.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all members ({users.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Be respectful to other community members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Share accurate and helpful information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep discussions on topic and relevant</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>No commercial advertising or spam</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Report inappropriate content</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Forum Dialog */}
      <Dialog open={newForumDialog} onOpenChange={setNewForumDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Forum</DialogTitle>
            <DialogDescription>
              Create a new discussion topic for the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="forum-title" className="text-sm font-medium">Forum Title</label>
              <Input 
                id="forum-title" 
                placeholder="Enter forum title" 
                value={newForum.title}
                onChange={(e) => setNewForum({...newForum, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="forum-description" className="text-sm font-medium">Description</label>
              <Textarea 
                id="forum-description" 
                placeholder="Enter forum description" 
                value={newForum.description}
                onChange={(e) => setNewForum({...newForum, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewForumDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateForum}
              disabled={!newForum.title}
            >
              Create Forum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Post Dialog */}
      <Dialog open={newPostDialog} onOpenChange={setNewPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts or questions with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {!selectedForum && (
              <div className="space-y-2">
                <label htmlFor="forum-select" className="text-sm font-medium">Select Forum</label>
                <Select 
                  value={newPost.forumId} 
                  onValueChange={(value) => setNewPost({...newPost, forumId: value})}
                >
                  <SelectTrigger id="forum-select">
                    <SelectValue placeholder="Select a forum" />
                  </SelectTrigger>
                  <SelectContent>
                    {forums.map((forum) => (
                      <SelectItem key={forum.id} value={forum.id}>{forum.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="post-title" className="text-sm font-medium">Post Title</label>
              <Input 
                id="post-title" 
                placeholder="Enter post title" 
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="post-content" className="text-sm font-medium">Content</label>
              <Textarea 
                id="post-content" 
                placeholder="Enter post content" 
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                className="min-h-[150px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewPostDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePost}
              disabled={
                !newPost.title || 
                !newPost.content || 
                (!selectedForum && !newPost.forumId)
              }
            >
              Create Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
