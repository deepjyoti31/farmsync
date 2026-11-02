import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandMark from '@/components/common/BrandMark';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <BrandMark withName={false} />
        <span className="eyebrow">{t('notfound.code', 'Error 404')}</span>
        <h1 className="text-[32px] font-bold leading-tight">{t('notfound.title', 'This page is not on the map')}</h1>
        <p className="text-muted-foreground">
          {t('notfound.body', 'We could not find')} <span className="break-all font-mono text-foreground">{location.pathname}</span>
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link to="/dashboard">
            <Home aria-hidden="true" />
            {t('notfound.home', 'Go to Today')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
