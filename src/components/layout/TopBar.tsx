
import React from 'react';
import { Button } from '@/components/ui/button';
import NotificationsDropdown from './NotificationsDropdown';
import UserMenu from './UserMenu';
import FarmSelector from '@/components/farms/FarmSelector';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const navigate = useNavigate();
  
  const handleOpenMessaging = () => {
    toast({
      title: "Coming Soon",
      description: "Messaging functionality will be available in a future update!",
    });
  };
  
  return (
    <div className="h-16 px-6 flex items-center justify-between border-b bg-background">
      <div>
        <FarmSelector 
          selectedFarmId={null}
          onFarmChange={() => {}}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        
        <Button variant="ghost" size="icon" onClick={handleOpenMessaging}>
          <MessageSquare className="h-5 w-5" />
        </Button>
        
        <UserMenu />
      </div>
    </div>
  );
};

export default TopBar;
