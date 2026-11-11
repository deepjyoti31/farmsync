
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationMember } from '@/types/rbac';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, UserPlus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import PageHeader from '@/components/common/PageHeader';

const OrgSettings = () => {
    const { currentOrganization, userRole, user, refreshOrganizations } = useAuth();
    const [members, setMembers] = useState<(OrganizationMember & { name?: string })[]>([]);
    const [orgName, setOrgName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    // Answers for a workspace the user has since switched away from are dropped,
    // so a slow reply can never show one team's data under another team's name.
    const orgIdRef = useRef(currentOrganization?.id);
    orgIdRef.current = currentOrganization?.id;

    useEffect(() => {
        if (currentOrganization) {
            setOrgName(currentOrganization.name);
            loadMembers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrganization]);

    const canManage = userRole === 'owner' || userRole === 'admin';

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = orgName.trim();
        if (!currentOrganization || !name || name === currentOrganization.name) return;
        setSavingName(true);
        const { error } = await supabase.from('organizations').update({ name }).eq('id', currentOrganization.id);
        setSavingName(false);
        if (error) {
            toast({ title: 'Could not rename', description: error.message, variant: 'destructive' });
            return;
        }
        await refreshOrganizations();
        toast({ title: 'Organization renamed' });
    };

    const loadMembers = async () => {
        if (!currentOrganization) return;
        const orgId = currentOrganization.id;
        setLoading(true);
        try {
            // Improved query to join profile data if available, falling back to auth metadata if needed
            // Note: This assumes we might have public profile table or similar, 
            // but for now we'll fetch just the members and rely on what we can get.
            // Since we don't have a public profiles table in the spec yet, we'll simpler query.
            const { data, error } = await supabase
                .from('organization_members')
                .select('*')
                .eq('organization_id', currentOrganization.id);

            if (error) throw error;
            const ids = (data ?? []).map((m) => m.user_id);
            const { data: profiles } = ids.length
                ? await supabase.from('profiles').select('id, first_name, last_name').in('id', ids)
                : { data: [] };
            const names = new Map((profiles ?? []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ')]));
            if (orgIdRef.current !== orgId) return;
            setMembers((data as OrganizationMember[]).map((m) => ({ ...m, name: names.get(m.user_id) || undefined })));
        } catch (error: any) {
            console.error('Error loading members:', error);
            toast({
                title: "Error",
                description: "Failed to load members",
                variant: "destructive",
            });
        } finally {
            if (orgIdRef.current === orgId) setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrganization || !inviteEmail.trim()) return;

        try {
            const { error } = await supabase
                .from('organization_invites')
                .insert({
                    organization_id: currentOrganization.id,
                    email: inviteEmail.trim().toLowerCase(),
                    role: inviteRole,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                    created_by: user?.id
                });

            if (error) throw error;

            toast({
                // FarmSync does not send email: the person joins automatically the next
                // time they sign in with this address (within 7 days).
                title: "Invitation created",
                description: `Ask ${inviteEmail.trim()} to sign in to FarmSync with that email within 7 days to join.`,
            });
            setIsInviteOpen(false);
            setInviteEmail('');
        } catch (error: any) {
            console.error('Error sending invite:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to send invite",
                variant: "destructive",
            });
        }
    };

    if (!currentOrganization) {
        return <div className="p-8 text-center">Please select an organization.</div>;
    }

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            <PageHeader
              title="Organization Settings"
              description={<>{currentOrganization.name}</>}
            />

            <Card>
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Manage your organization details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleRename} className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <div className="flex gap-2">
                            <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={!canManage} />
                            {canManage && (
                                <Button type="submit" disabled={savingName || !orgName.trim() || orgName.trim() === currentOrganization.name}>
                                    {savingName && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Update
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Members</CardTitle>
                        <CardDescription>People with access to this organization</CardDescription>
                    </div>
                    {(userRole === 'owner' || userRole === 'admin') && (
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Invite Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite Member</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to join {currentOrganization.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleInvite} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <select
                                            id="role"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Send Invitation</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No members found</div>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{(member.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{member.name || `Member ${member.user_id.substring(0, 8)}`}{member.user_id === user?.id ? ' (you)' : ''}</p>
                                            <p className="text-xs text-muted-foreground">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                        {member.role}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrgSettings;
