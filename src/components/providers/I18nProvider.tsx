
import React, { ReactNode, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface I18nProviderProps {
    children: ReactNode;
}

const LoadingFallback = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading translations...</p>
        </div>
    </div>
);

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            {children}
        </Suspense>
    );
};
