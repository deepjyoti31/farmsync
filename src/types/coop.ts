export type BulkOrderStatus = 'open' | 'closed' | 'ordered' | 'delivered';
export type MemberOrderStatus = 'committed' | 'paid';
export type BatchStatus = 'collecting' | 'processing' | 'shipped';

export interface BulkOrder {
    id: string;
    organization_id: string;
    title: string;
    status: BulkOrderStatus;
    deadline: string;
    created_at: string;
    total_amount?: number; // Calculated field
    item_count?: number;   // Calculated field
}

export interface BulkOrderItem {
    id: string;
    bulk_order_id: string;
    product_name: string;
    unit_price: number;
    unit: string;
}

export interface MemberOrder {
    id: string;
    bulk_order_id: string;
    user_id: string;
    items: {
        product_name: string;
        quantity: number;
        unit: string;
    }[];
    status: MemberOrderStatus;
    total_estimated_cost?: number;
}

export interface ProduceBatch {
    id: string;
    organization_id: string;
    batch_number: string;
    crop_name: string;
    total_quantity: number;
    status: BatchStatus;
    created_at: string;
}

export interface BatchContribution {
    id: string;
    batch_id: string;
    harvest_id: string;
    quantity: number;
    farmer_name?: string; // Joined field
}

export interface CoopStats {
    totalMembers: number;
    totalArea: number;
    activeBatches: number;
    openOrders: number;
}
