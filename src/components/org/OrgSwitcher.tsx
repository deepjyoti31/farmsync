
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown, Plus, SlidersHorizontal, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateOrgDialog from './CreateOrgDialog';
import { useNavigate } from 'react-router-dom';

const OrgSwitcher = ({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) => {
    const { organizations, currentOrganization, setCurrentOrganization } = useAuth();
    const [createdDialogOpen, setCreatedDialogOpen] = React.useState(false);
    const navigate = useNavigate();

    if (!currentOrganization && organizations.length === 0) {
        return null;
    }

    // Group organizations
    const personalOrg = organizations.find(org => org.is_personal);
    const otherOrgs = organizations.filter(org => !org.is_personal);

    return (
        <div className={cn('flex items-center gap-2', variant === 'sidebar' && 'w-full')}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {variant === 'sidebar' ? (
                        <button
                            type="button"
                            aria-label="Switch workspace"
                            className="flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent px-2.5 py-2 text-left text-sidebar-foreground transition-colors hover:bg-[#1E3A28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2E5A3E] text-[13px] font-bold">
                                {(currentOrganization?.name || '?').slice(0, 2).toUpperCase()}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-semibold">{currentOrganization?.name || 'Select workspace'}</span>
                                <span className="truncate text-xs text-sidebar-muted">{currentOrganization?.is_personal ? 'Personal' : 'Team'}</span>
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-muted" aria-hidden="true" />
                        </button>
                    ) : (
                    <Button
                        variant="outline"
                        className="w-[200px] justify-between px-3 md:flex hidden"
                    >
                        <div className="flex items-center gap-2 truncate">
                            {currentOrganization?.is_personal ? (
                                <User className="h-4 w-4 shrink-0" />
                            ) : (
                                <Building2 className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate">
                                {currentOrganization?.name || "Select Organization"}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className={cn(variant === 'sidebar' ? 'w-[232px]' : 'w-[200px]')} align="start">
                    <DropdownMenuLabel>Organizations</DropdownMenuLabel>

                    {personalOrg && (
                        <DropdownMenuItem
                            onClick={() => setCurrentOrganization(personalOrg)}
                            className="gap-2"
                        >
                            <User className="h-4 w-4" />
                            <span className="truncate">{personalOrg.name}</span>
                            {currentOrganization?.id === personalOrg.id && (
                                <Check className="ml-auto h-4 w-4" />
                            )}
                        </DropdownMenuItem>
                    )}

                    {otherOrgs.length > 0 && <DropdownMenuSeparator />}

                    <DropdownMenuGroup>
                        {otherOrgs.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => setCurrentOrganization(org)}
                                className="gap-2"
                            >
                                <Building2 className="h-4 w-4" />
                                <span className="truncate">{org.name}</span>
                                {currentOrganization?.id === org.id && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setCreatedDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Create New Team</span>
                    </DropdownMenuItem>

                    {!currentOrganization?.is_personal && (
                        <DropdownMenuItem onClick={() => navigate('/dashboard/organization')} className="gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Org Settings</span>
                        </DropdownMenuItem>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>

            <CreateOrgDialog open={createdDialogOpen} onOpenChange={setCreatedDialogOpen} />
        </div>
    );
};

export default OrgSwitcher;
