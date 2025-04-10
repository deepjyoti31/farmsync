
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Leaf, Tractor, BarChart, Droplet, Cloud, Shield } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8" />
            <h1 className="text-2xl font-bold">KisanSathi</h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#testimonials" className="hover:underline">Testimonials</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </nav>
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="secondary" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/20 to-background py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Smart Farming Solutions for Modern Agriculture
            </h1>
            <p className="text-lg text-muted-foreground">
              Empower your farm with data-driven insights, streamlined operations, and sustainable practices with KisanSathi.
            </p>
            <div className="flex gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="/placeholder.svg" 
              alt="Farm Management Dashboard" 
              className="rounded-lg shadow-lg w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of tools helps farmers maximize productivity, reduce costs, and farm sustainably.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Tractor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Field Management</h3>
              <p className="text-muted-foreground">
                Track and manage your fields with detailed mapping, soil analysis, and crop rotation planning.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Crop Management</h3>
              <p className="text-muted-foreground">
                Optimize planting schedules, monitor growth stages, and track harvests for maximum yield.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Financial Insights</h3>
              <p className="text-muted-foreground">
                Track expenses, analyze profitability, and make informed decisions with comprehensive financial reports.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Droplet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Water Management</h3>
              <p className="text-muted-foreground">
                Monitor irrigation needs, track water usage, and implement water conservation strategies.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weather Integration</h3>
              <p className="text-muted-foreground">
                Get real-time weather updates and forecasts tailored to your farm's location for better planning.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Data Storage</h3>
              <p className="text-muted-foreground">
                Keep all your farm data secure and accessible from anywhere with cloud-based storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your farming?</h2>
          <p className="max-w-2xl mx-auto mb-8 text-primary-foreground/90">
            Join thousands of farmers who are already using KisanSathi to improve their productivity and sustainability.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button variant="secondary" size="lg" className="gap-2">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Case Studies</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Resources</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Community</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Status</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Updates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Cookie Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Data Processing</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">KisanSathi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KisanSathi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
