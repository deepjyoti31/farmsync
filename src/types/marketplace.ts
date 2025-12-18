
export interface MarketplaceListing {
    id: string;
    farm_id: string;
    seller_id: string;
    title: string;
    description: string;
    category: string;
    price_per_unit: number;
    unit: string;
    quantity_available: number;
    min_order_quantity: number;
    available_date: string; // ISO date string
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    images: string[];
    status: 'active' | 'sold' | 'expired';
    created_at: string;
}

export interface MarketplaceInquiry {
    id: string;
    listing_id: string;
    buyer_id: string;
    message: string;
    offer_price?: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    buyer_email?: string; // Optional, joined from profiles/users for display
    listing_title?: string; // Optional, joined for display
}

export interface Supplier {
    id: string;
    name: string;
    category: string;
    contact_info: {
        phone?: string;
        email?: string;
        website?: string;
    };
    location: string;
    description: string;
    verified: boolean;
    image_url?: string;
    created_at: string;
}

export const MARKET_CATEGORIES = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Pulses",
    "Spices",
    "Flowers",
    "Livestock",
    "Dairy",
    "Other"
];

export const UNIT_TYPES = [
    "kg",
    "quintal",
    "ton",
    "piece",
    "box",
    "crate",
    "liter"
];
