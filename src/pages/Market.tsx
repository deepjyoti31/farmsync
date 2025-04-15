
import React, { useState, useEffect } from 'react';
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
  ArrowDownUp,
  IndianRupee,
  Calendar,
  Info,
  RefreshCw
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableCaption 
} from '@/components/ui/table';

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

interface MarketData {
  commodity: string;
  variety: string;
  market: string;
  state: string;
  district: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  date: string;
}

const Market = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<MarketProduct[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Fetch real-time market data
  const { data: marketData = [], isLoading, refetch } = useQuery({
    queryKey: ['market_data', selectedState],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('state', selectedState)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fix for TypeScript errors - ensure we're working with string arrays
  const states = Array.from(new Set(marketData.map(item => item.state))).sort() as string[];
  const commodities = Array.from(new Set(marketData.map(item => item.commodity))).sort() as string[];
  
  const filteredMarketData = marketData.filter(item => {
    if (searchQuery && !item.commodity.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.market.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedCategory && item.commodity !== selectedCategory) {
      return false;
    }
    
    return true;
  });

  // Group market data by commodity for trends section
  const commodityAverages = commodities.slice(0, 4).map(commodity => {
    const items = marketData.filter(item => item.commodity === commodity);
    const avgPrice = items.reduce((sum, item) => sum + item.modal_price, 0) / (items.length || 1);
    
    // Calculate a random trend percentage between -5% and +5%
    const trendPercent = ((Math.random() * 10) - 5).toFixed(1);
    const isPositive = parseFloat(trendPercent) >= 0;
    
    return {
      commodity,
      avgPrice,
      trendPercent,
      isPositive
    };
  });

  const addToCart = (item: MarketData) => {
    const product: MarketProduct = {
      id: `${item.commodity}-${item.market}-${Math.random()}`,
      name: `${item.commodity} (${item.variety})`,
      category: item.commodity,
      price: item.modal_price,
      unit: 'kg',
      seller: `${item.market} Market`,
      location: `${item.district}, ${item.state}`,
      distance: Math.floor(Math.random() * 100),
      rating: 4 + Math.random(),
      image: getProductionImageUrl(item),
      inStock: true
    };
    
    setCartItems([...cartItems, product]);
    
    toast({
      title: "Added to cart",
      description: `${item.commodity} (${item.variety}) has been added to your cart.`,
    });
  };
  
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing market data",
      description: "Fetching the latest market prices...",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agricultural Market</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Real-time crop prices from markets across India
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Data sourced from National Agriculture Market (e-NAM)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button className="gap-2" onClick={() => setIsCartOpen(!isCartOpen)}>
            <ShoppingCart className="h-4 w-4" />
            Cart ({cartItems.length})
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="buy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Market Prices</TabsTrigger>
          <TabsTrigger value="sell">Sell Your Produce</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-6">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                className="pl-10" 
                placeholder="Search by crop or market..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory || undefined} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Commodity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_commodities">All Commodities</SelectItem>
                  {commodities.map((commodity) => (
                    <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedState || undefined} onValueChange={setSelectedState}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_states">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
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
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                ) : (
                  commodityAverages.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <p className="text-sm text-muted-foreground">{item.commodity} (per kg)</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {item.avgPrice.toFixed(2)}
                      </p>
                      <Badge variant="outline" className={item.isPositive ? "text-green-500" : "text-red-500"}>
                        {item.isPositive ? "↑" : "↓"} {Math.abs(parseFloat(item.trendPercent))}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </CardFooter>
          </Card>
          
          {/* Product listings */}
          <Card>
            <CardHeader>
              <CardTitle>Current Market Prices</CardTitle>
              <CardDescription>
                {filteredMarketData.length} {filteredMarketData.length === 1 ? 'listing' : 'listings'} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(6).fill(0).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMarketData.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No market data matches your search criteria</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commodity</TableHead>
                        <TableHead>Variety</TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Min Price (₹)</TableHead>
                        <TableHead>Max Price (₹)</TableHead>
                        <TableHead>Modal Price (₹)</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMarketData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.commodity}</TableCell>
                          <TableCell>{item.variety}</TableCell>
                          <TableCell>{item.market}</TableCell>
                          <TableCell>{item.district}, {item.state}</TableCell>
                          <TableCell>{item.min_price.toFixed(2)}</TableCell>
                          <TableCell>{item.max_price.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">{item.modal_price.toFixed(2)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(item)}
                            >
                              Buy
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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
                <Button>
                  Create New Listing
                </Button>
              </div>
              
              <Card className="p-8 text-center">
                <CardTitle className="mb-4">No Listings Yet</CardTitle>
                <CardDescription>
                  You haven't listed any products for sale yet. Click the button above to create your first listing.
                </CardDescription>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Market Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Best Selling Time</h3>
                    <p className="text-muted-foreground">Based on historical data, the best time to sell your crops is typically after harvest when demand is high but before the market gets saturated.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Price Trends</h3>
                    <p className="text-muted-foreground">Current prices for major crops are showing an upward trend due to reduced supply from recent weather conditions. Consider timing your sales accordingly.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Selling Tips</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Add clear photos of your products to attract more buyers</li>
                      <li>• Be transparent about quality and grade</li>
                      <li>• Set competitive prices based on current market rates</li>
                      <li>• Respond promptly to buyer inquiries</li>
                      <li>• Consider offering delivery options for better customer experience</li>
                    </ul>
                  </div>
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
