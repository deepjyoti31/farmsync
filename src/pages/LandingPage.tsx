
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
  const features = [
    {
      icon: Tractor,
      title: "Farm Management",
      description: "Track fields, crops, and equipment with our intuitive platform designed for Indian farmers."
    },
    {
      icon: Leaf,
      title: "Crop Tracking",
      description: "Monitor crop cycles and get insights on planting, irrigation, and harvest schedules."
    },
    {
      icon: PieChart,
      title: "Financial Insights",
      description: "Log expenses, track income, and get detailed financial reports tailored for agriculture."
    },
    {
      icon: CloudSun,
      title: "Weather Integration",
      description: "Receive local weather forecasts and alerts to plan your farming activities efficiently."
    },
    {
      icon: BarChart2,
      title: "Analytics Dashboard",
      description: "Visual reports and analytics to understand your farm's performance and make better decisions."
    },
    {
      icon: CalendarDays,
      title: "Task Management",
      description: "Plan and track all your farm activities with an easy-to-use calendar and reminder system."
    },
    {
      icon: GanttChartSquare,
      title: "Resource Planning",
      description: "Optimize your resource allocation for maximum productivity and yield management."
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with other farmers, share tips, and access expert agricultural advice."
    }
  ];

  const testimonials = [
    {
      quote: "FarmSync has transformed how I manage my crops. I've seen a 15% increase in yield since I started using it.",
      author: "Rajesh Kumar",
      role: "Rice Farmer, Bihar",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80"
    },
    {
      quote: "The financial tracking helps me understand where my money goes and how to optimize my farming operations.",
      author: "Sunita Patel",
      role: "Vegetable Grower, Gujarat",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80"
    },
    {
      quote: "As a small-scale farmer, I never thought I'd be able to use technology like this. It's easy and free!",
      author: "Vijay Singh",
      role: "Mixed Farmer, Haryana",
      imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80"
    }
  ];

  const screenshots = [
    { src: "/dashboard-screenshot.jpg", alt: "FarmSync Dashboard" },
    { src: "/crop-management-screenshot.jpg", alt: "Crop Management Interface" },
    { src: "/weather-forecast-screenshot.jpg", alt: "Weather Forecast Module" },
    { src: "/financial-reports-screenshot.jpg", alt: "Financial Reports" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section with Parallax Effect */}
      <section className="relative h-screen flex items-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
             style={{ 
               backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
               transform: "translateZ(-10px) scale(2)", 
               zIndex: -2 
             }}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg">
              Smart Farming, <span className="text-primary">Simplified</span>
            </h1>
            <p className="text-xl text-white mb-8 drop-shadow-md md:text-2xl max-w-2xl">
              FarmSync is a free, open-source farm management platform designed for Indian farmers. Manage crops, track finances, and grow your yields.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a 
                href="https://github.com/your-organization/farm-management-software" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30">
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDownCircle className="h-10 w-10 text-white" />
        </div>
      </section>

      {/* App Screenshots Carousel */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-background to-transparent z-10"></div>
        <div className="container mx-auto px-4 mb-12 relative z-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See FarmSync in Action</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take a look at our intuitive interface designed specifically for farmers
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

      {/* Features Section with Grid */}
      <section className="py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-5"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Manage Your Farm</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete suite of tools designed specifically for Indian agricultural needs,
              available to everyone at no cost.
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

      {/* Visual Divider */}
      <div className="h-32 md:h-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm"></div>
      </div>

      {/* Why Free Section with Visual Elements */}
      <section className="py-20 relative">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" 
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Is FarmSync Free?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We believe that technology should empower all farmers, regardless of their size or resources.
                FarmSync is open-source and will always remain free to use.
              </p>
              
              <div className="grid gap-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Open for All</h3>
                    <p className="text-muted-foreground">
                      Available to every farmer across India, regardless of farm size or budget.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <Github className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Open Source</h3>
                    <p className="text-muted-foreground">
                      Completely open source and community-driven, ensuring transparency and continuous improvement.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Data Privacy</h3>
                    <p className="text-muted-foreground">
                      Your farm data belongs to you. We're committed to data privacy and security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with Modern Cards */}
      <section className="py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-5"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1535378620166-273708d44e4c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Farmers Across India</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how FarmSync has helped farmers improve their operations and increase productivity.
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

      {/* CTA Section with Background Image */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        </div>
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 relative">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto border border-white/20 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Transform Your Farming?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
              Join thousands of farmers already using FarmSync to increase yields, 
              reduce costs, and manage their farms more efficiently.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/20">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/70 py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Leaf className="h-6 w-6" />
                FarmSync
              </h2>
              <p className="text-muted-foreground">Free forever. Open source.</p>
            </div>
            
            <div className="flex gap-6">
              <a 
                href="https://github.com/your-organization/farm-management-software" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                Log in
              </Link>
              <Link to="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                Sign up
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FarmSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
