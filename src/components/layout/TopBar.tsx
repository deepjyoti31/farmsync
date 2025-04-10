
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, User, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { notifications } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const TopBar = () => {
  const navigate = useNavigate();
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  const handleLogout = () => {
    // In a real app, you would clear authentication state here
    toast({
      title: "Logged out successfully",
      description: "Redirecting to login page...",
    });
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      navigate('/landing');
    }, 1500);
  };
  
  return (
    <div className="h-16 px-6 flex items-center justify-between border-b bg-background">
      <div>
        <h2 className="text-xl font-semibold">Kisan-Sathi</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
        </div>
        
        <Button variant="ghost" size="icon">
          <MessageSquare className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Ramesh Singh</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopBar;
