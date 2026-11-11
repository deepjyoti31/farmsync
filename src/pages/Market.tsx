import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  RefreshCw,
  Store,
  Leaf,
  Users,
  Star
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
import { useFarmScope } from '@/hooks/useFarmScope';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';


// New Components and Types
import ListingCard from '@/components/market/ListingCard';
import SupplierCard from '@/components/market/SupplierCard';
import CreateListingDialog from '@/components/market/CreateListingDialog';
import InquiryDialog from '@/components/market/InquiryDialog';
import { MarketplaceListing, Supplier, MARKET_CATEGORIES } from '@/types/marketplace';
import {
  MarketPrice,
  filterMarketPrices,
  priceBoard,
  toMarketPrice,
} from '@/lib/marketPrices';
import PageHeader from '@/components/common/PageHeader';
import PriceBoard from '@/components/market/PriceBoard';

/** Shown only while the market_data table is empty, and labelled as sample data in the UI. */
const SAMPLE_MARKET_PRICES: MarketPrice[] = [
  { commodity: 'Onion', variety: 'Red', market: 'Lasalgaon', state: 'Maharashtra', district: 'Nashik', min_price: 1200, max_price: 1800, modal_price: 1500, date: '2025-12-18' },
  { commodity: 'Potato', variety: 'Local', market: 'Indore', state: 'Madhya Pradesh', district: 'Indore', min_price: 800, max_price: 1100, modal_price: 950, date: '2025-12-18' },
  { commodity: 'Tomato', variety: 'Hybrid', market: 'Kolar', state: 'Karnataka', district: 'Kolar', min_price: 1500, max_price: 2200, modal_price: 1800, date: '2025-12-18' },
  { commodity: 'Wheat', variety: 'Lokwan', market: 'Khanna', state: 'Punjab', district: 'Ludhiana', min_price: 2100, max_price: 2300, modal_price: 2200, date: '2025-12-18' },
];


const Market = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("prices");

  // States for Listings
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [listingSearch, setListingSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);


  // Fetch Current User
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.id || null));
  }, []);

  // Fetch Farms (for creating listings)
  const scope = useFarmScope();
  const { data: farms = [] } = useQuery({
    queryKey: ['farms', 'market', scope.key],
    enabled: scope.ready,
    queryFn: async () => {
      const { data, error } = await scope.apply(supabase.from('farms').select('id, name, village, district, state, gps_latitude, gps_longitude'));
      if (error) throw error;
      return data;
    },
  });

  // Crops grown on the selected farm are pinned to the top of the price board.
  const { data: grownCrops = [] } = useQuery({
    queryKey: ['field_crops', selectedFarmId, 'crop-names'],
    enabled: !!selectedFarmId,
    queryFn: async () => {
      const { data } = await supabase
        .from('field_crops')
        .select('name, crop:crops(name), field:fields!inner(farm_id)')
        .eq('field.farm_id', selectedFarmId!);
      return Array.from(new Set((data ?? []).map((r) => r.crop?.name || r.name).filter((n): n is string => !!n)));
    },
  });

  // --- MARKET PRICES DATA (Existing Logic) ---
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketCategory, setMarketCategory] = useState<string | null>(null);
  const [marketState, setMarketState] = useState<string | null>(null);

  const { data: marketData = [], isLoading: isMarketLoading, refetch: refetchMarket } = useQuery({
    queryKey: ['market_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(500);

      if (error) {
        console.warn('Market data fetch failed:', error);
        return [];
      }
      return (data || []).map(toMarketPrice);
    },
    enabled: activeTab === 'prices'
  });

  // Until real prices are loaded into market_data, show clearly labelled sample prices.
  const isSampleMarketData = marketData.length === 0;
  const safeMarketData: MarketPrice[] = isSampleMarketData ? SAMPLE_MARKET_PRICES : marketData;

  const marketStates = Array.from(new Set(safeMarketData.map((item) => item.state).filter(Boolean))).sort();
  const marketCommodities = Array.from(new Set(safeMarketData.map((item) => item.commodity))).sort();

  const filteredMarketData = filterMarketPrices(safeMarketData, {
    search: marketSearchQuery,
    commodity: marketCategory,
    state: marketState,
  });

  // Prices arrive newest first, so the first row per crop and market is that market's latest.
  const latestPerMarket = filteredMarketData.filter((item, i, all) =>
    all.findIndex((o) => o.commodity === item.commodity && o.market === item.market && o.variety === item.variety) === i,
  );

  const board = priceBoard(
    filterMarketPrices(safeMarketData, { search: marketSearchQuery, commodity: marketCategory, state: marketState }),
    grownCrops,
  );


  // --- MARKETPLACE LISTINGS DATA ---
  const { data: listings = [], isLoading: isListingsLoading, refetch: refetchListings } = useQuery({
    queryKey: ['marketplace_listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MarketplaceListing[];
    },
    enabled: activeTab === 'buy' || activeTab === 'sell'
  });

  const filteredListings = listings.filter(l => {
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (listingSearch && !l.title.toLowerCase().includes(listingSearch.toLowerCase()) && !l.description?.toLowerCase().includes(listingSearch.toLowerCase())) return false;
    return true;
  });

  const myListings = listings.filter(l => l.seller_id === currentUser);


  // --- SUPPLIERS DATA ---
  const { data: suppliers = [], isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: activeTab === 'suppliers'
  });


  const handleContact = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setInquiryOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market"
        description="Today's mandi prices, produce listings and suppliers near you."
        actions={
          <>
            <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={setSelectedFarmId} />
            <CreateListingDialog farms={farms} onSuccess={() => refetchListings()} trigger={<Button>List produce for sale</Button>} />
          </>
        }
      />

      <Tabs defaultValue="prices" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="buy">Listings</TabsTrigger>
          <TabsTrigger value="sell">My listings{myListings.length > 0 && <span className="font-mono text-xs text-muted-foreground">{myListings.length}</span>}</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: MARKET PRICES --- */}
        <TabsContent value="prices" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Search by crop or market..."
                value={marketSearchQuery}
                onChange={(e) => setMarketSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={marketCategory || undefined} onValueChange={setMarketCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Commodity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_commodities">All Commodities</SelectItem>
                  {marketCommodities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={marketState || undefined} onValueChange={setMarketState}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_states">All States</SelectItem>
                  {marketStates.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetchMarket()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <section aria-labelledby="board-h" className="surface overflow-hidden">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pb-2 pt-5">
              <h2 id="board-h" className="text-xl font-bold">Price board</h2>
              {isSampleMarketData && <Badge variant="warning">Sample data</Badge>}
              <span className="text-sm text-muted-foreground">₹ per quintal, averaged across markets</span>
              {grownCrops.length > 0 && (
                <span className="ms-auto inline-flex items-center gap-1.5 text-[13px] text-[#34453A] dark:text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-harvest text-[#B26B00]" aria-hidden="true" /> Crops you grow come first
                </span>
              )}
            </div>
            {board.length > 0 ? (
              <PriceBoard rows={board} />
            ) : (
              <p className="px-5 pb-6 text-muted-foreground">No prices match.</p>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Every market
                {isSampleMarketData && <Badge variant="warning">Sample data</Badge>}
              </CardTitle>
              <CardDescription>Each market's latest prices, newest first.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Min/Max (₹)</TableHead>
                    <TableHead>Modal Price (₹)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestPerMarket.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {item.commodity}
                        {item.variety && <span className="text-xs text-muted-foreground"> ({item.variety})</span>}
                      </TableCell>
                      <TableCell>{item.market}</TableCell>
                      <TableCell>{item.district}, {item.state}</TableCell>
                      <TableCell className="font-mono text-[13px]">{item.min_price} to {item.max_price}</TableCell>
                      <TableCell className="font-mono font-medium">{item.modal_price}</TableCell>
                      <TableCell className="font-mono text-[13px]">{item.date}</TableCell>
                    </TableRow>
                  ))}
                  {latestPerMarket.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No market data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: BROWSE LISTINGS --- */}
        <TabsContent value="buy" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Search listings..."
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MARKET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isListingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.length > 0 ? (
                filteredListings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onContact={handleContact}
                    isOwner={listing.seller_id === currentUser}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-muted/30 rounded-lg">
                  <Leaf className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold">No active listings found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* --- TAB 3: MY LISTINGS --- */}
        <TabsContent value="sell" className="space-y-6">
          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold">My Products</h2>
              <p className="text-sm text-muted-foreground">Manage your products and view buyer inquiries.</p>
            </div>
            <CreateListingDialog
              farms={farms}
              onSuccess={() => refetchListings()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.length > 0 ? (
              myListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onContact={handleContact}
                  isOwner={true}
                />
              ))
            ) : (
              <div className="col-span-full py-16 text-center border-2 border-dashed rounded-lg">
                <Store className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold">You haven't listed anything yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Start selling your produce directly to buyers by creating your first listing.
                </p>
                <CreateListingDialog
                  farms={farms}
                  onSuccess={() => refetchListings()}
                  trigger={<Button>Create First Listing</Button>}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* --- TAB 4: SUPPLIERS --- */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Verified Suppliers Directory</h2>
            </div>
            <p className="text-muted-foreground">Find trusted partners for seeds, fertilizers, machinery, and services.</p>
          </div>

          {isSuppliersLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suppliers.map(supplier => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <InquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        listing={selectedListing}
        isOwner={!!selectedListing && selectedListing.seller_id === currentUser}
      />
    </div>
  );
};

export default Market;
