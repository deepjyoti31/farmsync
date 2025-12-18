import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketplaceListing } from '@/types/marketplace';
import { MapPin, Calendar, Scale, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ListingCardProps {
    listing: MarketplaceListing;
    onContact: (listing: MarketplaceListing) => void;
    isOwner: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onContact, isOwner }) => {
    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full bg-muted">
                {listing.images && listing.images.length > 0 ? (
                    <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                        No Image
                    </div>
                )}
                <Badge className="absolute top-2 right-2 bg-white/90 text-black hover:bg-white">
                    {listing.category}
                </Badge>
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                    <span className="font-bold text-lg text-green-700">
                        ₹{listing.price_per_unit}/{listing.unit}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-grow">
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[2.5rem]">
                    {listing.description || "No description provided."}
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{listing.location.address || "Location not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-gray-400" />
                        <span>Available: {listing.quantity_available} {listing.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Available from: {format(new Date(listing.available_date), 'MMM d, yyyy')}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto">
                <Button
                    className="w-full gap-2"
                    variant={isOwner ? "outline" : "default"}
                    onClick={() => onContact(listing)}
                    disabled={listing.status !== 'active'}
                >
                    <MessageCircle className="h-4 w-4" />
                    {isOwner ? "View Inquiries" : "Contact Seller"}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ListingCard;
