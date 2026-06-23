import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Package, Plus, Edit2, Trash2 } from "lucide-react";

const badgeColor = {
  featured: "text-accent bg-accent/10 border border-accent/20",
  new: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
  standard: "text-muted-foreground bg-muted border border-border",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch product profiles from Postgres database ordered by raw creation date descending
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error loading products:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Bar Actions with New "+ Add Product" Integration */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 bg-muted border-border text-card-foreground rounded-full" />
        </div>
        
        <Button 
          onClick={() => alert("Add Product form configuration goes here")} 
          className="bg-primary text-primary-foreground rounded-full font-black h-10 px-5 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Main Table Interface mapped to Custom Denim Parameters */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wide border-b border-border bg-muted/30">
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Badges</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(p => (
              <tr key={p.id} className="text-card-foreground hover:bg-muted/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="max-w-[200px] sm:max-w-xs">
                      <p className="font-bold truncate">{p.name}</p>
                      <p className="text-muted-foreground text-xs truncate">{p.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 capitalize font-medium text-muted-foreground">{p.category || "Jeans"}</td>
                <td className="p-4 font-bold text-primary">₦{(Number(p.price) || 0).toLocaleString()}</td>
                <td className="p-4 font-medium">{p.stock ?? 0} pcs</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {p.is_featured && <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeColor.featured}`}>Featured</span>}
                    {p.is_new_arrival && <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeColor.new}`}>New</span>}
                    {!p.is_featured && !p.is_new_arrival && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeColor.standard}`}>Standard</span>}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setSelected(p)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive/70 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-2 opacity-30" />No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Product Specification Inspect Drawer */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black text-xl">Product Specifications</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Name", selected.name],
                  ["Category", selected.category],
                  ["Price", `₦${(Number(selected.price) || 0).toLocaleString()}`],
                  ["Stock Count", `${selected.stock ?? 0} items`],
                  ["Fabric Type", selected.fabric],
                  ["Fit Profile", selected.fit_type],
                  ["Stretch Level", selected.stretch_level],
                  ["Available Sizes", selected.sizes?.join(", ")],
                  ["Colorways", selected.colors?.join(", ")],
                  ["Created On", selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—"],
                  ["Care Instructions", selected.care_instructions],
                  ["Styling Note", selected.styling_recommendation]
                ].filter(([, v]) => v != null && v !== "").map(([label, value]) => (
                  <div key={label} className="col-span-2 sm:col-span-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
                    <p className="text-card-foreground font-medium mt-0.5">{String(value)}</p>
                  </div>
                ))}
              </div>

              {selected.images && selected.images.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Additional Gallery Media</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selected.images.map((imgUrl, i) => (
                      <img key={i} src={imgUrl} alt={`Gallery view ${i}`} className="w-16 h-16 rounded-lg object-cover bg-muted border border-border flex-shrink-0" />
                    ))}
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
              
