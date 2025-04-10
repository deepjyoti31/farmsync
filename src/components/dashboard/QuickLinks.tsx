
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, DollarSign, Package, Cloud, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickLinks = () => {
  const links = [
    { icon: Map, label: 'Fields', path: '/dashboard/fields' },
    { icon: Sprout, label: 'Crops', path: '/dashboard/crops' },
    { icon: Users, label: 'Livestock', path: '/dashboard/livestock' },
    { icon: DollarSign, label: 'Finances', path: '/dashboard/finances' },
    { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
    { icon: Cloud, label: 'Weather', path: '/dashboard/weather' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {links.map((link) => (
            <Button
              key={link.path}
              variant="outline"
              className="h-20 flex flex-col gap-1 justify-center"
              asChild
            >
              <Link to={link.path}>
                <link.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{link.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickLinks;
