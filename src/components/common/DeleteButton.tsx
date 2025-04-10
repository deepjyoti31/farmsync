
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteButtonProps {
  onDelete: () => Promise<void> | void;
  itemName?: string;
  entityType?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
}

/**
 * A standalone delete button component that handles confirmation and deletion
 */
export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  itemName,
  entityType = "item",
  buttonSize = "default",
  buttonVariant = "outline",
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      console.error("Delete operation failed:", error);
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant={buttonVariant} 
        size={buttonSize}
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {children || (
          <>
            <Trash className="h-4 w-4" />
            {buttonSize !== "icon" && <span>Delete</span>}
          </>
        )}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemName 
                ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
                : `Are you sure you want to delete this ${entityType.toLowerCase()}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteButton;
