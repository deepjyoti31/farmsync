import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Tractor,
  Leaf,
  PieChart,
  CloudSun,
  Users,
  ShieldCheck,
  Globe,
  ArrowRight,
  Github,
  BarChart2,
  CalendarDays,
  GanttChartSquare,
  ArrowDownCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useTranslation, Trans } from 'react-i18next';

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description
}: FeatureCardProps) => (
  <Card className="border border-border/50 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden group">
    <CardContent className="pt-6 p-6">
      <div className="mb-4 bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-300 group-hover:bg-primary/20">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const Testimonial = ({ quote, author, role, imageUrl }: { quote: string; author: string; role: string; imageUrl?: string }) => (
  <div className="bg-muted/50 rounded-xl p-6 border border-border/50 h-full">
    <p className="italic text-muted-foreground mb-6 text-lg">&ldquo;{quote}&rdquo;</p>
    <div className="flex items-center">
      <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mr-3 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={author} className="w-full h-full object-cover" />
        ) : (
          <span className="text-primary font-medium text-lg">{author.charAt(0)}</span>
        )}
      </div>
      <div>
        <p className="font-medium">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const { t } = useTranslation();
  const features = [
    {
      icon: Tractor,
      title: t('landing.features.items.farm_management.title'),
      description: t('landing.features.items.farm_management.description')
    },
    {
      icon: Leaf,
      title: t('landing.features.items.crop_tracking.title'),
      description: t('landing.features.items.crop_tracking.description')
    },
    {
      icon: PieChart,
      title: t('landing.features.items.financial_insights.title'),
      description: t('landing.features.items.financial_insights.description')
    },
    {
      icon: CloudSun,
      title: t('landing.features.items.weather_integration.title'),
      description: t('landing.features.items.weather_integration.description')
    },
    {
      icon: BarChart2,
      title: t('landing.features.items.analytics.title'),
      description: t('landing.features.items.analytics.description')
    },
    {
      icon: CalendarDays,
      title: t('landing.features.items.task_management.title'),
      description: t('landing.features.items.task_management.description')
    },
    {
      icon: GanttChartSquare,
      title: t('landing.features.items.resource_planning.title'),
      description: t('landing.features.items.resource_planning.description')
    },
    {
      icon: Users,
      title: t('landing.features.items.community.title'),
      description: t('landing.features.items.community.description')
    }
  ];

  const testimonials = [
    {
      quote: t('landing.testimonials.items.rajesh.quote'),
      author: "Rajesh Kumar",
      role: t('landing.testimonials.items.rajesh.role'),
      imageUrl: "/src/data/farmer1.jpg"
    },
    {
      quote: t('landing.testimonials.items.sunita.quote'),
      author: "Sunita Patel",
      role: t('landing.testimonials.items.sunita.role'),
      imageUrl: "/src/data/farmer3.jpg"
    },
    {
      quote: t('landing.testimonials.items.vijay.quote'),
      author: "Vijay Singh",
      role: t('landing.testimonials.items.vijay.role'),
      imageUrl: "/src/data/farmer2.jpg"
    }
  ];

  const screenshots = [
    { src: "/src/data/dashboard.png", alt: t('landing.screenshots.dashboard') },
    { src: "/src/data/crop-management.png", alt: t('landing.screenshots.crop_management') },
    { src: "/src/data/weather-forecast.png", alt: t('landing.screenshots.weather') },
    { src: "/src/data/financial-report.png", alt: t('landing.screenshots.financial') }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <section className="relative h-screen flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/src/data/hero-section.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg">
              <Trans i18nKey="landing.hero.title">
                Smart Farming, <span className="text-primary">Reimagined</span>
              </Trans>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-md md:text-2xl max-w-2xl">
              {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base bg-primary/90 hover:bg-primary">
                  {t('landing.hero.get_started')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/deepjyoti31/farmsync"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30">
                  <Github className="h-4 w-4" />
                  {t('landing.hero.star_github')}
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDownCircle className="h-10 w-10 text-white" />
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-background to-transparent z-10"></div>
        <div className="container mx-auto px-4 mb-12 relative z-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.screenshots.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.screenshots.subtitle')}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Carousel className="w-full">
              <CarouselContent>
                {screenshots.map((screenshot, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/1">
                    <div className="p-2">
                      <Card className="overflow-hidden border-2 border-border/30 shadow-lg">
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={screenshot.src}
                            alt={screenshot.alt}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1535378620166-273708d44e4c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
                            }}
                          />
                        </div>
                        <CardContent className="p-4">
                          <p className="text-center font-medium">{screenshot.alt}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.features.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="h-32 md:h-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm"></div>
      </div>

      <section className="py-20 relative">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/src/data/farmer.jpg"
                  alt="Farmer using FarmSync app"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-lg max-w-xs hidden md:block">
                <p className="flex items-center text-sm">
                  <span className="text-primary font-bold mr-2">15% Growth</span>
                  in average crop yield for FarmSync users
                </p>
              </div>
            </div>

            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.why_free.title')}</h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t('landing.why_free.description')}
              </p>

              <div className="grid gap-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why_free.items.open_for_all.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.why_free.items.open_for_all.description')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <Github className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why_free.items.open_source.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.why_free.items.open_source.description')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why_free.items.data_privacy.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('landing.why_free.items.data_privacy.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1535378620166-273708d44e4c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.testimonials.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Testimonial
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                imageUrl={testimonial.imageUrl}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 relative">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto border border-white/20 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t('landing.cta.title')}</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
              {t('landing.cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  {t('landing.cta.create_account')}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-primary hover:bg-white/20">
                  {t('landing.cta.login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-muted/70 py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Leaf className="h-6 w-6" />
                FarmSync
              </h2>
              <p className="text-muted-foreground">{t('landing.footer.tagline')}</p>
            </div>

            <div className="flex gap-6">
              <a
                href="https://github.com/deepjyoti31/farmsync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                {t('auth.login')}
              </Link>
              <Link to="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                {t('auth.signup')}
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FarmSync. {t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
