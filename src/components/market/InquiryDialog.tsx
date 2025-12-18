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
import { Loader2 } from 'lucide-react';

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
}

const InquiryDialog: React.FC<InquiryDialogProps> = ({ listing, open, onOpenChange }) => {
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
                description: "The seller has been notified of your interest.",
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
                                <span className="text-gray-500">Listed Price:</span>
                                <span className="font-semibold">₹{listing.price_per_unit}/{listing.unit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Available:</span>
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
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
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
