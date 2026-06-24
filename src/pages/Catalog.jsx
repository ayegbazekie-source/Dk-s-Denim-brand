import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Heart, MessageCircle, Star, Package, X, Check, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";

// Import your verified Supabase client
import { supabase } from "@/lib/supabase"; 

// Multi-tier structural mapping config
const CATEGORY_MAP = {
  ALL: [],
  DENIM: ["Jackets", "Jeans", "Cargo", "Shorts", "Jumpsuits"],
  NATIVE: ["Senators", "Agbada", "Kaftans", "Caps"],
  CORPORATE: ["Suits", "Blazers", "Trousers", "Shirts"]
};

const AnimatedElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setIsVisible(true); return; }
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { clearTimeout(fallback); setTimeout(() => setIsVisible(true), delay); observer.unobserve(el); }
    }, { threshold: 0.05 });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  return <div ref={ref} className={`${className} transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>{children}</div>;
};

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("ready");
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);

  // Standard Order Fields
  const [qty, setQty] = useState(1);
  const [chosenSize, setChosenSize] = useState("");
  const [chosenColor, setChosenColor] = useState("");

  // Custom Tailoring Order Fields
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [fitPref, setFitPref] = useState("Regular");
  const [shoulder, setShoulder] = useState("");
  const [chest, setChest] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [topLength, setTopLength] = useState("");
  const [waist, setWaist] = useState("");
  const [thigh, setThigh] = useState("");
  const [jeansLength, setJeansLength] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [orderDone, setOrderDone] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");

  // Reset subcategory on parent category switches
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory("ALL");
  };

  // Fetch Products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*");

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error loading items from products table:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleCustomOrderSubmit = async (e) => {
    e.preventDefault();
    if (!custName || !custPhone) return;

    try {
      const { error } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: custName,
            customer_phone: custPhone,
            customer_email: custEmail,
            product_id: selectedProduct?.id,
            product_name: selectedProduct?.name,
            product_category: selectedProduct?.category,
            quantity: 1,
            total_amount: selectedProduct?.price || 0,
            status: "Pending",
            is_custom_order: true,
            fit_preference: fitPref,
            shoulder,
            chest,
            sleeve,
            top_length: topLength,
            waist,
            thigh,
            jeans_length: jeansLength,
            notes: customNotes,
            affiliate_code: affiliateCode, // Integrated tracking mapping variable
            order_date: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      setOrderDone(true);
    } catch (err) {
      console.error("Error saving custom tailoring order:", err.message);
    }
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    if (activeTab === "ready" && (!chosenSize || !chosenColor)) return;

    const newItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      img: selectedProduct.image_url,
      qty: qty,
      size: activeTab === "custom" ? "Custom Tailored" : chosenSize,
      color: activeTab === "custom" ? "Bespoke Selection" : chosenColor,
      affiliateCode: affiliateCode
    };

    setCartItems(prev => [...prev, newItem]);
    setSelectedProduct(null);
    setCartOpen(true);
    // Reset selection inputs
    setQty(1); setChosenSize(""); setChosenColor(""); setAffiliateCode("");
  };

  const toggleFav = (id) => setFavorites(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // Case-insensitive multi-tier UI parsing filter
  const filtered = products.filter(p => {
    const matchS = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                   p.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchC = selectedCategory === "ALL" || 
                   p.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
                   
    const matchSub = selectedSubcategory === "ALL" || 
                     p.subcategory?.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim();
                     
    return matchS && matchC && matchSub;
  });

  if (sortBy === "PRICE_LOW") filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sortBy === "PRICE_HIGH") filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

  return (
    <div className="bg-background text-foreground min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Banner Section */}
        <AnimatedElement className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-accent/10 text-accent font-bold mb-3 border-accent/20 px-4 py-1 rounded-full text-xs tracking-widest uppercase">The Atelier</Badge>
          <h1 className="text-4xl font-extrabold font-heading tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-accent bg-clip-text text-transparent">D-KADRIS COLLECTIONS</h1>
          <p className="text-muted-foreground font-body text-base">Explore premium custom denim and traditional structural designs crafted for individual dimensions.</p>
        </AnimatedElement>

        {/* Filters and Inputs Layout Container */}
        <div className="flex flex-col mb-10 border border-border/40 p-4 rounded-2xl bg-card/50 backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jeans, jackets, native attires..." className="pl-10 bg-background border-border rounded-xl h-11" />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {["ALL", "DENIM", "NATIVE", "CORPORATE"].map(c => (
                <Button key={c} variant={selectedCategory === c ? "default" : "outline"} onClick={() => handleCategoryChange(c)} className="rounded-xl font-bold text-xs tracking-wider h-11 px-5 flex-shrink-0">
                  {c}
                </Button>
              ))}
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border h-11 rounded-xl font-bold text-xs text-muted-foreground">
                <SelectValue placeholder="Sort Layout" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="DEFAULT">Default Ordering</SelectItem>
                <SelectItem value="PRICE_LOW">Price: Low to High</SelectItem>
                <SelectItem value="PRICE_HIGH">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Secondary Subcategories Layout Row */}
          {selectedCategory !== "ALL" && CATEGORY_MAP[selectedCategory]?.length > 0 && (
            <div className="flex gap-2 w-full overflow-x-auto pt-3 pb-1 border-t border-border/20 mt-4 transition-all duration-300">
              <Button
                variant={selectedSubcategory === "ALL" ? "secondary" : "ghost"}
                onClick={() => setSelectedSubcategory("ALL")}
                className="rounded-lg text-xs h-8 px-3 font-bold uppercase tracking-wider flex-shrink-0"
              >
                All {selectedCategory.toLowerCase()}
              </Button>
              {CATEGORY_MAP[selectedCategory].map(sub => (
                <Button
                  key={sub}
                  variant={selectedSubcategory === sub ? "secondary" : "ghost"}
                  onClick={() => setSelectedSubcategory(sub)}
                  className="rounded-lg text-xs h-8 px-3 font-bold uppercase tracking-wider flex-shrink-0"
                >
                  {sub}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Catalog Grid View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-9 h-9 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">Loading Inventory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-3xl">
            <Package className="h-12 w-14 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-body">No garments matched your filtering parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product, idx) => (
              <AnimatedElement key={product.id} delay={idx * 80} className="group bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-border transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <button onClick={() => toggleFav(product.id)} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center border border-border/50 text-foreground hover:bg-background transition-colors shadow-sm">
                    <Heart className={`h-4 w-4 transition-colors ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                  </button>
                  {product.is_new_arrival && <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-md shadow-sm">New</Badge>}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-accent text-[10px] font-bold tracking-widest uppercase">{product.category}</span>
                      {product.subcategory && (
                        <>
                          <span className="text-muted-foreground/40 text-[9px]">•</span>
                          <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">{product.subcategory}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-amber-500" /><span className="text-xs font-bold text-foreground">5.0</span></div>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-accent transition-colors mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-muted-foreground text-xs font-body line-clamp-2 mb-4 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/40 mt-auto">
                    <span className="text-foreground font-heading font-extrabold text-xl">₦{(product.price || 0).toLocaleString()}</span>
                    <Dialog open={selectedProduct?.id === product.id} onOpenChange={(isOpen) => { if(isOpen) { setSelectedProduct(product); setImageIndex(0); setOrderDone(false); } else { setSelectedProduct(null); } }}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground font-bold text-xs rounded-xl px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300">Quick View</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background border-border max-w-4xl w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden text-foreground">
                        {selectedProduct && (
                          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Left Media Slider */}
                            <div className="w-full md:w-1/2 bg-muted relative flex-shrink-0 min-h-[200px] md:h-full max-h-[30vh] md:max-h-full">
                              <img src={Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? selectedProduct.images[imageIndex] : selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                              {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                                <>
                                  <button onClick={() => setImageIndex(p => p === 0 ? selectedProduct.images.length - 1 : p - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background"><ChevronLeft className="h-4 w-4" /></button>
                                  <button onClick={() => setImageIndex(p => p === selectedProduct.images.length - 1 ? 0 : p + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background"><ChevronRight className="h-4 w-4" /></button>
                                </>
                              )}
                            </div>
                            {/* Right Customization Form */}
                            <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-8">
                              <DialogHeader className="mb-4">
                                <span className="text-accent text-[10px] font-bold tracking-widest uppercase mb-1">{selectedProduct.category} {selectedProduct.subcategory ? `/ ${selectedProduct.subcategory}` : ""}</span>
                                <DialogTitle className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">{selectedProduct.name}</DialogTitle>
                                <span className="text-accent font-heading font-extrabold text-xl mt-1">₦{(selectedProduct.price || 0).toLocaleString()}</span>
                              </DialogHeader>

                              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                                <TabsList className="grid grid-cols-2 w-full bg-muted border border-border/50 rounded-xl p-1 mb-6">
                                  <TabsTrigger value="ready" className="rounded-lg font-bold text-xs tracking-wider">Ready-To-Wear</TabsTrigger>
                                  <TabsTrigger value="custom" className="rounded-lg font-bold text-xs tracking-wider">Bespoke Fitting</TabsTrigger>
                                </TabsList>

                                <TabsContent value="ready" className="space-y-5 mt-0 flex-1 flex flex-col">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Structural Size</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {(Array.isArray(selectedProduct.sizes) ? selectedProduct.sizes : ["30", "32", "34", "36", "38", "M", "L", "XL"]).map(s => (
                                        <button key={s} type="button" onClick={() => setChosenSize(s)} className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${chosenSize === s ? "bg-accent border-accent text-accent-foreground shadow-sm" : "bg-background border-border text-foreground hover:bg-muted"}`}>{s}</button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Finish / Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {(Array.isArray(selectedProduct.colors) ? selectedProduct.colors : ["Indigo Blue", "Raw Black", "Stone Wash", "Charcoal Grey"]).map(c => (
                                        <button key={c} type="button" onClick={() => setChosenColor(c)} className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${chosenColor === c ? "bg-accent border-accent text-accent-foreground shadow-sm" : "bg-background border-border text-foreground hover:bg-muted"}`}>{c}</button>
                                      ))}
                                    </div>
                                  </div>
                      <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</Label>
                                    <div className="flex items-center gap-3 border border-border w-max rounded-xl p-1 bg-background">
                                      <button type="button" onClick={() => setQty(p => Math.max(1, p - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg font-bold text-lg">-</button>
                                      <span className="w-8 text-center font-bold text-sm">{qty}</span>
                                      <button type="button" onClick={() => setQty(p => p + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg font-bold text-lg">+</button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Affiliate Code (Optional)</Label>
                                    <Input value={affiliateCode} onChange={e => setAffiliateCode(e.target.value)} placeholder="e.g. PARTNER10" className="bg-background border-border rounded-lg h-9 text-sm" />
                                  </div>
                                  <Button onClick={addToCart} disabled={!chosenSize || !chosenColor} className="w-full bg-accent text-accent-foreground font-black py-6 rounded-full text-xs tracking-widest uppercase shadow-lg mt-auto">Add to Cart Bag</Button>
                                </TabsContent>

                                <TabsContent value="custom" className="space-y-4 mt-0 flex-1">
                                  {orderDone ? (
                                    <div className="text-center py-8 bg-accent/5 border border-accent/20 rounded-2xl flex flex-col items-center justify-center my-auto">
                                      <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mb-3"><Check className="h-6 w-6" /></div>
                                      <h4 className="font-heading font-bold text-lg text-foreground mb-1">Tailoring Profile Created!</h4>
                                      <p className="text-muted-foreground text-xs max-w-sm px-4 mb-4">Your specific dimensions have been recorded. Our master tailor will review your profile instantly.</p>
                                      <a href={`https://wa.me/2348163914835?text=Hello D-Kadris, I placed a bespoke tailoring order for ${selectedProduct.name}. My name is ${custName}.${affiliateCode ? ` Affiliate Code: ${affiliateCode}` : ""}`} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-accent text-accent-foreground font-bold text-xs rounded-full px-6 py-2"><MessageCircle className="h-4 w-4 mr-2" /> Complete via WhatsApp</Button>
                                      </a>
                                    </div>
                                  ) : (
                                    <form onSubmit={handleCustomOrderSubmit} className="space-y-4 flex-1 flex flex-col">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name *</Label><Input required value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Musa Ibrahim" className="bg-background border-border rounded-lg h-9 text-sm" /></div>
                                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number *</Label><Input required value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="0803 xxxx 789" className="bg-background border-border rounded-lg h-9 text-sm" /></div>
                                      </div>
                                      <div className="space-y-1"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label><Input type="email" value={custEmail} onChange={e=>setCustEmail(e.target.value)} placeholder="client@example.com" className="bg-background border-border rounded-lg h-9 text-sm" /></div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fit Mapping Preference</Label>
                                        <Select value={fitPref} onValueChange={setFitPref}>
                                          <SelectTrigger className="bg-background border-border h-9 rounded-lg text-xs font-bold text-muted-foreground"><SelectValue /></SelectTrigger>
                                          <SelectContent className="bg-background border-border text-foreground">
                                            <SelectItem value="Slim">Slim/Tapered Fit</SelectItem>
                                            <SelectItem value="Regular">Regular Comfort Fit</SelectItem>
                                            <SelectItem value="Oversized">Relaxed/Oversized Fit</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="border border-border/50 bg-muted/30 rounded-xl p-3.5">
                                        <span className="block text-[11px] font-black uppercase tracking-widest text-accent mb-3">Measurement Data (Inches)</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Shoulder</Label><Input value={shoulder} onChange={e=>setShoulder(e.target.value)} placeholder="18" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Chest</Label><Input value={chest} onChange={e=>setChest(e.target.value)} placeholder="40" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Sleeve</Label><Input value={sleeve} onChange={e=>setSleeve(e.target.value)} placeholder="24" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Top Length</Label><Input value={topLength} onChange={e=>setTopLength(e.target.value)} placeholder="30" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Waist Line</Label><Input value={waist} onChange={e=>setWaist(e.target.value)} placeholder="34" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Thigh</Label><Input value={thigh} onChange={e=>setThigh(e.target.value)} placeholder="24" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                          <div className="space-y-1"><Label className="text-[10px] font-medium text-muted-foreground">Length (Bottom)</Label><Input value={jeansLength} onChange={e=>setJeansLength(e.target.value)} placeholder="42" className="bg-background border-border rounded-lg h-8 text-xs text-center" /></div>
                                        </div>
                                      </div>

                                      <div className="space-y-1"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Styling Variations / Specific Instructions</Label><Textarea value={customNotes} onChange={e=>setCustomNotes(e.target.value)} placeholder="Describe specific cuts, pockets style variations, contrast thread preferences..." className="bg-background border-border rounded-xl text-xs h-16 resize-none" /></div>
                                      
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Affiliate Code (Optional)</Label>
                                        <Input value={affiliateCode} onChange={e => setAffiliateCode(e.target.value)} placeholder="e.g. PARTNER10" className="bg-background border-border rounded-lg h-9 text-sm" />
                                      </div>

                                      <Button type="submit" className="w-full bg-accent text-accent-foreground font-black py-5 rounded-full text-xs tracking-widest uppercase shadow-lg mt-auto">Order Now</Button>
                                    </form>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </AnimatedElement>
            ))}
          </div>
        )}

        {/* Cart Bag Drawer Sidebar */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-heading font-bold text-lg"><ShoppingBag className="h-5 w-5 text-accent" /><span>Your Cart Bag ({cartItems.length})</span></div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground font-body text-sm">Your styling bag is currently empty.</div>
                ) : (
                  cartItems.map((item, i) => (
                    <div key={i} className="flex gap-4 border border-border/40 p-3 rounded-xl bg-background/50 items-center">
                      <img src={item.img} alt={item.name} className="w-16 h-20 object-cover rounded-lg bg-muted flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-heading font-bold text-sm text-foreground line-clamp-1">{item.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Size: {item.size} | Color: {item.color}</p>
                        {item.affiliateCode && <p className="text-[10px] text-accent">Affiliate: {item.affiliateCode}</p>}
                        <span className="text-accent font-heading font-bold text-sm block mt-1">₦{(item.price || 0).toLocaleString()} x {item.qty}</span>
                      </div>
                      <button onClick={() => setCartItems(p => p.filter((_, j) => j !== i))} className="text-muted-foreground/50 hover:text-foreground p-1"><X className="h-4 w-4" /></button>
                    </div>
                  ))
                )}
              </div>
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-border bg-muted/20">
                  <div className="flex justify-between text-foreground font-heading font-bold mb-4 text-lg">
                    <span>Total Subtotal</span>
                    <span className="text-accent">₦{cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0).toLocaleString()}</span>
                  </div>
                  <a href={`https://wa.me/2348163914835?text=Hello D-Kadris, I want to checkout the following from my cart:\n\n${cartItems.map(i => `- ${i.name} (${i.size}, ${i.color}) x${i.qty}${i.affiliateCode ? ` [Code: ${i.affiliateCode}]` : ""}`).join("\n")}\n\nTotal: ₦${cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0).toLocaleString()}`} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-accent text-accent-foreground font-black rounded-full py-6 tracking-widest uppercase text-xs shadow-lg hover:scale-[1.02] transition-all">
                      <MessageCircle className="mr-2 h-4 w-4" /> Checkout via WhatsApp
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Contact WhatsApp */}
        <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-accent text-accent-foreground rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300">
          <MessageCircle className="h-6 w-6" />
        </a>

      </div>
    </div>
  );
                                        }
