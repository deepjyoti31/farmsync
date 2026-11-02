import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Code2,
  Languages,
  ListChecks,
  Map,
  Package,
  PawPrint,
  ShieldCheck,
  Sprout,
  Store,
  CloudSun,
  Wallet,
  WifiOff,
  Github,
  type LucideIcon,
} from 'lucide-react';
import BrandMark from '@/components/common/BrandMark';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const REPO = 'https://github.com/deepjyoti31/farmsync';

interface Feature {
  icon: LucideIcon;
  key: string;
  title: string;
  body: string;
  beta?: boolean;
}

const features: Feature[] = [
  { icon: Map, key: 'fields', title: 'Farms and fields', body: 'Draw boundaries on a satellite map. Area and GPS centre are worked out for you; add soil type and pH.' },
  { icon: ListChecks, key: 'tasks', title: 'Tasks', body: 'Assign work to your team. Repeating jobs reschedule themselves and late ones raise an alert.' },
  { icon: Sprout, key: 'crops', title: 'Crops', body: 'Plan and follow each planting from sowing to harvest, then record what came in.' },
  { icon: PawPrint, key: 'livestock', title: 'Livestock', body: 'Animal register, health records with vaccination reminders, milk and egg production.', beta: true },
  { icon: Package, key: 'inventory', title: 'Inventory and equipment', body: 'Low stock and expiry warnings; machine service history and what is due next.' },
  { icon: Wallet, key: 'finances', title: 'Finances', body: 'Income and expenses by category, with profit and loss you can export.' },
  { icon: CloudSun, key: 'weather', title: 'Weather and sensors', body: 'Five-day forecast per farm. Connect soil and water sensors and chart readings live.', beta: true },
  { icon: Store, key: 'market', title: 'Market', body: 'Mandi price board, produce listings, buyer inquiries and a supplier directory.', beta: true },
  { icon: ShieldCheck, key: 'compliance', title: 'Sustainability and compliance', body: 'Input and water logs, audit-ready PDF and CSV, automatic checks for banned inputs.', beta: true },
];

const reasons = [
  { icon: WifiOff, key: 'offline', title: 'Works on a weak signal', body: 'Install it on your phone. Records you have opened stay available when the connection drops.' },
  { icon: Languages, key: 'local', title: 'Your units, your language', body: 'Hectares, acres or bigha; quintals or tonnes. English, Hindi, Spanish, French, Chinese and Arabic, with right-to-left layout.' },
  { icon: ShieldCheck, key: 'free', title: 'Free, for good', body: 'MIT licensed and community built. No per-acre pricing, no lock-in, and your farm data stays yours.' },
];

const roles = [
  { key: 'owner', title: 'Owner', body: 'Everything, including deleting the farm' },
  { key: 'admin', title: 'Admin', body: 'Manage people, fields and records' },
  { key: 'editor', title: 'Editor', body: 'Add and change day-to-day records' },
  { key: 'viewer', title: 'Viewer', body: 'Read only, for advisers and family' },
];

/** Miniature, decorative picture of the Today screen for the hero. */
const ProductPreview = () => (
  <div aria-hidden="true" className="flex min-w-0 flex-[1_1_480px] gap-3.5 rounded-t-[20px] bg-background p-4 pb-0 text-foreground">
    <div className="hidden w-[120px] shrink-0 flex-col gap-2 rounded-t-xl bg-sidebar p-3 sm:flex">
      <span className="h-2.5 w-[70px] rounded bg-harvest" />
      <span className="h-6 rounded-md bg-sidebar-primary" />
      {[80, 60, 75, 55, 70, 50].map((w) => (
        <span key={w} className="h-2 rounded bg-sidebar-border" style={{ width: `${w}%` }} />
      ))}
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <span className="font-display text-[22px] font-bold">Good morning, Asha</span>
      <div className="flex gap-2.5">
        <div className="surface flex flex-1 flex-col gap-2 rounded-xl p-3">
          <span className="text-[13px] font-bold">Due today</span>
          {['Top-dress mustard', 'Irrigate potato beds'].map((x) => (
            <span key={x} className="flex items-center gap-2 text-xs">
              <span className="h-3.5 w-3.5 rounded border-2 border-input" />
              {x}
            </span>
          ))}
          <span className="flex items-center gap-2 text-xs text-muted-foreground line-through">
            <span className="h-3.5 w-3.5 rounded bg-primary" />
            Check drip lines
          </span>
        </div>
        <div className="surface flex flex-1 flex-col gap-1 rounded-xl p-3">
          <span className="text-xs text-muted-foreground">This month</span>
          <span className="font-display text-2xl font-bold">₹26,550</span>
          <span className="mt-1.5 flex h-2 gap-0.5">
            <span className="flex-[48] rounded-s-sm bg-chart-income" />
            <span className="flex-[22] rounded-e-sm bg-chart-expense" />
          </span>
        </div>
      </div>
      <svg viewBox="0 0 400 150" className="block h-auto w-full rounded-t-xl bg-[#EEF1E8]">
        <polygon points="10,10 130,6 136,70 14,74" fill="#D5DED3" stroke="#fff" strokeWidth="3" />
        <polygon points="138,6 260,4 266,68 142,70" fill="#2E7D4F" stroke="#fff" strokeWidth="3" />
        <polygon points="268,4 392,10 386,74 272,68" fill="#2E7D4F" stroke="#fff" strokeWidth="3" />
        <polygon points="14,80 140,76 144,150 18,150" fill="#EFE7D6" stroke="#fff" strokeWidth="3" />
        <polygon points="148,76 270,74 266,150 150,150" fill="#2E7D4F" stroke="#fff" strokeWidth="3" />
        <polygon points="276,74 386,80 382,150 272,150" fill="#E39B34" stroke="#fff" strokeWidth="3" />
      </svg>
    </div>
  </div>
);

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-sidebar text-sidebar-foreground">
        <header className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-7 gap-y-3 px-4 py-5 sm:px-8">
          <Link to="/landing" className="text-sidebar-foreground" aria-label="FarmSync">
            <BrandMark nameClassName="text-[21px]" />
          </Link>
          <nav aria-label={t('site.nav.label', 'Site')} className="flex flex-[1_1_280px] flex-wrap gap-x-6 text-[15px]">
            <a href="#features" className="py-2.5 text-[#D3DED6] hover:text-white">{t('site.nav.features', 'Features')}</a>
            <a href="#teams" className="py-2.5 text-[#D3DED6] hover:text-white">{t('site.nav.teams', 'Teams and co-ops')}</a>
            <a href="#selfhost" className="py-2.5 text-[#D3DED6] hover:text-white">{t('site.nav.selfhost', 'Self-host')}</a>
          </nav>
          <div className="flex items-center gap-2 [&_button]:border-sidebar-border [&_button]:bg-transparent [&_button]:text-sidebar-foreground [&_button:hover]:bg-sidebar-accent">
            <LanguageSwitcher />
          </div>
          <Link to="/login" className="px-1.5 py-2.5 font-semibold text-sidebar-foreground hover:text-white">
            {t('landing.cta.login')}
          </Link>
          <Link to="/signup" className="flex h-11 items-center rounded-[10px] bg-harvest px-[18px] font-bold text-harvest-foreground hover:bg-harvest/90">
            {t('site.start', 'Start free')}
          </Link>
        </header>

        <section className="mx-auto flex max-w-[1200px] flex-wrap items-end gap-12 px-4 pt-10 sm:px-8 sm:pt-14">
          <div className="flex flex-[1_1_440px] flex-col gap-5 pb-14 sm:pb-[72px]">
            <span className="self-start rounded-full border border-sidebar-border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-[#B8C9BC]">
              {t('site.hero.eyebrow', 'Open source · MIT licensed')}
            </span>
            <h1 className="text-[44px] font-bold leading-[0.98] tracking-[-0.03em] sm:text-[60px] lg:text-[72px]">
              {t('site.hero.title_a', 'Farm records that work')} <span className="text-harvest">{t('site.hero.title_b', 'where you farm.')}</span>
            </h1>
            <p className="max-w-[520px] text-lg leading-relaxed text-[#D3DED6] sm:text-[19px]">
              {t(
                'site.hero.body',
                'Map fields, plan crops, look after animals, track money and harvests. One app for every farm, from two bigha to a whole cooperative.',
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup" className="flex h-[54px] items-center rounded-xl bg-harvest px-6 text-[17px] font-bold text-harvest-foreground hover:bg-harvest/90">
                {t('landing.hero.get_started')}
              </Link>
              <a href="#selfhost" className="flex h-[54px] items-center gap-2.5 rounded-xl border border-[#3C5A46] px-[22px] text-[17px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent">
                <Code2 className="h-[18px] w-[18px]" aria-hidden="true" />
                {t('site.hero.selfhost', 'Self-host it')}
              </a>
            </div>
          </div>
          <ProductPreview />
        </section>
      </div>

      <section aria-label={t('site.why', 'Why FarmSync')} className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8 px-4 pb-6 pt-16 sm:px-8">
        {reasons.map((r) => (
          <div key={r.key} className="flex flex-col gap-2.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-sidebar text-harvest">
              <r.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-bold">{t(`site.reasons.${r.key}.title`, r.title)}</h2>
            <p className="text-base leading-relaxed text-[#34453A] dark:text-muted-foreground">{t(`site.reasons.${r.key}.body`, r.body)}</p>
          </div>
        ))}
      </section>

      <section id="features" aria-labelledby="features-h" className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 py-14 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="features-h" className="max-w-[640px] text-[36px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[44px]">
            {t('site.features.title', 'Everything a working farm keeps track of')}
          </h2>
          <p className="max-w-[360px] text-[15px] leading-normal text-muted-foreground">
            {t('site.features.beta_note', 'Beta means it works end to end with known gaps, listed openly in the roadmap.')}
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {features.map((f) => (
            <article key={f.key} className="surface flex flex-col gap-2.5 p-[22px]">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-tint text-primary">
                  <f.icon className="h-[22px] w-[22px]" aria-hidden="true" />
                </span>
                <Badge variant={f.beta ? 'warning' : 'default'}>{f.beta ? t('site.beta', 'Beta') : t('site.stable', 'Stable')}</Badge>
              </div>
              <h3 className="text-[21px] font-bold">{t(`site.features.${f.key}.title`, f.title)}</h3>
              <p className="text-[15px] leading-relaxed text-[#34453A] dark:text-muted-foreground">{t(`site.features.${f.key}.body`, f.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="teams" aria-labelledby="teams-h" className="mx-auto max-w-[1200px] px-4 pb-14 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-10 rounded-3xl bg-harvest p-8 text-harvest-foreground sm:p-12">
          <div className="flex flex-[1_1_360px] flex-col gap-4">
            <h2 id="teams-h" className="text-[36px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[44px]">
              {t('site.teams.title', 'Built for families, teams and cooperatives')}
            </h2>
            <p className="text-[17px] leading-relaxed">
              {t(
                'site.teams.body',
                'Give each person the access they need, enforced in the database. Co-ops see member farms, the crop mix, bulk input orders and produce batches for traceability.',
              )}
            </p>
          </div>
          <ul className="flex flex-[1_1_340px] flex-col rounded-[18px] bg-card p-2 text-foreground">
            {roles.map((r, i) => (
              <li key={r.key} className={cn('flex items-center gap-3 p-3', i < roles.length - 1 && 'border-b border-muted')}>
                <Badge variant="secondary" className="w-16 justify-center">{t(`site.roles.${r.key}.title`, r.title)}</Badge>
                <span className="text-sm text-[#34453A] dark:text-muted-foreground">{t(`site.roles.${r.key}.body`, r.body)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="selfhost" aria-labelledby="selfhost-h" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-10 px-4 pb-[72px] pt-6 sm:px-8">
        <div className="flex flex-[1_1_360px] flex-col gap-4">
          <h2 id="selfhost-h" className="text-[36px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[44px]">
            {t('site.selfhost.title', 'Your data, on your server if you like')}
          </h2>
          <p className="text-[17px] leading-relaxed text-[#34453A] dark:text-muted-foreground">
            {t('site.selfhost.body', 'FarmSync runs on a free Supabase project and any static host. Fork it, translate it, add the crops your region grows. Pull requests are welcome.')}
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={REPO} className="flex h-[50px] items-center gap-2 rounded-xl bg-sidebar px-5 font-semibold text-white hover:bg-sidebar/90">
              <Github className="h-[18px] w-[18px]" aria-hidden="true" />
              {t('landing.hero.star_github')}
            </a>
            <a href={`${REPO}/blob/main/docs/getting-started.md`} className="flex h-[50px] items-center rounded-xl border border-[#C9D1C5] px-5 font-semibold hover:bg-accent dark:border-input">
              {t('site.selfhost.guide', 'Getting started guide')}
            </a>
          </div>
        </div>
        <pre className="min-w-0 flex-[1_1_420px] overflow-x-auto rounded-[18px] bg-sidebar p-6 font-mono text-sm leading-[1.8] text-[#D3DED6]">
          <span className="text-sidebar-muted"># get the code</span>
          {'\n'}git clone {REPO}.git{'\n'}cd farmsync && npm install{'\n\n'}
          <span className="text-sidebar-muted"># point it at your Supabase project</span>
          {'\n'}npx supabase db push{'\n\n'}
          <span className="text-harvest">npm run dev</span>
        </pre>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-7 gap-y-3 px-4 py-7 text-sm text-muted-foreground sm:px-8">
          <BrandMark nameClassName="text-lg text-foreground" />
          <span>{t('landing.footer.tagline')}</span>
          <a href={`${REPO}/blob/main/docs/roadmap.md`} className="py-2.5 hover:text-foreground">{t('site.footer.roadmap', 'Roadmap')}</a>
          <a href={`${REPO}/blob/main/CONTRIBUTING.md`} className="py-2.5 hover:text-foreground">{t('site.footer.contributing', 'Contributing')}</a>
          <a href={`${REPO}/blob/main/SECURITY.md`} className="py-2.5 hover:text-foreground">{t('site.footer.security', 'Security')}</a>
          <span className="ms-auto">© {new Date().getFullYear()} FarmSync · MIT</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
