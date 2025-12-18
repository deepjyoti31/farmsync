import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Supplier } from '@/types/marketplace';
import { MapPin, Phone, Mail, Globe, CheckCircle } from 'lucide-react';

interface SupplierCardProps {
    supplier: Supplier;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier }) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{supplier.name}</CardTitle>
                            {supplier.verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                        </div>
                        <CardDescription className="mt-1">{supplier.category}</CardDescription>
                    </div>
                    <Badge variant="secondary">{supplier.category}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {supplier.description}
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{supplier.location}</span>
                    </div>

                    {supplier.contact_info.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${supplier.contact_info.phone}`} className="hover:text-blue-600 hover:underline">
                                {supplier.contact_info.phone}
                            </a>
                        </div>
                    )}

                    {supplier.contact_info.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${supplier.contact_info.email}`} className="hover:text-blue-600 hover:underline">
                                {supplier.contact_info.email}
                            </a>
                        </div>
                    )}

                    {supplier.contact_info.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <a href={supplier.contact_info.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                                Visit Website
                            </a>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SupplierCard;
