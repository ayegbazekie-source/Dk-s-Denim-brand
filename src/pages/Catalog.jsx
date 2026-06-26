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
import { Search, Heart, MessageCircle, Star, Package, X, Check, ShoppingBag } from "lucide-react";

// Import your verified Supabase client
import { supabase } from "@/lib/supabase";

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
  
  // App-wide Status & Cart States
  const [dbSubmitting, setDbSubmitting] = useState(false);
  const [dbError, setDbError] = useState(null);
  
  // Persistence Implementation for Guest Sessions
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("dkadris_guest_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);

  // Ready To Wear States
  const [qty, setQty] = useState(1);
  const [chosenSize, setChosenSize] = useState("");
  const [chosenColor, setChosenColor] = useState("");

  // Bespoke Fitting States
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

  // Write variations down to localStorage storage context mirrors safely
  useEffect(() => {
    localStorage.setItem("dkadris_guest_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle checking for active clearing countdown flags upon app-load mount
  useEffect(() => {
    const clearTimeStamp = localStorage.getItem("dkadris_cart_expiry");
    if (clearTimeStamp) {
      const remaining = parseInt(clearTimeStamp, 10) - Date.now();
      if (remaining <= 0) {
        setCartItems([]);
        localStorage.removeItem("dkadris_guest_cart");
        localStorage.removeItem("dkadris_cart_expiry");
      } else {
        const timer = setTimeout(() => {
          setCartItems([]);
          localStorage.removeItem("dkadris_guest_cart");
          localStorage.removeItem("dkadris_cart_expiry");
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const triggerCartExpiryCountdown = () => {
    const fiveMinutes = 5 * 60 * 1000;
    const expiryTime = Date.now() + fiveMinutes;
    localStorage.setItem("dkadris_cart_expiry", expiryTime.toString());
    
    setTimeout(() => {
      setCartItems([]);
      localStorage.removeItem("dkadris_guest_cart");
      localStorage.removeItem("dkadris_cart_expiry");
    }, fiveMinutes);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory("ALL");
  };

  const handleProceedToBespoke = () => {
    setActiveTab("custom");
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("products").select("*");
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error loading products:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleCustomOrderSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    setDbSubmitting(true);
    setDbError(null); 
    
    const calculatedTotal = (selectedProduct?.price || 0) * qty;
    const unifiedItem = {
      id: selectedProduct?.id,
      name: selectedProduct?.name,
      price: selectedProduct?.price,
      img: selectedProduct?.image_url,
      qty: qty,
      size: chosenSize || "Bespoke Custom", 
      color: chosenColor || `Fit: ${fitPref}`, 
      affiliateCode: affiliateCode,
      isCustom: true,
      fitPreference: fitPref,
      measurements: {
        client: custName,
        phone: custPhone,
        email: custEmail,
        shoulder, chest, sleeve, topLength, waist, thigh, jeansLength,
        notes: customNotes
      }
    };

    try {
      // Synchronize database inserting with the keys expected by AdminOrders.jsx
      const { data, error } = await supabase.from("orders").insert([
        {
          customer_name: custName,
          customer_phone: custPhone,
          customer_email: custEmail,
          total_amount: calculatedTotal, 
          status: "pending", 
          items: [unifiedItem], 
          affiliate_code: affiliateCode || null,
          created_at: new Date().toISOString()
        }
      ]).select();

      if (error) throw error;

      setCartItems(prev => {
        const cleaned = prev.filter(item => item.id !== selectedProduct?.id);
        return [...cleaned, unifiedItem];
      });
      setOrderDone(true);

      // Clear fields safely
      setCustName(""); setCustPhone(""); setCustEmail(""); setCustomNotes("");
      setShoulder(""); setChest(""); setSleeve(""); setTopLength(""); setWaist(""); setThigh("");
      setJeansLength(""); setChosenSize(""); setChosenColor(""); setQty(1); setAffiliateCode("");
    } catch (err) {
      console.error("Database connection panel error:", err.message);
      setDbError(err.message || "Failed to sync order with database.");
    } finally {
      setDbSubmitting(false);
    }
  };

  const toggleFav = (id) => setFavorites(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filtered = products.filter(p => {
    const matchS = p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchC = selectedCategory === "ALL" || p.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    const matchSub = selectedSubcategory === "ALL" || p.subcategory?.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim();
    return matchS && matchC && matchSub;
  });

  if (sortBy === "PRICE_LOW") filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sortBy === "PRICE_HIGH") filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

  return (
    <div className="bg-[#0F1E36] text-white min-h-screen pt-24 pb-16 px-4 sm:px-6 relative">
      
      <button 
        onClick={() => setCartOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all"
      >
        <div className="relative">
          <ShoppingBag className="h-6 w-6 stroke-[2.5]" />
          {cartItems.length > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow-md">
              {cartItems.length}
            </span>
          )}
        </div>
      </button>

      <div className="max-w-7xl mx-auto">
        <AnimatedElement className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-amber-500/10 text-amber-400 font-bold mb-3 border-amber-500/20 px-4 py-1 rounded-full text-xs tracking-widest uppercase">The Atelier</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 text-white">D-KADRIS COLLECTIONS</h1>
          <p className="text-slate-400 text-base">Explore premium custom denim and traditional structural designs crafted for individual dimensions.</p>
        </AnimatedElement>

        <div className="flex flex-col mb-10 border border-slate-800 p-4 rounded-2xl bg-[#16253D] shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jeans, jackets, native attires..." className="pl-10 bg-[#0F1E36] border-slate-700 text-white placeholder-slate-500 rounded-xl h-11" />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {["ALL", "DENIM", "NATIVE", "CORPORATE"].map(c => (
                <Button key={c} variant={selectedCategory === c ? "default" : "outline"} onClick={() => handleCategoryChange(c)} className={`rounded-xl font-bold text-xs tracking-wider h-11 px-5 ${selectedCategory === c ? "bg-amber-500 text-slate-950" : "border-slate-700 text-slate-300"}`}>
                  {c}
                </Button>
              ))}
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-[#0F1E36] border-slate-700 h-11 rounded-xl font-bold text-xs text-slate-300">
                <SelectValue placeholder="Sort Layout" />
              </SelectTrigger>
              <SelectContent className="bg-[#16253D] border-slate-800 text-white">
                <SelectItem value="DEFAULT">Default Ordering</SelectItem>
                <SelectItem value="PRICE_LOW">Price: Low to High</SelectItem>
                <SelectItem value="PRICE_HIGH">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedCategory !== "ALL" && CATEGORY_MAP[selectedCategory]?.length > 0 && (
            <div className="flex gap-2 w-full overflow-x-auto pt-3 pb-1 border-t border-slate-800 mt-4">
              <Button variant={selectedSubcategory === "ALL" ? "secondary" : "ghost"} onClick={() => setSelectedSubcategory("ALL")} className="rounded-lg text-xs h-8 px-3 font-bold uppercase tracking-wider text-white">
                All {selectedCategory.toLowerCase()}
              </Button>
              {CATEGORY_MAP[selectedCategory].map(sub => (
                <Button key={sub} variant={selectedSubcategory === sub ? "secondary" : "ghost"} onClick={() => setSelectedSubcategory(sub)} className="rounded-lg text-xs h-8 px-3 font-bold uppercase tracking-wider text-slate-300">
                  {sub}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-9 h-9 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Loading Inventory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl">
            <Package className="h-12 w-14 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No garments matched your filtering parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filtered.map((product, idx) => (
              <AnimatedElement key={product.id} delay={idx * 80} className="group bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200 flex flex-col h-full transition-all hover:-translate-y-1">
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <button onClick={() => toggleFav(product.id)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-slate-200 text-slate-900 shadow-sm">
                    <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
                  </button>
                  {product.is_new_arrival && <Badge className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-md">New</Badge>}
                </div>
                
                <div className="p-3.5 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-amber-600 text-[10px] font-black tracking-widest uppercase">{product.category}</span>
                    {product.subcategory && <span className="text-slate-900 text-[10px] font-bold uppercase">• {product.subcategory}</span>}
                  </div>
                  
                  <h3 className="font-bold text-slate-950 text-sm sm:text-base tracking-tight mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-slate-600 text-xs line-clamp-2 mb-3 min-h-[2rem]">{product.description}</p>
                  
                  {/* Fixed responsive layout wraps items seamlessly without cropping */}
                  <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-slate-100">
                    <span className="text-amber-600 font-extrabold text-base sm:text-lg">₦{(product.price || 0).toLocaleString()}</span>
                    
                    <Dialog open={selectedProduct?.id === product.id} onOpenChange={(isOpen) => { if(isOpen) { setSelectedProduct(product); setImageIndex(0); setOrderDone(false); setActiveTab("ready"); } else { setSelectedProduct(null); } }}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl h-9 px-4 transition-all whitespace-nowrap">Quick View</Button>
                      </DialogTrigger>
            
                      <DialogContent className="bg-[#111F38] border-slate-800 max-w-4xl w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden text-white">
                        {selectedProduct && (
                          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            <div className="w-full md:w-1/2 bg-slate-950 relative flex-shrink-0 h-48 md:h-full max-h-[25vh] md:max-h-full">
                              <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover object-top" />
                            </div>
                    
                            <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-8">
                              <DialogHeader className="mb-4">
                                <span className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-1">{selectedProduct.category} {selectedProduct.subcategory ? `/ ${selectedProduct.subcategory}` : ""}</span>
                                <DialogTitle className="font-extrabold text-2xl text-white">{selectedProduct.name}</DialogTitle>
                                <span className="text-amber-400 font-extrabold text-xl mt-1">₦{(selectedProduct.price || 0).toLocaleString()}</span>
                              </DialogHeader>

                              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                                <TabsList className="grid grid-cols-2 w-full bg-[#091324] border border-slate-800 rounded-xl p-1 mb-5">
                                  <TabsTrigger value="ready" className="rounded-lg font-bold text-xs tracking-wider">1. Base Selection</TabsTrigger>
                                  <TabsTrigger value="custom" className="rounded-lg font-bold text-xs tracking-wider">2. Bespoke Details</TabsTrigger>
                                </TabsList>

                                <TabsContent value="ready" className="space-y-4 flex-1 flex flex-col">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Select Size</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(Array.isArray(selectedProduct.sizes) ? selectedProduct.sizes : ["30", "32", "34", "36", "38", "M", "L", "XL"]).map(s => (
                                        <button key={s} type="button" onClick={() => setChosenSize(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${chosenSize === s ? "bg-white text-slate-950 border-white" : "bg-[#091324] border-slate-800 text-slate-300"}`}>{s}</button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Select Finish</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(Array.isArray(selectedProduct.colors) ? selectedProduct.colors : ["Indigo Blue", "Raw Black", "Stone Wash", "Burgundy"]).map(c => (
                                        <button key={c} type="button" onClick={() => setChosenColor(c)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${chosenColor === c ? "bg-white text-slate-950 border-white" : "bg-[#091324] border-slate-800 text-slate-300"}`}>{c}</button>
                                      ))}
               </div>
                                  </div>
                   
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Quantity</Label>
                                    <div className="flex items-center gap-3 border border-slate-800 w-max rounded-xl p-1 bg-[#091324]">
                                      <button type="button" onClick={() => setQty(p => Math.max(1, p - 1))} className="w-8 h-8 hover:bg-slate-800 rounded-lg font-bold text-lg">-</button>
                                      <span className="w-8 text-center font-bold text-sm">{qty}</span>
                                      <button type="button" onClick={() => setQty(p => p + 1)} className="w-8 h-8 hover:bg-slate-800 rounded-lg font-bold text-lg">+</button>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Affiliate Code (Optional)</Label>
                                    <Input value={affiliateCode} onChange={e => setAffiliateCode(e.target.value)} placeholder="e.g. PARTNER10" className="bg-[#091324] border-slate-700 rounded-xl h-10 text-sm text-white placeholder-slate-600" />
                                  </div>

                                  {/* Faded white Garment Manual specification panel section */}
                                  <div className="mt-4 space-y-3 border-t border-slate-800/80 pt-4">
                                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-amber-400">Garment Blueprint Manual</h4>
                                    <div className="text-slate-400 text-xs leading-relaxed space-y-2">
                                      <p><span className="text-slate-300 font-medium">Description:</span> {selectedProduct.description || "Premium tailor-crafted bespoke garment collection blueprint."}</p>
                                      <p><span className="text-slate-300 font-medium">Fabric Type:</span> {selectedProduct.fabric_details || "Authentic heavy-duty raw denim composition weave."}</p>
                                      <p><span className="text-slate-300 font-medium">Style Guide:</span> {selectedProduct.styling_recommendations || "Pairs optimally with custom luxury panel shirts and leather footwear variants."}</p>
                                      <p><span className="text-slate-300 font-medium">Care Parameters:</span> {selectedProduct.care_instructions || "Turn inside out before cold machine washing cycles. Air dry safely."}</p>
                                    </div>
                                  </div>

                                  <Button onClick={handleProceedToBespoke} disabled={!chosenSize || !chosenColor} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-5 rounded-xl text-xs tracking-widest uppercase shadow-lg mt-auto">Add & Continue to Bespoke Fitting</Button>
                                </TabsContent>

                                <TabsContent value="custom" className="space-y-4 flex-1">
                                  {orderDone ? (
                                    <div className="text-center py-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col items-center justify-center animate-fadeIn">
                                      <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mb-3"><Check className="h-6 w-6 stroke-[3]" /></div>
                                      <h4 className="font-bold text-lg text-white mb-1">Order Submitted Successfully!</h4>
                                      <p className="text-amber-400 text-xs font-black max-w-xs px-4 mb-5 uppercase tracking-wider">Go to your cart bag to checkout via WhatsApp!</p>
                                      <Button onClick={() => { setSelectedProduct(null); setCartOpen(true); }} className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl px-6 py-2.5">Open Cart Bag</Button>
                                    </div>
                                  ) : (
                                    <form onSubmit={handleCustomOrderSubmit} className="space-y-4 flex-1 flex flex-col">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Full Name *</Label><Input required value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Musa Ibrahim" className="bg-[#091324] border-slate-700 rounded-xl h-10 text-sm text-white placeholder-slate-600" /></div>
                                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Phone Number *</Label><Input required value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="0803 xxxx 789" className="bg-[#091324] border-slate-700 rounded-xl h-10 text-sm text-white placeholder-slate-600" /></div>
                                      </div>
                                      <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Email Address</Label><Input type="email" value={custEmail} onChange={e=>setCustEmail(e.target.value)} placeholder="client@example.com" className="bg-[#091324] border-slate-700 rounded-xl h-10 text-sm text-white placeholder-slate-600" /></div>
                                    
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Fit Mapping Preference</Label>
                                        <Select value={fitPref} onValueChange={setFitPref}>
                                          <SelectTrigger className="bg-[#091324] border-slate-700 h-10 rounded-xl text-xs font-bold text-slate-300"><SelectValue /></SelectTrigger>
                                          <SelectContent className="bg-[#16253D] border-slate-800 text-white">
                                            <SelectItem value="Slim">Slim/Tapered Fit</SelectItem>
                                            <SelectItem value="Regular">Regular Comfort Fit</SelectItem>
                                            <SelectItem value="Oversized">Relaxed/Oversized Fit</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="border border-slate-800 bg-[#091324] rounded-xl p-3.5">
                                        <span className="block text-[11px] font-black uppercase tracking-widest text-amber-400 mb-3">Measurement Data (Inches)</span>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                          {[["Shoulder", shoulder, setShoulder, "18"], ["Chest", chest, setChest, "40"], ["Sleeve", sleeve, setSleeve, "24"], ["Top Length", topLength, setTopLength, "30"], ["Waist Line", waist, setWaist, "34"], ["Thigh", thigh, setThigh, "24"], ["Length", jeansLength, setJeansLength, "42"]].map(([lbl, val, setVal, ph]) => (
                                            <div key={lbl} className="bg-[#111F38] border border-slate-800 p-1.5 rounded-lg">
                                              <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1 truncate">{lbl}</span>
                                              <input value={val} onChange={e=>setVal(e.target.value)} placeholder={ph} className="w-full bg-transparent text-center font-extrabold text-white placeholder-slate-700 text-xs focus:outline-none" />
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Styling Variations</Label><Textarea value={customNotes} onChange={e=>setCustomNotes(e.target.value)} placeholder="Describe cuts, pocket options..." className="bg-[#091324] border-slate-700 rounded-xl text-xs h-14 resize-none text-white placeholder-slate-600" /></div>

                                      {dbError && (
                                        <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-xl font-bold my-2 tracking-wide text-left">
                                          ⚠️ Database Error: {dbError}
                                        </div>
                                      )}

                                      <Button 
                                        type="submit" 
                                        disabled={dbSubmitting} 
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-5 rounded-xl text-xs tracking-widest uppercase shadow-lg mt-4"
                                      >
                                        {dbSubmitting ? "Syncing Admin Panel..." : "Order Now"}
                                      </Button>
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

        {cartOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-[#111F38] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#091324]">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <ShoppingBag className="h-5 w-5 text-amber-400" />
                  <span>Your Cart Bag ({cartItems.length})</span>
                </div>
                <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-xl bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">Your styling bag is currently empty.</div>
                ) : (
                  cartItems.map((item, i) => (
                    <div key={i} className="flex gap-4 border border-slate-800 p-3.5 rounded-xl bg-[#091324] items-center shadow-inner">
                      <img src={item.img} alt={item.name} className="w-16 h-20 object-cover rounded-lg bg-slate-950 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Size: {item.size} | Color: {item.color} | Qty: {item.qty}</p>
                        <p className="text-[10px] text-amber-400 font-bold">Custom Bespoke Profile Linked</p>
                        {item.affiliateCode && <p className="text-[10px] text-amber-400 font-bold">Affiliate: {item.affiliateCode}</p>}
                        <span className="text-amber-400 font-extrabold text-sm block mt-1">₦{((item.price || 0) * item.qty).toLocaleString()}</span>
                      </div>
                      <button onClick={() => setCartItems(p => p.filter((_, j) => j !== i))} className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-red-900/60 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all">
                        <X className="h-4 w-4 stroke-[2]" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-800 bg-[#091324]">
                  <div className="flex justify-between text-white font-bold mb-5 text-lg">
                    <span>Total Subtotal</span>
                    <span className="text-amber-400 font-black">₦{cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0).toLocaleString()}</span>
                  </div>
                  
                  <a 
                    onClick={triggerCartExpiryCountdown}
                    href={`https://wa.me/2348163914835?text=${encodeURIComponent(
                      `*D-KADRIS BESPOKE ORDER*\n` +
                      `----------------------------------\n\n` +
                      cartItems.map(item => {
                        let block = `👕 *Garment:* ${item.name}\n` +
                                    `🎨 *Finish:* ${item.color} | *Size:* ${item.size} | *Qty:* ${item.qty}\n`;
                        
                        if (item.isCustom && item.measurements) {
                          block += `\n👤 *Client:* ${item.measurements.client}\n` +
                                   `📞 *Phone:* ${item.measurements.phone}\n` +
                                   `⚙️ *Fit Mapping:* ${item.fitPreference}\n\n` +
                                   `*MEASUREMENT PROFILE (Inches)*\n`;
                          
                          const measurementLabels = [
                            ["Shoulder", item.measurements.shoulder],
                            ["Chest", item.measurements.chest],
                            ["Sleeve", item.measurements.sleeve],
                            ["Top Length", item.measurements.topLength],
                            ["Waist Line", item.measurements.waist],
                            ["Thigh", item.measurements.thigh],
                            ["Length", item.measurements.jeansLength]
                          ];

                          const activeMeasurements = measurementLabels
                            .filter(([_, val]) => val && val.trim() !== "")
                            .map(([lbl, val]) => `• ${lbl}: ${val}"`);

                          if (activeMeasurements.length > 0) {
                            block += activeMeasurements.join("\n") + `\n`;
                          } else {
                            block += `• No custom sizing parameters added\n`;
                          }

                          if (item.measurements.notes && item.measurements.notes.trim() !== "") {
                            block += `\n📌 *Styling Variations:* ${item.measurements.notes}\n`;
                          }
                        }

                        if (item.affiliateCode && item.affiliateCode.trim() !== "") {
                          block += `\n🎟️ *Affiliate Tracking:* ${item.affiliateCode}\n`;
                        }

                        return block;
                      }).join("\n----------------------------------\n\n") +
                      `\n----------------------------------\n` +
                      `💰 *Total Gross:* ₦${cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0).toLocaleString()}`
                    )}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl py-6 tracking-widest uppercase text-xs shadow-xl transition-all">
                      <MessageCircle className="mr-2 h-4 w-4 stroke-[2.5]" /> Checkout via WhatsApp
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all">
          <MessageCircle className="h-6 w-6 fill-white text-emerald-500" />
        </a>
      </div>
    </div>
  );
                                  }
