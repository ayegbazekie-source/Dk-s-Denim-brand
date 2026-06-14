import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module location path
import { Input } from "@/components/ui/input";
import { Search, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // Fetch newsletter subscribers using the native Supabase client SDK
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("newsletter_subscribers") // Matches your Postgres table name
        .select("*")
        .order("created_at", { ascending: false }); // Native desc sort configuration

      if (error) throw error;
      setSubs(data || []);
    } catch (err) {
      console.error("Error loading newsletter subscriptions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filter local rows safely based on query inputs
  const filtered = subs.filter(s => 
    !search || 
    s.email?.toLowerCase().includes(search.toLowerCase()) || 
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Permanently delete a subscriber record row
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDeleteId(null);
      load();
    } catch (err) {
      console.error("Error deleting subscriber record:", err.message);
      alert(`Database restriction issue: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subscribers..." className="pl-9 bg-muted border-border text-card-foreground rounded-full" />
        </div>
        <div className="bg-accent/10 text-accent rounded-full px-4 py-2 text-sm font-bold">
          {subs.length} total subscribers
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wide border-b border-border bg-muted/30">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Subscribed Date</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(s => (
              <tr key={s.id} className="text-card-foreground hover:bg-muted/20 transition-colors">
                <td className="p-4 font-medium">{s.email}</td>
                <td className="p-4 text-muted-foreground">{s.name || "—"}</td>
                <td className="p-4 text-muted-foreground text-xs">
                  {s.subscribed_date ? new Date(s.subscribed_date).toLocaleDateString() : "—"}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.is_active !== false ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"}`}>
                    {s.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />No subscribers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <h3 className="text-card-foreground font-bold text-xl mb-4">Remove this subscriber?</h3>
            <div className="flex gap-3">
              <Button onClick={() => handleDelete(deleteId)} className="flex-1 bg-destructive text-destructive-foreground font-bold rounded-full">
                Remove
              </Button>
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 border-border text-card-foreground rounded-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
