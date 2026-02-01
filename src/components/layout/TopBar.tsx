
import React from 'react';
import { Button } from '@/components/ui/button';
import NotificationsDropdown from './NotificationsDropdown';
import UserMenu from './UserMenu';
import OrgSwitcher from '../org/OrgSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import FarmSelector from '@/components/farms/FarmSelector';
import { MessageSquare, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { t } = useTranslation();

  const handleOpenMessaging = () => {
    toast({
      title: t('layout.topbar.messaging.title'),
      description: t('layout.topbar.messaging.description'),
    });
  };

  return (
    <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b bg-background">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <FarmSelector
          selectedFarmId={null}
          onFarmChange={() => { }}
          showAddButtonWhenEmpty={false}
        />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <OrgSwitcher />
        <LanguageSwitcher />
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
