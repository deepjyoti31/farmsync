
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface AddTransactionFormProps {
  farmId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const transactionSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  transaction_date: z.date(),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ farmId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryType, setSelectedCategoryType] = useState<'income' | 'expense'>('expense');
  
  // Financial categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('financial_categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date(),
      amount: undefined,
    }
  });

  const selectedCategoryId = watch('category_id');
  
  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      if (category) {
        setSelectedCategoryType(category.type);
      }
    }
  }, [selectedCategoryId, categories]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (!farmId) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          farm_id: farmId,
          category_id: data.category_id,
          transaction_date: data.transaction_date.toISOString().split('T')[0],
          amount: data.amount,
          description: data.description || null,
          payment_method: data.payment_method || null,
          reference_number: data.reference_number || null,
        });

      if (error) throw error;

      toast({
        title: "Transaction Added",
        description: "The transaction has been recorded successfully.",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Add New Transaction</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="transaction_type">Transaction Type</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={selectedCategoryType === 'expense' ? 'default' : 'outline'}
              onClick={() => setSelectedCategoryType('expense')}
              className="flex-1"
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={selectedCategoryType === 'income' ? 'default' : 'outline'}
              onClick={() => setSelectedCategoryType('income')}
              className="flex-1"
            >
              Income
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category*</Label>
          <Select onValueChange={(value) => setValue('category_id', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter(category => category.type === selectedCategoryType)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-sm text-red-500">{errors.category_id.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Date*</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !transactionDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {transactionDate ? format(transactionDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={transactionDate}
                onSelect={(date) => {
                  setTransactionDate(date as Date);
                  setValue("transaction_date", date as Date);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)*</Label>
          <Input
            id="amount"
            placeholder="0.00"
            type="number"
            step="0.01"
            onChange={(e) => setValue('amount', parseFloat(e.target.value))}
            required
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is this transaction for?"
            {...register("description")}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select onValueChange={(value) => setValue('payment_method', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              placeholder="Receipt or invoice number"
              {...register("reference_number")}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default AddTransactionForm;
