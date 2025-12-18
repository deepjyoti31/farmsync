
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
import CreateOrgDialog from './CreateOrgDialog';
import { useNavigate } from 'react-router-dom';

const OrgSwitcher = () => {
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
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
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
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
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
                        <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="gap-2">
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
