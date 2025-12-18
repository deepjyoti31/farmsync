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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MARKET_CATEGORIES, UNIT_TYPES } from '@/types/marketplace';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const listingSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    category: z.string().min(1, "Please select a category"),
    price_per_unit: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Price must be a positive number",
    }),
    unit: z.string().min(1, "Please select a unit"),
    quantity_available: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Quantity must be a positive number",
    }),
    min_order_quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Min order must be a positive number",
    }),
    description: z.string().optional(),
    available_date: z.string().min(1, "Please select a date"),
    farm_id: z.string().min(1, "Please select a farm"),
});

interface CreateListingDialogProps {
    farms: any[]; // Ideally Farm[] type
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

const CreateListingDialog: React.FC<CreateListingDialogProps> = ({ farms, onSuccess, trigger }) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof listingSchema>>({
        resolver: zodResolver(listingSchema),
        defaultValues: {
            title: "",
            category: "",
            price_per_unit: "",
            unit: "kg",
            quantity_available: "",
            min_order_quantity: "1",
            description: "",
            available_date: new Date().toISOString().split('T')[0],
            farm_id: farms.length > 0 ? farms[0].id : "",
        },
    });

    const onSubmit = async (values: z.infer<typeof listingSchema>) => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const selectedFarm = farms.find(f => f.id === values.farm_id);

            const { error } = await supabase
                .from('marketplace_listings')
                .insert({
                    title: values.title,
                    category: values.category,
                    price_per_unit: Number(values.price_per_unit),
                    unit: values.unit,
                    quantity_available: Number(values.quantity_available),
                    min_order_quantity: Number(values.min_order_quantity),
                    description: values.description,
                    available_date: values.available_date,
                    farm_id: values.farm_id,
                    seller_id: user.id,
                    location: selectedFarm?.location || {}, // Using farm location if available? Or just JSON
                    status: 'active'
                });

            if (error) throw error;

            toast({
                title: "Listing Created",
                description: "Your product is now listed on the marketplace.",
            });
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create listing",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Create Listing</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Listing</DialogTitle>
                    <DialogDescription>
                        List your produce for sale on the marketplace.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="farm_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Farm Source</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select farm" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {farms.map((farm) => (
                                                <SelectItem key={farm.id} value={farm.id}>
                                                    {farm.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Fresh Organic Tomatoes" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MARKET_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="available_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Available From</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price_per_unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price per Unit (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {UNIT_TYPES.map((unit) => (
                                                    <SelectItem key={unit} value={unit}>
                                                        {unit}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity_available"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity Available</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="min_order_quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Order Qty</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your produce..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Listing
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateListingDialog;
