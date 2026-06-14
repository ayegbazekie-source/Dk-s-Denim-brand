import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module path
import { TrendingUp, ShoppingBag, Users, Mail, Package, DollarSign } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ orders: 0, affiliates: 0, subscribers: 0, products: 0, revenue: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run parallel entity fetch calls across your custom Postgres tables using Supabase Client
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliates").select("*"),
      supabase.from("newsletter_subscribers").select("*"),
      supabase.from("products").select("*"),
    ])
      .then(([ordersRes, affiliatesRes, subsRes, productsRes]) => {
        // Log query error parameters safely if they manifest during runtime
        if (ordersRes.error) throw ordersRes.error;
        if (affiliatesRes.error) throw affiliatesRes.error;
        if (subsRes.error) throw subsRes.error;
        if (productsRes.error) throw productsRes.error;

        const orders = ordersRes.data || [];
        const affiliates = affiliatesRes.data || [];
        const subs = subsRes.data || [];
        const products = productsRes.data || [];

        // Aggregate monetary analytics and pipeline bottlenecks locally
        const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const pendingOrders = orders.filter(o => o.status === "pending").length;

        setStats({
          orders: orders.length,
          affiliates: affiliates.length,
          subscribers: subs.length,
          products: products.length,
          revenue,
          pendingOrders,
        });

        // Set the most recent 8 records for the dashboard feed
        setRecentOrders(orders.slice(0, 8));
      })
      .catch((err) => {
        console.error("Error loading administration overview metrics:", err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag, color: "text-primary bg-primary/10" },
    { label: "Total Revenue", value: `₦${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-accent bg-accent/10" },
    { label: "Affiliates", value: stats.affiliates, icon: Users, color: "text-blue-400 bg-blue-400/10" },
    { label: "Subscribers", value: stats.subscribers, icon: Mail, color: "text-orange-400 bg-orange-400/10" },
    { label: "Active Products", value: stats.products, icon: Package, color: "text-purple-400 bg-purple-400/10" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: TrendingUp, color: stats.pendingOrders > 0 ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground bg-muted" },
  ];

  const statusColor = { pending: "text-orange-400 bg-orange-400/10", confirmed: "text-accent bg-accent/10", processing: "text-primary bg-primary/10", shipped: "text-blue-400 bg-blue-400/10", delivered: "text-green-400 bg-green-400/10", cancelled: "text-destructive bg-destructive/10" };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wide与 truncate">{c.label}</span>
                <div className={`p-2 rounded-xl shrink-0 ${c.color}`}><Icon className="h-4 w-4" /></div>
              </div>
              <p className="text-card-foreground text-xl font-black mt-2 tracking-tight truncate">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Board Analytics Section */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-card-foreground font-black text-lg">Recent Order Feed</h2>
            <p className="text-muted-foreground text-xs mt-0.5">Real-time oversight of ongoing store purchases</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                <th className="text-left pb-3 font-semibold">Customer</th>
                <th className="text-left pb-3 font-semibold">Product</th>
                <th className="text-left pb-3 font-semibold">Amount</th>
                <th className="text-left pb-3 font-semibold">Status</th>
                <th className="text-left pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((o, i) => (
                <tr key={i} className="text-card-foreground hover:bg-muted/5 transition-colors">
                  <td className="py-3.5 font-bold">{o.customer_name || "Guest Account"}</td>
                  <td className="py-3.5 text-muted-foreground truncate max-w-[140px]">{o.product_name || (o.is_custom_order ? "Custom Order" : "Bespoke Apparel Package")}</td>
                  <td className="py-3.5 text-accent font-black">₦{(o.total_amount || 0).toLocaleString()}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold capitalize ${statusColor[o.status] || "text-muted-foreground bg-muted"}`}>{o.status || "pending"}</span>
                  </td>
                  <td className="py-3.5 text-muted-foreground text-xs">{o.order_date || o.created_at ? new Date(o.order_date || o.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-25" />
                    No orders recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
