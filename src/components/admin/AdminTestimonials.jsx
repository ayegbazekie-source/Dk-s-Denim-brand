import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Star, MessageSquare, Search, Reply, Pencil } from "lucide-react";

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch reviews from Postgres using the Supabase client
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("testimonials") // Matches your database table name
        .select("*");

      if (error) throw error;

      // Maintain sorting: highest rating first, falling back to newest date
      const sorted = (data || []).sort((a, b) => 
        (b.rating || 5) - (a.rating || 5) || 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setItems(sorted);
    } catch (err) {
      console.error("Error loading testimonials:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Handle deleting a testimonial row configuration
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDeleteId(null);
      load();
    } catch (err) {
      console.error("Error removing review:", err.message);
      alert(`Failed to delete record: ${err.message}`);
    }
  };

  // Handle posting or updating an administrative reply string
  const handleReply = async (e) => {
    e.preventDefault();
    setSavingReply(true);
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({
          admin_reply: replyText,
          replied_at: new Date().toISOString()
        })
        .eq("id", replyingTo.id);

      if (error) throw error;

      setReplyingTo(null);
      setReplyText("");
      load();
    } catch (err) {
      console.error("Error saving administrative reply:", err.message);
      alert(`Database constraint error: ${err.message}`);
    } finally {
      setSavingReply(false);
    }
  };

  // Handle saving general modifications (rating edits, text corrections)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({
          name: editForm.name,
          role: editForm.role,
          comment: editForm.comment,
          rating: parseInt(editForm.rating) || 5,
          is_featured: editForm.is_featured === "true" || editForm.is_featured === true
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      setEditForm({});
      load();
    } catch (err) {
      console.error("Error updating review content:", err.message);
      alert(`Failed to save edits: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = items.filter(item =>
    !search ||
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.comment?.toLowerCase().includes(search.toLowerCase()) ||
    item.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="pl-9 bg-muted border-border text-card-foreground rounded-full" />
        </div>
        <div className="text-muted-foreground text-sm font-medium">
          Showing {filtered.length} of {items.length} reviews
        </div>
      </div>

      {/* Review Management List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-card-foreground font-black text-base">{item.name}</h3>
                  <p className="text-muted-foreground text-xs">{item.role || "Verified Customer"}</p>
                </div>
                <div className="flex items-center gap-0.5 bg-accent/10 px-2 py-1 rounded-lg">
                  <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                  <span className="text-accent font-black text-xs">{item.rating || 5}</span>
                </div>
              </div>
              
              <p className="text-card-foreground/90 text-sm italic bg-muted/30 p-3 rounded-xl border border-border/40 mb-3">
                "{item.comment}"
              </p>

              {item.admin_reply && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 mb-3 text-xs">
                  <p className="text-accent font-bold mb-1">D-Kadris Team Reply:</p>
                  <p className="text-card-foreground/80 italic">"{item.admin_reply}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => { setReplyingTo(item); setReplyText(item.admin_reply || ""); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-card-foreground hover:bg-muted/80 text-xs font-bold transition-all">
                  <Reply className="h-3.5 w-3.5" /> {item.admin_reply ? "Edit Reply" : "Reply"}
                </button>
                <button onClick={() => { setEditingItem(item); setEditForm(item); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-card-foreground hover:bg-muted/80 text-xs font-bold transition-all">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {item.is_featured && (
                  <span className="text-[10px] bg-accent text-accent-foreground font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
              <button onClick={() => setDeleteId(item.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="py-16 text-center text-muted-foreground bg-card border border-border rounded-2xl">
          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-25" />
          No testimonials match your criteria.
        </div>
      )}

      {/* Admin Reply Overlay Modal Dialogue Layout */}
      <Dialog open={!!replyingTo} onOpenChange={() => { setReplyingTo(null); setReplyText(""); }}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-md">
          <DialogHeader><DialogTitle className="font-black text-xl">Respond to Review</DialogTitle></DialogHeader>
          {replyingTo && (
            <form onSubmit={handleReply} className="space-y-4 mt-2">
              <div className="bg-muted/40 border border-border rounded-xl p-3 text-sm">
                <p className="font-bold text-card-foreground mb-1">{replyingTo.name}</p>
                <p className="text-muted-foreground italic">"{replyingTo.comment}"</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Your Message Reply</Label>
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Thank you for your valuable response! We craft every denim with care..." className="bg-muted border-border text-card-foreground mt-1 min-h-[110px]" required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={savingReply} className="bg-primary text-primary-foreground font-bold rounded-full px-8 flex-1">
                  {savingReply ? "Saving..." : "Post Reply"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setReplyingTo(null); setReplyText(""); }} className="border-border text-card-foreground rounded-full px-6">Cancel</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Profile Editor Modal Workspace */}
      <Dialog open={!!editingItem} onOpenChange={() => { setEditingItem(null); setEditForm({}); }}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black text-xl">Edit Review Parameters</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Customer Name</Label>
                <Input value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1" required />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Customer Role / Subtitle</Label>
                <Input value={editForm.role || ""} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1" placeholder="e.g. Abuja Client, Tailorix User" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Assigned Rating</Label>
                <select value={editForm.rating || 5} onChange={e => setEditForm(f => ({ ...f, rating: e.target.value }))} className="w-full bg-muted border border-border text-card-foreground text-sm rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-accent/40">
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Review Comment</Label>
                <Textarea value={editForm.comment || ""} onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 min-h-[90px]" required />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Display Status Settings</Label>
                <select value={String(editForm.is_featured ?? false)} onChange={e => setEditForm(f => ({ ...f, is_featured: e.target.value }))} className="w-full bg-muted border border-border text-card-foreground text-sm rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-accent/40">
                  <option value="false">Standard Review Feed</option>
                  <option value="true">Featured Showpiece (Prioritized Display)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={savingEdit} className="bg-accent text-accent-foreground font-bold rounded-full px-8 flex-1">
                  {savingEdit ? "Saving..." : "Update Review"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setEditingItem(null); setEditForm({}); }} className="border-border text-card-foreground rounded-full px-6">Cancel</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Overlay */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <Trash2 className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-card-foreground font-bold text-xl mb-2">Delete Review permanently?</h3>
            <p className="text-muted-foreground mb-6 text-sm">This review will be removed from your store interfaces immediately.</p>
            <div className="flex gap-3">
              <Button onClick={() => handleDelete(deleteId)} className="flex-1 bg-destructive text-destructive-foreground font-bold rounded-full">Delete</Button>
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 border-border text-card-foreground rounded-full">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
