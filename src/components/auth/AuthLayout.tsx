import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import BrandMark from '@/components/common/BrandMark';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** "New here? Create an account" style line under the form */
  footer?: React.ReactNode;
}

/** Split screen for log in and sign up: dark brand panel on one side, the form on the other. */
const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  const { t } = useTranslation();
  const points = [
    t('auth.panel.offline', 'Look up your records in the field, even on a weak signal'),
    t('auth.panel.units', 'Hectares, acres or bigha; quintals or tonnes'),
    t('auth.panel.free', 'Free and open source, in six languages'),
  ];

  return (
    <div className="flex min-h-screen flex-wrap bg-background">
      <section
        aria-label={t('auth.panel.label', 'About FarmSync')}
        className="relative flex flex-[1_1_420px] flex-col gap-8 overflow-hidden bg-sidebar px-6 pb-40 pt-8 text-sidebar-foreground sm:px-12 sm:pt-10 lg:pb-56"
      >
        <Link to="/landing" className="self-start text-sidebar-foreground" aria-label={t('auth.back_to_home')}>
          <BrandMark nameClassName="text-[22px]" />
        </Link>
        <div className="relative z-10 flex max-w-[460px] flex-col gap-4">
          <h2 className="text-[34px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[44px]">
            {t('auth.panel.title', "Your farm's records, in your pocket.")}
          </h2>
          <ul className="mt-2 flex flex-col gap-3.5 text-base text-[#D3DED6]">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-harvest" strokeWidth={2.4} aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <svg viewBox="0 0 600 260" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-auto w-full">
          <path d="M0 120 C150 90 330 100 600 70 L600 260 L0 260z" fill="#183222" />
          <path d="M0 160 C180 130 380 140 600 112 L600 260 L0 260z" fill="#1F3F2B" />
          <path d="M0 200 C200 176 400 184 600 160 L600 260 L0 260z" fill="#2E5A3E" />
          <g stroke="#3C6E4D" strokeWidth="3" fill="none">
            <path d="M40 260 L250 182" />
            <path d="M130 260 L300 180" />
            <path d="M220 260 L350 178" />
            <path d="M310 260 L400 175" />
            <path d="M400 260 L450 172" />
            <path d="M490 260 L500 168" />
          </g>
          <circle cx="488" cy="56" r="26" fill="#E9A23B" />
        </svg>
      </section>

      <section className="flex flex-[1_1_480px] flex-col px-6 pb-10 pt-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/landing" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('auth.back_to_home')}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="flex w-full max-w-[400px] flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[34px] font-bold tracking-[-0.02em]">{title}</h1>
              <p className="text-base text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            {footer && <div className="text-center text-[15px] text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
