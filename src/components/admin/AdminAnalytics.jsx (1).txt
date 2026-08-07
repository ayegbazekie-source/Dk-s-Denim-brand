import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Eye, 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  RefreshCw, 
  Globe, 
  Share2 
} from "lucide-react";

export default function AdminAnalytics() {
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [topPages, setTopPages] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [affiliateRevenue, setAffiliateRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Total Page Views Count
      const { count: totalCount, error: totalError } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true });

      if (totalError && totalError.code !== "PGRST116") {
        console.warn("Total views error:", totalError.message);
      }

      // 2. Fetch Today's Views Count
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count: todayCount, error: todayError } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfToday.toISOString());

      if (todayError && todayError.code !== "PGRST116") {
        console.warn("Today views error:", todayError.message);
      }

      // 3. Fetch Orders for Revenue, Order Counts, and Affiliate Metrics
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, affiliate_code");

      if (!ordersError && ordersData) {
        const rev = ordersData.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        const count = ordersData.length;
        const aov = count > 0 ? rev / count : 0;
        
        const affOrders = ordersData.filter(o => o.affiliate_code);
        const affRev = affOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

        setTotalRevenue(rev);
        setTotalOrders(count);
        setAvgOrderValue(aov);
        setAffiliateRevenue(affRev);
      }

      // 4. Fetch Page Views to calculate normalized top pages
      const { data: recentViews, error: recentError } = await supabase
        .from("page_views")
        .select("page_path")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (recentError && recentError.code !== "PGRST116") {
        console.warn("Recent views error:", recentError.message);
      }

      // Calculate popular pages with normalized paths (merging /Catalog and /catalog)
      const pageCounts = {};
      (recentViews || []).forEach((v) => {
        let rawPath = v.page_path || "/";
        let cleanPath = rawPath.trim().toLowerCase();
        
        // Remove trailing slashes except for root
        if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
          cleanPath = cleanPath.slice(0, -1);
        }

        pageCounts[cleanPath] = (pageCounts[cleanPath] || 0) + 1;
      });

      const sortedPages = Object.entries(pageCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTotalViews(totalCount || 0);
      setTodayViews(todayCount || 0);
      setTopPages(sortedPages);

    } catch (err) {
      console.error("Error loading analytics:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-accent" /> Site Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time traffic metrics, route normalization, and store conversion overview.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-border"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-accent/10 text-accent rounded-xl shrink-0">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Total Page Views
            </p>
            <h3 className="text-2xl font-black text-card-foreground mt-0.5">
              {loading ? "..." : totalViews.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Today's Visits
            </p>
            <h3 className="text-2xl font-black text-card-foreground mt-0.5">
              {loading ? "..." : todayViews.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Conversion Rate
            </p>
            <h3 className="text-2xl font-black text-card-foreground mt-0.5">
              {loading ? "..." : `${conversionRate}%`}
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium">{totalOrders} Total Orders</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Avg Order Value
            </p>
            <h3 className="text-2xl font-black text-amber-500 mt-0.5">
              {loading ? "..." : `₦${Math.round(avgOrderValue).toLocaleString()}`}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Normalized Most Viewed Pages Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Normalized Page Performance
            </h3>
            <span className="text-[10px] bg-accent/10 text-accent font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Cleaned URLs
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading page metrics...</p>
          ) : topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No page views recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topPages.map((page, index) => {
                const maxCount = topPages[0]?.count || 1;
                const percentage = Math.round((page.count / maxCount) * 100);

                return (
                  <div key={index} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-sm space-y-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="font-mono text-card-foreground">{page.path}</span>
                      <span className="bg-accent/10 text-accent text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {page.count} views
                      </span>
                    </div>

                    {/* Visual bar */}
                    <div className="w-full bg-muted/80 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Channel Summary */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2 mb-4">
              <Share2 className="h-4 w-4 text-accent" /> Financial Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted-foreground font-medium">Gross Revenue</span>
                <span className="font-black text-card-foreground">₦{totalRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted-foreground font-medium">Affiliate Sales Vol.</span>
                <span className="font-black text-amber-500">₦{affiliateRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted-foreground font-medium">Total Orders</span>
                <span className="font-bold text-card-foreground">{totalOrders}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 text-center">
            <span className="text-[11px] text-muted-foreground">
              Analytics route paths normalized to prevent duplication.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
