
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ShoppingCart, 
  TrendingUp, 
  Tag, 
  MapPin, 
  Truck,
  Filter,
  ChevronsUpDown,
  ArrowDownUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';

interface MarketProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  seller: string;
  location: string;
  distance: number;
  rating: number;
  image: string;
  inStock: boolean;
}

interface MarketListing {
  id: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: string;
  price: number;
  farm_name: string;
  location: string;
  listing_date: string;
  image_url?: string;
}

const Market = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<MarketProduct[]>([]);
  
  // Fetch market listings
  const { data: marketListings = [], isLoading } = useQuery({
    queryKey: ['market_listings'],
    queryFn: async () => {
      // In a real application, this would fetch from a market_listings table
      // For now, we'll use mock data
      const mockData: MarketListing[] = [
        {
          id: '1',
          crop: 'Wheat',
          variety: 'HD-2967',
          quantity: 500,
          unit: 'kg',
          price: 25,
          farm_name: 'Singh Farms',
          location: 'Ludhiana, Punjab',
          listing_date: '2025-04-05',
        },
        {
          id: '2',
          crop: 'Rice',
          variety: 'Basmati',
          quantity: 1000,
          unit: 'kg',
          price: 75,
          farm_name: 'Kumar Agro',
          location: 'Karnal, Haryana',
          listing_date: '2025-04-03',
        },
        {
          id: '3',
          crop: 'Maize',
          variety: 'Hybrid',
          quantity: 750,
          unit: 'kg',
          price: 20,
          farm_name: 'Green Hills',
          location: 'Coimbatore, Tamil Nadu',
          listing_date: '2025-04-07',
        },
        {
          id: '4',
          crop: 'Fertilizer',
          variety: 'NPK 14-35-14',
          quantity: 200,
          unit: 'kg',
          price: 35,
          farm_name: 'Agri Supplies',
          location: 'Pune, Maharashtra',
          listing_date: '2025-04-02',
        },
        {
          id: '5',
          crop: 'Pesticide',
          variety: 'Mancozeb 75%',
          quantity: 50,
          unit: 'l',
          price: 420,
          farm_name: 'Crop Shield',
          location: 'Vadodara, Gujarat',
          listing_date: '2025-04-08',
        },
        {
          id: '6',
          crop: 'Seeds',
          variety: 'Tomato Hybrid',
          quantity: 10,
          unit: 'kg',
          price: 1200,
          farm_name: 'Seed Tech',
          location: 'Nashik, Maharashtra',
          listing_date: '2025-04-01',
        },
      ];
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return mockData;
    },
  });
  
  // Your farm's listings (for Sell tab)
  const { data: myListings = [] } = useQuery({
    queryKey: ['my_listings', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      // In a real application, this would fetch the farm's listings
      return [];
    },
    enabled: !!selectedFarmId,
  });
  
  const categories = ['Grains', 'Seeds', 'Fertilizers', 'Pesticides', 'Equipment', 'All'];
  
  const filteredListings = marketListings.filter(listing => {
    if (searchQuery && !listing.crop.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !listing.variety.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedCategory && selectedCategory !== 'All') {
      const category = getCategoryForCrop(listing.crop);
      if (category !== selectedCategory) {
        return false;
      }
    }
    
    return true;
  });
  
  const addToCart = (listing: MarketListing) => {
    const product: MarketProduct = {
      id: listing.id,
      name: `${listing.crop} (${listing.variety})`,
      category: getCategoryForCrop(listing.crop),
      price: listing.price,
      unit: listing.unit,
      seller: listing.farm_name,
      location: listing.location,
      distance: Math.floor(Math.random() * 100),
      rating: 4 + Math.random(),
      image: listing.image_url || 'https://via.placeholder.com/150',
      inStock: true
    };
    
    setCartItems([...cartItems, product]);
    
    toast({
      title: "Added to cart",
      description: `${listing.crop} (${listing.variety}) has been added to your cart.`,
    });
  };
  
  function getCategoryForCrop(crop: string): string {
    if (['Wheat', 'Rice', 'Maize', 'Soybean', 'Pulses'].includes(crop)) {
      return 'Grains';
    } else if (['Seeds', 'Seed'].includes(crop)) {
      return 'Seeds';
    } else if (['Fertilizer', 'Manure', 'Compost'].includes(crop)) {
      return 'Fertilizers';
    } else if (['Pesticide', 'Herbicide', 'Fungicide'].includes(crop)) {
      return 'Pesticides';
    } else if (['Tractor', 'Plough', 'Harvester', 'Tool'].includes(crop)) {
      return 'Equipment';
    }
    return 'Other';
  }
  
  const createListing = () => {
    toast({
      title: "Feature coming soon",
      description: "Creating new market listings will be available in the next update.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agricultural Market</h1>
          <p className="text-muted-foreground mt-1">
            Buy and sell agricultural products, equipment, and supplies
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Cart ({cartItems.length})
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="buy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy Products</TabsTrigger>
          <TabsTrigger value="sell">Sell Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-6">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                className="pl-10" 
                placeholder="Search products, crops, or supplies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory || 'All'} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Market trends */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Market Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Wheat (per kg)</p>
                  <p className="text-lg font-semibold">₹24.50</p>
                  <Badge variant="outline" className="text-green-500">↑ 2.5%</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Rice (per kg)</p>
                  <p className="text-lg font-semibold">₹75.20</p>
                  <Badge variant="outline" className="text-red-500">↓ 1.2%</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Urea (per bag)</p>
                  <p className="text-lg font-semibold">₹267.00</p>
                  <Badge variant="outline" className="text-green-500">↑ 0.7%</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pesticides Index</p>
                  <p className="text-lg font-semibold">₹420.30</p>
                  <Badge variant="outline" className="text-gray-500">↔ 0.0%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Product listings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(6).fill(0).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredListings.length === 0 ? (
              <div className="col-span-3 py-12 text-center">
                <p className="text-muted-foreground">No products match your search criteria</p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <Card key={listing.id}>
                  <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                    <img 
                      src={listing.image_url || "/placeholder.svg"} 
                      alt={listing.crop}
                      className="object-cover w-full h-full"
                    />
                    <Badge className="absolute top-2 right-2">
                      {getCategoryForCrop(listing.crop)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{listing.crop}</h3>
                        <p className="text-sm text-muted-foreground">{listing.variety}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{listing.price}</p>
                        <p className="text-xs text-muted-foreground">per {listing.unit}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center text-sm gap-1">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>Available: {listing.quantity} {listing.unit}</span>
                      </div>
                      <div className="flex items-center text-sm gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{listing.location}</span>
                      </div>
                      <div className="flex items-center text-sm gap-1">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>Ships within 2-3 days</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => addToCart(listing)}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sell" className="space-y-6">
          {!selectedFarmId ? (
            <Card className="p-8 text-center">
              <CardTitle className="mb-4">Select a Farm</CardTitle>
              <CardDescription>
                Please select a farm to start selling your products.
              </CardDescription>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Listings</h2>
                <Button onClick={createListing}>
                  Create New Listing
                </Button>
              </div>
              
              {myListings.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardTitle className="mb-4">No Listings Yet</CardTitle>
                  <CardDescription>
                    You haven't listed any products for sale yet. Click the button above to create your first listing.
                  </CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myListings.map((listing) => (
                    <Card key={listing.id}>
                      {/* Listing details would go here */}
                    </Card>
                  ))}
                </div>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Selling Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>• Add clear photos of your products to attract more buyers</p>
                  <p>• Be honest about quality and condition</p>
                  <p>• Competitive pricing increases chances of quick sales</p>
                  <p>• Respond promptly to buyer inquiries</p>
                  <p>• Offer delivery options for better customer experience</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Market;
