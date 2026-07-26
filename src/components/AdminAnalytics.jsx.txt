import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, TrendingUp, Calendar, Users } from "lucide-react";

export default function AdminAnalytics() {
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [topPages, setTopPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Total Page Views Count
      const { count: totalCount, error: totalError } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true });

      if (totalError) throw totalError;

      // 2. Fetch Today's Views Count
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count: todayCount, error: todayError } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfToday.toISOString());

      if (todayError) throw todayError;

      // 3. Fetch Recent Views to calculate top pages
      const { data: recentViews, error: recentError } = await supabase
        .from("page_views")
        .select("page_path")
        .limit(500);

      if (recentError) throw recentError;

      // Calculate popular pages
      const pageCounts = {};
      (recentViews || []).forEach((v) => {
        const path = v.page_path || "/";
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      });

      const sortedPages = Object.entries(pageCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-card-foreground">Site Analytics</h2>
        <button
          onClick={fetchAnalytics}
          className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-accent/10 text-accent rounded-xl">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Total Page Views
            </p>
            <h3 className="text-2xl font-bold text-card-foreground mt-1">
              {loading ? "..." : totalViews.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-accent/10 text-accent rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Today's Visits
            </p>
            <h3 className="text-2xl font-bold text-card-foreground mt-1">
              {loading ? "..." : todayViews.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Top Pages Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden p-5">
        <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" /> Most Viewed Pages
        </h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading top pages...</p>
        ) : topPages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 text-sm"
              >
                <span className="font-medium text-card-foreground">{page.path}</span>
                <span className="bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full">
                  {page.count} views
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
