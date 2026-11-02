
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const languages = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'hi', name: 'हिंदी', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
    { code: 'zh', name: '中文', dir: 'ltr' },
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 gap-1.5 px-3" aria-label={`Language: ${currentLang.name}`}>
                    <Globe className="h-4 w-4" aria-hidden="true" />
                    <span className="font-mono text-[13px] font-medium uppercase">{currentLang.code}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`cursor-pointer ${i18n.language === lang.code ? 'bg-accent' : ''}`}
                    >
                        <span className="mr-2">{lang.name}</span>
                        {i18n.language === lang.code && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSwitcher;
