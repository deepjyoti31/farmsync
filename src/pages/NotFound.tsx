
import React from 'react';
import { useLocation } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-farm-green mb-4">404</h1>
        <p className="text-xl text-farm-brown mb-6">
          The page you are looking for could not be found.
        </p>
        <p className="text-muted-foreground mb-8">
          We couldn't find the page: <span className="font-mono">{location.pathname}</span>
        </p>
        <Button asChild>
          <Link to="/" className="inline-flex items-center gap-2">
            <HomeIcon className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
