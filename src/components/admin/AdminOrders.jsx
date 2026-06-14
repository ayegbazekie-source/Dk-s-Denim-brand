import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, ShoppingBag, Send, Check, BadgeCheck, Clock, AlertCircle } from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const statusColor = { pending: "text-orange-400 bg-orange-400/10", confirmed: "text-accent bg-accent/10", processing: "text-primary bg-primary/10", shipped: "text-blue-400 bg-blue-400/10", delivered: "text-green-400 bg-green-400/10", cancelled: "text-destructive bg-destructive/10" };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Load orders data from Postgres via Supabase client sorted by date descending
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }); // Replaces base44's "-created_date" sorting mechanisms

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Update tracking milestone strings for specific transactions
  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      if (selected?.id === id) {
        setSelected(o => ({ ...o, status }));
      }
      load();
    } catch (err) {
      console.error("Error updating order status:", err.message);
      alert(`Database update error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

// Inside sendReadyEmail() in AdminOrders.jsx
const sendReadyEmail = async (order) => {
  setSendingEmail(true);
  try {
    const emailResponse = await fetch("https://your-worker-name.your-subdomain.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: order.customer_email,
        toName: order.customer_name,
        subject: `Your D-Kadris Order is Ready! 📦`,
        body: emailMsg // The custom message text typed in your admin dashboard textarea
      }),
    });

    if (emailResponse.ok) {
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setEmailMsg("");
      }, 4000);
    } else {
      throw new Error("Email worker request rejected.");
    }
  } catch (err) {
    console.error("Error sending communication:", err);
    alert("Could not deliver notification email via serverless routing.");
  } finally {
    setSendingEmail(false);
  }
};

  const filtered = orders.filter(o => {
    const matchesSearch = !search || 
      o.id?.toString().toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="pl-9 bg-muted border-border text-card-foreground rounded-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {["all", "pending", "processing", "delivered"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border ${filterStatus === s ? "bg-accent text-accent-foreground border-accent" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wide border-b border-border bg-muted/30">
              <th className="text-left p-4">Order ID</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(o => (
              <tr key={o.id} className="text-card-foreground hover:bg-muted/20 transition-colors">
                <td className="p-4 font-mono text-xs font-bold">#{o.id?.toString().slice(-6)}</td>
                <td className="p-4">
                  <p className="font-bold">{o.customer_name || "Guest User"}</p>
                  <p className="text-muted-foreground text-xs">{o.customer_email}</p>
                </td>
                <td className="p-4 text-accent font-bold">₦{(o.total_amount || o.total || 0).toLocaleString()}</td>
                <td className="p-4 text-muted-foreground">
                  {Array.isArray(o.items) ? o.items.length : o.total_items || 1} items
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor[o.status] || "text-muted-foreground bg-muted"}`}>{o.status || "pending"}</span>
                </td>
                <td className="p-4">
                  <button onClick={() => { setSelected(o); setEmailSent(false); }} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground"><ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black text-xl">Order Invoice Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs uppercase tracking-wide">Customer Name</p><p className="text-card-foreground font-medium mt-0.5">{selected.customer_name}</p></div>
                <div><p className="text-muted-foreground text-xs uppercase tracking-wide">Email Address</p><p className="text-card-foreground font-medium mt-0.5">{selected.customer_email}</p></div>
                <div><p className="text-muted-foreground text-xs uppercase tracking-wide">Phone Number</p><p className="text-card-foreground font-medium mt-0.5">{selected.customer_phone || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs uppercase tracking-wide">Order Date</p><p className="text-card-foreground font-medium mt-0.5">{selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—"}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs uppercase tracking-wide">Delivery Address</p><p className="text-card-foreground font-medium mt-0.5">{selected.shipping_address || selected.address || "—"}</p></div>
              </div>

              {/* Items Summary Breakdown */}
              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Garments Summary</p>
                <div className="bg-muted/30 rounded-xl p-3 space-y-2 border border-border/40">
                  {Array.isArray(selected.items) ? selected.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div><span className="font-bold text-card-foreground">{item.name || "Custom Apparel"}</span><span className="text-muted-foreground text-xs ml-2">x{item.quantity || 1}</span></div>
                      <span className="font-medium text-accent">₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-card-foreground font-medium">Bespoke Design Production Package</p>
                  )}
                  <div className="flex justify-between items-center border-t border-border/60 pt-2 font-bold text-sm">
                    <span className="text-card-foreground">Total Paid Amount</span>
                    <span className="text-accent">₦{(selected.total_amount || selected.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Trigger Map */}
              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Update Order Pipeline Step</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all capitalize ${selected.status === s ? statusColor[s] : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ready Notification Communications Area */}
              {selected.status === "processing" && (
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Order Status Notification</p>
                  {emailSent ? (
                    <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-accent font-bold text-sm flex items-center gap-2">
                      <Check className="h-4 w-4" /> Email sent to {selected.customer_email}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea value={emailMsg} onChange={e => setEmailMsg(e.target.value)} placeholder={`Type a message to ${selected.customer_name || "the customer"}...`}
                        className="w-full bg-muted border border-border rounded-xl p-3 text-card-foreground text-sm placeholder:text-muted-foreground min-h-[80px] focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none" />
                      <Button onClick={() => sendReadyEmail(selected)} disabled={sendingEmail || !emailMsg.trim()} className="bg-accent text-accent-foreground font-bold rounded-full px-6 py-2.5 hover:scale-105 transition-all flex items-center gap-2 text-sm">
                        <Send className="h-4 w-4" /> {sendingEmail ? "Sending..." : "Send 'Order Ready' Email"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
