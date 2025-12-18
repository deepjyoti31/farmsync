export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Organization {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
    updated_at?: string;
    // Personal organizations are created automatically for each user
    is_personal: boolean;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: Role;
    joined_at: string;
    // Optional user details (joined)
    user?: {
        email: string;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
    };
}

export interface OrganizationInvite {
    id: string;
    organization_id: string;
    email: string;
    role: Role;
    token: string;
    expires_at: string;
    status: 'pending' | 'accepted' | 'expired';
    created_at: string;
    created_by: string;
}

// Permissions mapping
export const PERMISSIONS = {
    VIEW_FARM: ['owner', 'admin', 'editor', 'viewer'],
    EDIT_FARM: ['owner', 'admin', 'editor'],
    DELETE_FARM: ['owner', 'admin'],
    MANAGE_MEMBERS: ['owner', 'admin'],
    DELETE_ORG: ['owner'],
} as const;

export type Permission = keyof typeof PERMISSIONS;
