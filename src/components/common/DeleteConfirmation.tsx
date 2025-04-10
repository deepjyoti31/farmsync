
import React from 'react';
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
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  entityType?: string;
  isDeleting?: boolean;
  triggerButton?: React.ReactNode;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  entityType = "item",
  isDeleting = false,
  triggerButton,
}) => {
  const dialogTitle = title || `Delete ${entityType}`;
  const dialogDescription = description || (
    itemName 
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : `Are you sure you want to delete this ${entityType.toLowerCase()}? This action cannot be undone.`
  );

  if (triggerButton) {
    return (
      <AlertDialog>
        {triggerButton}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirm} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * A convenience button that opens a delete confirmation dialog
 */
export const DeleteButton: React.FC<{
  onDelete: () => Promise<void> | void;
  itemName?: string;
  entityType?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
}> = ({
  onDelete,
  itemName,
  entityType = "item",
  buttonSize = "default",
  buttonVariant = "outline",
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <DeleteConfirmation
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={handleDelete}
      itemName={itemName}
      entityType={entityType}
      isDeleting={isDeleting}
      triggerButton={
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
      }
    />
  );
};

export default DeleteConfirmation;
