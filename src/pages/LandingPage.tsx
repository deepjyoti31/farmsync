
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Tractor, 
  Leaf, 
  PieChart, 
  CloudSun, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all">
    <div className="flex items-center mb-4">
      <Icon className="h-10 w-10 text-primary mr-4" />
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const LandingPage = () => {
  const features = [
    {
      icon: Tractor,
      title: "Comprehensive Farm Management",
      description: "Track fields, crops, livestock, and equipment with an intuitive, all-in-one platform."
    },
    {
      icon: Leaf,
      title: "Crop Tracking & Planning",
      description: "Monitor crop cycles, get insights on planting, irrigation, and harvest schedules."
    },
    {
      icon: PieChart,
      title: "Financial Management",
      description: "Log expenses, track income, manage loans, and get detailed financial reports."
    },
    {
      icon: CloudSun,
      title: "Weather & Task Tracking",
      description: "Receive weather alerts and manage farm tasks with integrated calendar and reminders."
    },
    {
      icon: Users,
      title: "Community & Expert Support",
      description: "Connect with other farmers, share tips, and access expert agricultural advice."
    },
    {
      icon: BookOpen,
      title: "Multi-Language Support",
      description: "Available in multiple Indian languages to serve farmers across the country."
    }
  ];

  return (
    <div className="min-h-screen bg-farm-background">
      <div className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
            FarmSync: Your Digital Agricultural Companion
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Free forever. Open source. Empowering Indian farmers with technology.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Get Started
                <Globe className="h-5 w-5" />
              </Button>
            </Link>
            <a 
              href="https://github.com/your-organization/farm-management-software" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="gap-2">
                View on GitHub
                <ShieldCheck className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </section>

        <section className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-6 text-primary">
            Built for Indian Farmers, By Agricultural Technologists
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            FarmSync is an open-source project dedicated to empowering agricultural communities 
            with cutting-edge technology. We believe in democratizing farm management tools 
            and making them accessible to every farmer.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
