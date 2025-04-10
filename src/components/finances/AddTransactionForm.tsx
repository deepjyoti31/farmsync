
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinancialCategory } from '@/types';

const transactionSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be greater than 0' }),
  transaction_date: z.string().min(1, { message: 'Transaction date is required' }),
  category_id: z.string().min(1, { message: 'Category is required' }),
  payment_method: z.string().optional(),
  description: z.string().optional(),
  reference_number: z.string().optional(),
  farm_id: z.string().min(1, { message: 'Farm is required' }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionFormProps {
  farmId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ farmId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const queryClient = useQueryClient();
  
  // Get financial categories from Supabase
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['financial_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      return data as FinancialCategory[] || [];
    },
  });
  
  const filteredCategories = categoriesData.filter(cat => cat.type === categoryType);
  
  const defaultValues: Partial<TransactionFormValues> = {
    transaction_date: new Date().toISOString().split('T')[0],
    farm_id: farmId || '',
    payment_method: 'cash',
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  // Update form when category type changes
  useEffect(() => {
    const firstCategoryOfType = filteredCategories[0]?.id;
    if (firstCategoryOfType) {
      form.setValue('category_id', firstCategoryOfType);
    }
  }, [categoryType, filteredCategories, form]);

  // Update form when farmId changes
  useEffect(() => {
    if (farmId) {
      form.setValue('farm_id', farmId);
    }
  }, [farmId, form]);

  const onSubmit = async (data: TransactionFormValues) => {
    console.log('Submitting transaction:', data);
    try {
      // Insert transaction into Supabase
      const { data: newTransaction, error } = await supabase
        .from('financial_transactions')
        .insert({
          amount: data.amount,
          transaction_date: data.transaction_date,
          category_id: data.category_id,
          payment_method: data.payment_method || 'Cash',
          description: data.description || '',
          reference_number: data.reference_number || null,
          farm_id: data.farm_id,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting transaction:', error);
        throw error;
      }
      
      console.log('Transaction added successfully:', newTransaction);
      
      // Invalidate query cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
      
      toast({
        title: 'Transaction added successfully',
        description: `${categoryType === 'income' ? 'Income' : 'Expense'} of ₹${data.amount} has been recorded.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Failed to add transaction',
        description: 'There was an error adding your transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogDescription>
          Record a new financial transaction for your farm.
        </DialogDescription>
      </DialogHeader>

      <div className="flex space-x-2 mb-4">
        <Button 
          variant={categoryType === 'expense' ? 'default' : 'outline'} 
          onClick={() => setCategoryType('expense')}
          type="button"
          className="w-full"
        >
          Expense
        </Button>
        <Button 
          variant={categoryType === 'income' ? 'default' : 'outline'} 
          onClick={() => setCategoryType('income')}
          type="button"
          className="w-full"
        >
          Income
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category_id"
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
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'cash'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reference_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference/Receipt Number</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Details about this transaction" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Transaction</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddTransactionForm;
