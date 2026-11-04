import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PostCommentsProps {
  postId: string;
  userId: string | null;
  onChanged: () => void;
}

/** Replies under a forum post, oldest first, with a box to add one. */
const PostComments: React.FC<PostCommentsProps> = ({ postId, userId, onChanged }) => {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post_comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, user_id, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // post_comments references auth.users, so author names come from a second lookup.
      const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const { data: profiles } = ids.length
        ? await supabase.from('profiles').select('id, first_name, last_name').in('id', ids)
        : { data: [] };
      const names = new Map((profiles ?? []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ')]));
      return (data ?? []).map((c) => ({ ...c, author: names.get(c.user_id) || 'Farmer' }));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !userId) return;
    setSaving(true);
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, content });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not post your reply', description: error.message, variant: 'destructive' });
      return;
    }
    setText('');
    queryClient.invalidateQueries({ queryKey: ['post_comments', postId] });
    onChanged();
  };

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replies yet.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{c.author}</span>
              <span className="text-xs text-muted-foreground"> · {new Date(c.created_at).toLocaleDateString()}</span>
              <p className="mt-0.5 whitespace-pre-line">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
      {userId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" aria-label="Write a reply" maxLength={2000} />
          <Button type="submit" size="icon" disabled={saving || !text.trim()} aria-label="Send reply">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </Button>
        </form>
      )}
    </div>
  );
};

export default PostComments;
