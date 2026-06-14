import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module location path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Megaphone, Plus, Trash2, Send } from "lucide-react";

const EMPTY = { title: "", message: "", target: "all", status: "draft" };

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Fetch announcements log records from your database
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching announcements ledger:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Post a new configuration record row to Supabase
  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const payload = { 
        ...form, 
        sent_at: new Date().toISOString(), 
        status: "sent" 
      };

      const { error } = await supabase
        .from("announcements")
        .insert([payload]);

      if (error) throw error;

      /* OPTIONAL EMAIL BROADCAST INTEGRATION
         If you want announcements to automatically trigger your Brevo + Cloudflare Worker setup,
         you can add a fetch block here pointing to your worker route address.
      */

      setSent(true);
      setForm(EMPTY);
      setTimeout(() => setSent(false), 3000);
      load();
    } catch (err) {
      console.error("Failed to post announcement:", err.message);
      alert(`Database constraint error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Remove history record row instantly
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      load();
    } catch (err) {
      console.error("Error archiving announcement:", err.message);
    }
  };

  const statusColor = { sent: "text-accent bg-accent/10", draft: "text-muted-foreground bg-muted" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Workspace View */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-card-foreground font-black text-lg mb-5 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" /> Create Announcement
        </h2>
        {sent && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4 text-accent font-bold text-sm flex items-center gap-2">
            <Send className="h-4 w-4" /> Announcement sent successfully!
          </div>
        )}
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Title</Label>
            <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="bg-muted border-border text-card-foreground mt-1" placeholder="New Collection Drop!" required />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Message</Label>
            <Textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} className="bg-muted border-border text-card-foreground mt-1 min-h-[100px]" placeholder="Type your announcement here..." required />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Target Audience</Label>
            <Select value={form.target} onValueChange={v => setForm(f => ({...f, target: v}))}>
              <SelectTrigger className="bg-muted border-border text-card-foreground mt-1 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border text-card-foreground">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="affiliates">Affiliates Only</SelectItem>
                <SelectItem value="subscribers">Newsletter Subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={sending} className="w-full bg-primary text-primary-foreground font-bold rounded-full py-3 hover:scale-105 transition-all">
            <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Announcement"}
          </Button>
        </form>
      </div>

      {/* History Log Panel Workspace */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-card-foreground font-black text-lg mb-5">Announcement History</h2>
        <div className="space-y-3 overflow-y-auto max-h-[500px]">
          {items.map(item => (
            <div key={item.id} className="border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-card-foreground font-bold text-sm">{item.title}</h3>
                <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.message}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-bold capitalize ${statusColor[item.status] || "text-muted-foreground bg-muted"}`}>{item.status}</span>
                <span className="text-muted-foreground">→ {item.target}</span>
                {item.sent_at && <span className="text-muted-foreground ml-auto">{new Date(item.sent_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="py-10 text-center text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-30" />No announcements yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
