import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Package, Plus, Edit2, Trash2, Upload, Loader2 } from "lucide-react";

const badgeColor = {
  featured: "text-accent bg-accent/10 border border-accent/20",
  new: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
  standard: "text-muted-foreground bg-muted border border-border",
};

const initialFormState = {
  name: "",
  price: "",
  stock: "",
  category: "Jeans",
  fit_type: "",
  fabric: "",
  stretch_level: "",
  image_url: "",
  description: "",
  sizes: "",
  colors: "",
  tags: "",
  is_featured: false,
  is_new_arrival: false,
  care_instructions: "",
  styling_recommendation: ""
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  
  // Form Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  // AUTOMATED PHONE GALLERY UPLOADER ROUTINE
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);

      // Create a unique file name to avoid collisions
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-catalog/${fileName}`;

      // Upload file directly to the Supabase 'products' storage bucket
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Retrieve the public address/URL link of the asset
      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      // Save URL to the reactive product state engine
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      console.error("Storage upload exception:", err.message);
      alert(`Gallery upload failed: ${err.message}\nMake sure a public storage bucket named 'products' exists in your Supabase panel.`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      fit_type: formData.fit_type || null,
      fabric: formData.fabric || null,
      stretch_level: formData.stretch_level || null,
      image_url: formData.image_url || null,
      description: formData.description || null,
      sizes: formData.sizes ? formData.sizes.split(",").map(s => s.trim()) : [],
      colors: formData.colors ? formData.colors.split(",").map(c => c.trim()) : [],
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      is_featured: formData.is_featured,
      is_new_arrival: formData.is_new_arrival,
      care_instructions: formData.care_instructions || null,
      styling_recommendation: formData.styling_recommendation || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert([payload]);
        if (error) throw error;
      }

      setIsFormOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      load();
    } catch (err) {
      console.error("Form handling exception:", err.message);
      alert(`Error saving product: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || "Jeans",
      fit_type: product.fit_type || "",
      fabric: product.fabric || "",
      stretch_level: product.stretch_level || "",
      image_url: product.image_url || "",
      description: product.description || "",
      sizes: product.sizes ? product.sizes.join(", ") : "",
      colors: product.colors ? product.colors.join(", ") : "",
      tags: product.tags ? product.tags.join(", ") : "",
      is_featured: product.is_featured || false,
      is_new_arrival: product.is_new_arrival || false,
      care_instructions: product.care_instructions || "",
      styling_recommendation: product.styling_recommendation || ""
    });
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to completely remove this product from your catalog?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (err) {
      alert(`Delete operation failed: ${err.message}`);
    }
  };

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 bg-muted border-border text-card-foreground rounded-full" />
        </div>
        
        <Button 
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormState);
            setIsFormOpen(true);
          }} 
          className="bg-primary text-primary-foreground rounded-full font-black h-10 px-5 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Main Table Interface */}
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
                    <button onClick={() => handleEditClick(p)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive/70 hover:text-destructive">
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

      {/* RENDER FORM DOCK POPUP */}
      <Dialog open={isFormOpen} onOpenChange={(open) => setIsFormOpen(open)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">{editingId ? "Edit Product Details" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Product Name</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. D-Kadris Signature Jacket" className="bg-muted border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Price (₦)</label>
                <Input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="45000" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Stock Qty</label>
                <Input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="15" className="bg-muted border-border" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 bg-muted border border-border rounded-md text-sm text-card-foreground focus:outline-none">
                  {['Jackets', 'Jeans', 'Cargo', 'Shirts', 'Shorts', 'Jumpsuits'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Fit Type</label>
                <Input value={formData.fit_type} onChange={e => setFormData({...formData, fit_type: e.target.value})} placeholder="Slim Fit, Regular, Boxy" className="bg-muted border-border" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Fabric</label>
                <Input value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} placeholder="Raw Denim, 100% Cotton Stretch" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Stretch Level</label>
                <Input value={formData.stretch_level} onChange={e => setFormData({...formData, stretch_level: e.target.value})} placeholder="Non-Stretch, Medium Stretch" className="bg-muted border-border" />
              </div>
            </div>

            {/* GALLERIES UPLOADER BUTTON COMPONENT */}
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Product Media Image</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input readonly value={formData.image_url} placeholder="No asset uploaded yet..." className="bg-muted border-border pr-10" />
                  {formData.image_url && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-border overflow-hidden bg-muted">
                      <img src={formData.image_url} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <label className="h-10 px-4 rounded-md bg-muted border border-border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer hover:bg-muted/70 text-card-foreground shrink-0 transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingImage ? "Uploading..." : "Choose Image"}
                  <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Provide structural styling details..." className="w-full h-20 p-3 bg-muted border border-border rounded-md text-sm text-card-foreground focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Sizes (Comma-Separated)</label>
                <Input value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} placeholder="S, M, L, XL" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Colors (Comma-Separated)</label>
                <Input value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} placeholder="Black, Indigo, Blue" className="bg-muted border-border" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Tags (Comma-Separated)</label>
              <Input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="featured, new-arrival" className="bg-muted border-border" />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground cursor-pointer">
                <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} className="rounded border-border bg-muted accent-primary" />
                Featured Product
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground cursor-pointer">
                <input type="checkbox" checked={formData.is_new_arrival} onChange={e => setFormData({...formData, is_new_arrival: e.target.checked})} className="rounded border-border bg-muted accent-primary" />
                New Arrival
              </label>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Care Instructions</label>
              <Input value={formData.care_instructions} onChange={e => setFormData({...formData, care_instructions: e.target.value})} placeholder="Machine wash cold, turn inside out" className="bg-muted border-border" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wide block mb-1">Styling Recommendation</label>
              <Input value={formData.styling_recommendation} onChange={e => setFormData({...formData, styling_recommendation: e.target.value})} placeholder="Pairs best with D-Kadris Raw Hem Shorts" className="bg-muted border-border" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-full font-bold">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground rounded-full font-black px-6 shadow-md">
                {submitting ? "Saving..." : editingId ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Specifications Inspect View Drawer */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
