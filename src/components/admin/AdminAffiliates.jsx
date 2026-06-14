import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Users, Check, Bell } from "lucide-react";

const STATUS_EMAILS = {
  pending: {
    subject: "D-Kadris Affiliate Account — Under Review",
    body: (name) => `Hi ${name},\n\nYour D-Kadris affiliate account is currently undergoing review. You cannot earn commissions or track sales yet until approved by our team.\n\nWe will notify you once your account is approved.\n\nBest regards,\nD-Kadris Denims Team`,
  },
  active: {
    subject: "D-Kadris Affiliate Account — Approved! 🎉",
    body: (name, code) => `Hi ${name},\n\nGreat news! Your D-Kadris affiliate account has been approved.\n\nYou can now:\n• Share your referral code: ${code}\n• Track your sales and clicks on your dashboard\n• Request payouts once you reach the ₦5,000 threshold\n\nYour ₦500 sign-up bonus is now active in your wallet!\n\nLogin at: https://d-kadrisdenims.com/Affiliate\n\nBest regards,\nD-Kadris Denims Team`,
  },
  suspended: {
    subject: "D-Kadris Affiliate Account — Suspended",
    body: (name) => `Hi ${name},\n\nWe regret to inform you that your D-Kadris affiliate account has been suspended.\n\nYour referral code is no longer active and commissions cannot be earned at this time.\n\nIf you believe this is an error, please contact us on WhatsApp: +2348163914835\n\nBest regards,\nD-Kadris Denims Team`,
  },
};

const statusColor = {
  pending: "text-orange-400 bg-orange-400/10",
  active: "text-accent bg-accent/10",
  suspended: "text-destructive bg-destructive/10",
};

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  // Load affiliates list from your Postgres table using the Supabase client
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (err) {
      console.error("Error loading affiliates:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Handle updating the onboarding/review status of an affiliate partner
  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const aff = affiliates.find(a => a.id === id) || selected;

      const { error } = await supabase
        .from("affiliates")
        .update({ status })
        .eq("id", id);

      if (error) throw error; // 1. Wait for database update to finish successfully

      // ======================================================================
      // INSERTED BLOCK START: Fire off the Cloudflare Worker notification
      // ======================================================================
      if (aff?.email && STATUS_EMAILS[status]) {
        const tmpl = STATUS_EMAILS[status];
        const body = status === "active" 
          ? tmpl.body(aff.name, aff.referral_code || "") 
          : tmpl.body(aff.name);
        
        try {
          // Fire off backend worker request trigger
          const emailResponse = await fetch("https://your-worker-name.your-subdomain.workers.dev", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: aff.email,
              toName: aff.name,
              subject: tmpl.subject,
              body: body
            }),
          });

          if (!emailResponse.ok) {
            console.error("Worker rejected email operation");
          }
        } catch (emailErr) {
          console.error("Failed to connect to email worker:", emailErr);
        }
      }
      // ======================================================================
      // INSERTED BLOCK END
      // ======================================================================

      if (selected?.id === id) setSelected(a => ({ ...a, status }));
      load(); // Refresh layout statistics from database values
    } catch (err) {
      console.error("Error updating affiliate status:", err.message);
      alert(`Database restriction issue: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };


  // Process and approve affiliate financial wallet payouts
  const approvePayout = async (affiliate) => {
    const amount = parseFloat(payoutAmount) || affiliate.pending_payout || 0;
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({
          paid_commissions: (affiliate.paid_commissions || 0) + amount,
          pending_payout: 0,
          payout_requested: false,
        })
        .eq("id", affiliate.id);

      if (error) throw error;

      setPayoutAmount("");
      if (selected?.id === affiliate.id) {
        setSelected(a => ({
          ...a,
          paid_commissions: (a.paid_commissions || 0) + amount,
          pending_payout: 0,
          payout_requested: false,
        }));
      }
      load();
    } catch (err) {
      console.error("Error approving affiliate payout settlement:", err.message);
      alert(`Failed to settle commissions balance: ${err.message}`);
    }
  };

  const filtered = affiliates.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.referral_code?.toLowerCase().includes(search.toLowerCase())
  );

  const payoutRequestCount = affiliates.filter(a => a.payout_requested).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates..." className="pl-9 bg-muted border-border text-card-foreground rounded-full" />
        </div>
        {payoutRequestCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-400/15 border border-orange-400/30 rounded-full px-4 py-2">
            <Bell className="h-4 w-4 text-orange-400 animate-pulse" />
            <span className="text-orange-400 font-bold text-sm">{payoutRequestCount} payout request{payoutRequestCount > 1 ? "s" : ""} pending</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wide border-b border-border bg-muted/30">
              <th className="text-left p-4">Affiliate</th>
              <th className="text-left p-4">Code</th>
              <th className="text-left p-4">Orders</th>
              <th className="text-left p-4">Earnings</th>
              <th className="text-left p-4">Pending</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(a => (
              <tr key={a.id} className={`text-card-foreground hover:bg-muted/20 transition-colors ${a.payout_requested ? "bg-orange-400/5 border-l-4 border-l-orange-400" : ""}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent font-black text-sm">{a.name?.[0] || "?"}</span>
                    </div>
                    <div>
                      <p className="font-bold">{a.name}</p>
                      <p className="text-muted-foreground text-xs">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-accent font-bold">{a.referral_code}</td>
                <td className="p-4">{a.orders_generated || 0}</td>
                <td className="p-4 text-accent font-bold">₦{(a.total_earnings || 0).toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">₦{(a.pending_payout || 0).toLocaleString()}</span>
                    {a.payout_requested && (
                      <span className="inline-flex items-center gap-1 bg-orange-400 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                        PAYMENT REQUESTED
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor[a.status] || "text-muted-foreground bg-muted"}`}>{a.status || "pending"}</span>
                </td>
                <td className="p-4">
                  <button onClick={() => setSelected(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-2 opacity-30" />No affiliates found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Overlay Sheet View Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black text-xl">Affiliate Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-5 mt-2">
              {selected.payout_requested && (
                <div className="bg-orange-400/10 border-2 border-orange-400/50 rounded-xl p-4 flex items-start gap-3">
                  <Bell className="h-5 w-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-orange-400 font-black text-sm">PAYMENT REQUESTED</p>
                    <p className="text-orange-400/70 text-xs mt-0.5">This affiliate has requested a payout of <strong>₦{(selected.pending_payout || 0).toLocaleString()}</strong>. Please process and approve below.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {[["Name", selected.name], ["Email", selected.email], ["Phone", selected.phone], ["Referral Code", selected.referral_code], ["Joined", selected.joined_date ? new Date(selected.joined_date).toLocaleDateString() : "—"], ["Last Active", selected.last_active_date ? new Date(selected.last_active_date).toLocaleDateString() : "—"], ["Referred By", selected.referred_by], ["Total Clicks", selected.total_clicks], ["Orders Generated", selected.orders_generated], ["Total Earnings", `₦${(selected.total_earnings || 0).toLocaleString()}`], ["Paid Commissions", `₦${(selected.paid_commissions || 0).toLocaleString()}`], ["Bank", selected.bank_name], ["Account", selected.account_name && selected.account_number ? `${selected.account_name} — ${selected.account_number}` : null]].filter(([, v]) => v != null && v !== "").map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
                    <p className="text-card-foreground font-medium mt-0.5">{String(value)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["pending", "active", "suspended"].map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${selected.status === s ? statusColor[s] : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-2">Changing status automatically sends an email notification to the affiliate.</p>
              </div>

              {(selected.pending_payout || 0) > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Approve Payout (Pending: ₦{selected.pending_payout?.toLocaleString()})</p>
                  <div className="flex gap-2">
                    <Input value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                      placeholder={`₦${selected.pending_payout?.toLocaleString()}`} className="bg-muted border-border text-card-foreground rounded-full flex-1" />
                    <Button onClick={() => approvePayout(selected)} className="bg-accent text-accent-foreground rounded-full font-bold px-5 hover:scale-105 transition-all">
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
