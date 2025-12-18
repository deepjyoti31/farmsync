
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useDirection = () => {
    const { i18n } = useTranslation();

    useEffect(() => {
        const dir = i18n.dir(i18n.language);
        document.documentElement.dir = dir;
        document.documentElement.lang = i18n.language;
    }, [i18n, i18n.language]);
};
