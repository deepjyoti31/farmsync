
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
  GanttChartSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";

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
  <Card className="border border-border/50 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20">
    <CardContent className="pt-6">
      <div className="mb-4 bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const Testimonial = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <div className="bg-muted/50 rounded-xl p-6 border border-border/50">
    <p className="italic text-muted-foreground mb-4">"{quote}"</p>
    <div className="flex items-center">
      <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
        <span className="text-primary font-medium">{author.charAt(0)}</span>
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
      role: "Rice Farmer, Bihar"
    },
    {
      quote: "The financial tracking helps me understand where my money goes and how to optimize my farming operations.",
      author: "Sunita Patel",
      role: "Vegetable Grower, Gujarat"
    },
    {
      quote: "As a small-scale farmer, I never thought I'd be able to use technology like this. It's easy and free!",
      author: "Vijay Singh",
      role: "Mixed Farmer, Haryana"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-farm-green/10 to-farm-lightGreen/5 z-0"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Smart Farming, Simplified
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              FarmSync is a free, open-source farm management platform designed for Indian farmers. Manage crops, track finances, and grow your yields.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a 
                href="https://github.com/your-organization/farm-management-software" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Manage Your Farm</h2>
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

      {/* Why Free Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Is FarmSync Free?</h2>
            <p className="text-lg text-muted-foreground">
              We believe that technology should empower all farmers, regardless of their size or resources.
              FarmSync is open-source and will always remain free to use.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Open for All</h3>
              <p className="text-muted-foreground">
                Available to every farmer across India, regardless of farm size or budget.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Github className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Open Source</h3>
              <p className="text-muted-foreground">
                Completely open source and community-driven, ensuring transparency and continuous improvement.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Privacy</h3>
              <p className="text-muted-foreground">
                Your farm data belongs to you. We're committed to data privacy and security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Farmers Across India</h2>
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
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary/10 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Farming?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of farmers already using FarmSync to increase yields, 
              reduce costs, and manage their farms more efficiently.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-primary">FarmSync</h2>
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
