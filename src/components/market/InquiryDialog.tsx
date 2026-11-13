import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarketplaceListing } from '@/types/marketplace';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { updateById } from '@/utils/deleteUtils';
import { Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const inquirySchema = z.object({
    message: z.string().min(10, "Message must be at least 10 characters"),
    offer_price: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
        message: "Offer price must be a positive number",
    }),
});

interface InquiryDialogProps {
    listing: MarketplaceListing | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The seller sees the inquiries on their listing instead of the contact form. */
    isOwner?: boolean;
}

/** Inquiries buyers sent about one of the user's own listings, with accept and decline. */
const ListingInquiries: React.FC<{ listingId: string }> = ({ listingId }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: inquiries = [], isLoading } = useQuery({
        queryKey: ['marketplace_inquiries', listingId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('marketplace_inquiries')
                .select('*')
                .eq('listing_id', listingId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    const respond = async (id: string, status: 'accepted' | 'rejected') => {
        const problem = await updateById('marketplace_inquiries', id, { status }, 'This inquiry');
        if (problem) {
            toast({ title: 'Could not update', description: problem, variant: 'destructive' });
            return;
        }
        queryClient.invalidateQueries({ queryKey: ['marketplace_inquiries', listingId] });
    };

    if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
    if (inquiries.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No inquiries yet.</p>;
    return (
        <ul className="max-h-[50vh] space-y-3 overflow-y-auto">
            {inquiries.map((q) => (
                <li key={q.id} className="space-y-2 rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{q.created_at ? new Date(q.created_at).toLocaleString() : ''}</span>
                        <span className="text-xs font-medium capitalize">{q.status}</span>
                    </div>
                    <p className="whitespace-pre-line">{q.message}</p>
                    {q.offer_price != null && <p className="font-medium">Offer: ₹{q.offer_price}</p>}
                    {q.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => respond(q.id, 'rejected')}>Decline</Button>
                            <Button size="sm" onClick={() => respond(q.id, 'accepted')}>Accept</Button>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};

const InquiryDialog: React.FC<InquiryDialogProps> = ({ listing, open, onOpenChange, isOwner = false }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof inquirySchema>>({
        resolver: zodResolver(inquirySchema),
        defaultValues: {
            message: "",
            offer_price: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof inquirySchema>) => {
        if (!listing) return;
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Authentication required",
                    description: "Please log in to contact the seller.",
                    variant: "destructive",
                });
                return;
            }

            if (user.id === listing.seller_id) {
                toast({
                    title: "Action not allowed",
                    description: "You cannot inquire about your own listing.",
                    variant: "destructive",
                });
                return;
            }

            const { error } = await supabase
                .from('marketplace_inquiries')
                .insert({
                    listing_id: listing.id,
                    buyer_id: user.id,
                    message: values.message,
                    offer_price: values.offer_price ? Number(values.offer_price) : null,
                    status: 'pending'
                });

            if (error) throw error;

            toast({
                title: "Inquiry Sent",
                description: "The seller will see it with their listing.",
            });
            onOpenChange(false);
            form.reset();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send inquiry",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!listing) return null;

    if (isOwner) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Inquiries</DialogTitle>
                        <DialogDescription>
                            Messages from buyers about <strong>{listing.title}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <ListingInquiries listingId={listing.id} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Contact Seller</DialogTitle>
                    <DialogDescription>
                        Send a message regarding <strong>{listing.title}</strong>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Listed Price:</span>
                                <span className="font-semibold">₹{listing.price_per_unit}/{listing.unit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Available:</span>
                                <span>{listing.quantity_available} {listing.unit}</span>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="offer_price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Offer Price (Optional)</FormLabel>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <FormControl>
                                            <Input type="number" step="0.01" className="pl-7" placeholder="If different from listed price" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi, I'm interested in buying..."
                                            className="resize-none h-32"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Inquiry
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default InquiryDialog;
