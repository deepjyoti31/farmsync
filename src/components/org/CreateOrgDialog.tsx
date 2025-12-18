
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Building2 } from 'lucide-react';

interface CreateOrgDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const CreateOrgDialog: React.FC<CreateOrgDialogProps> = ({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }) => {
    const { t } = useTranslation();
    const { user, refreshOrganizations, setCurrentOrganization } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setLoading(true);
        try {
            // 1. Create Organization
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: name.trim(),
                    owner_id: user.id,
                    is_personal: false
                })
                .select()
                .single();

            if (orgError) throw orgError;

            // 2. Add creator as 'owner'
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: orgData.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // 3. Refresh context
            await refreshOrganizations();

            // 4. Set as active
            setCurrentOrganization(orgData);

            toast({
                title: t('common.success'),
                description: "Organization created successfully",
            });

            setOpen?.(false);
            setName('');
        } catch (error: any) {
            console.error('Error creating organization:', error);
            toast({
                title: t('common.error'),
                description: error.message || "Failed to create organization",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="w-full justify-start gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Create Organization</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                    <DialogDescription>
                        Create a new organization to collaborate with your team.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="org-name"
                                placeholder="e.g. Sunny Valley Co-op"
                                className="pl-9"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen?.(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading ? "Creating..." : "Create Organization"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOrgDialog;
