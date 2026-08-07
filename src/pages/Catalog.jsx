import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Package, 
  X, 
  Check, 
  ShoppingBag, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Shirt
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const CATEGORY_MAP = {
  DENIM: ["ALL", "Jackets", "Jeans", "Cargo", "Shorts", "Jumpsuits"],
  NATIVE: ["ALL", "Senators", "Kaftans", "Jalabia", "Caps"],
  CORPORATE: ["ALL", "Trousers", "Shirts"],
  PREMIUM: ["ALL", "Suits", "Bespoke Jackets"]
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
  const [selectedCategory, setSelectedCategory] = useState("DENIM");
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("ready");
  
  // Lightbox & Magnification states
  const [lightboxImage, setLightboxImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [dbSubmitting, setDbSubmitting] = useState(false);
  const [dbError, setDbError] = useState(null);
  
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("dkadris_guest_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [qty, setQty] = useState(1);
  const [chosenSize, setChosenSize] = useState("");
  const [chosenColor, setChosenColor] = useState("");

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
  
  const [affiliateCode, setAffiliateCode] = useState(() => {
    return localStorage.getItem("dkadris_affiliate_ref") || "";
  });

  // Intercept browser back button when any modal or drawer is open
  useEffect(() => {
    const handlePopState = () => {
      if (lightboxImage) {
        setLightboxImage(null);
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
      } else if (cartOpen) {
        setCartOpen(false);
      } else if (selectedProduct) {
        setSelectedProduct(null);
      }
    };

    if (cartOpen || selectedProduct || lightboxImage) {
      window.history.pushState({ modalOpen: true }, "");
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [cartOpen, selectedProduct, lightboxImage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) {
      const sanitizedCode = refParam.trim().toUpperCase();
      localStorage.setItem("dkadris_affiliate_ref", sanitizedCode);
      setAffiliateCode(sanitizedCode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dkadris_guest_cart", JSON.stringify(cartItems));
  }, [cartItems]);

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
    const activeRefCode = affiliateCode || localStorage.getItem("dkadris_affiliate_ref") || "";
    const cleanAffiliateCode = activeRefCode ? activeRefCode.trim().toUpperCase() : null;

    const unifiedItem = {
      id: selectedProduct?.id,
      name: selectedProduct?.name,
      price: selectedProduct?.price,
      img: selectedProduct?.image_url,
      qty: qty,
      size: chosenSize || "Bespoke Custom", 
      color: chosenColor || `Fit: ${fitPref}`, 
      affiliateCode: cleanAffiliateCode,
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
      const { error } = await supabase.from("orders").insert([
        {
          customer_name: custName,
          customer_phone: custPhone,
          customer_email: custEmail,
          total_amount: calculatedTotal, 
          status: "pending", 
          items: [unifiedItem], 
          affiliate_code: cleanAffiliateCode,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setCartItems(prev => {
        const cleaned = prev.filter(item => item.id !== selectedProduct?.id);
        return [...cleaned, unifiedItem];
      });
      setOrderDone(true);

      setCustName(""); setCustPhone(""); setCustEmail(""); setCustomNotes("");
      setShoulder(""); setChest(""); setSleeve(""); setTopLength(""); setWaist(""); setThigh("");
      setJeansLength(""); setChosenSize(""); setChosenColor(""); setQty(1);

      setTimeout(() => {
        setOrderDone(false);
        setSelectedProduct(null);
        setCartOpen(true);
      }, 180000);

    } catch (err) {
      console.error("Database error:", err.message);
      setDbError(err.message || "Failed to sync order.");
    } finally {
      setDbSubmitting(false);
    }
  };

  const toggleFav = (id) => setFavorites(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const openProductFromCart = (itemId) => {
    const targetProduct = products.find(p => p.id === itemId);
    if (targetProduct) {
      setCartOpen(false);
      setSelectedProduct(targetProduct);
      setActiveTab("ready");
    }
  };

  // Zoom & Drag Handlers (Mouse + Touch)
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.75, 4));
  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(prev - 0.75, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleStartDrag = (clientX, clientY) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: clientX - panOffset.x, y: clientY - panOffset.y };
  };

  const handleMoveDrag = (clientX, clientY) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanOffset({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y
    });
  };

  const handleEndDrag = () => setIsDragging(false);

  const filtered = products.filter(p => {
    const matchS = p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchC = p.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    const matchSub = selectedSubcategory === "ALL" || p.subcategory?.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim();
    return matchS && matchC && matchSub;
  });

  if (sortBy === "PRICE_LOW") filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sortBy === "PRICE_HIGH") filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

  return (
    <div className="bg-[#0F1E36] text-white min-h-screen pt-20 pb-16 px-3 sm:px-6 relative selection:bg-amber-500 selection:text-slate-950">
      
      {/* Floating Cart Button */}
      <button 
        onClick={() => setCartOpen(true)}
        className="fixed bottom-8 right-6 z-40 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all"
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

      <div className="max-w-[1400px] mx-auto">
        <AnimatedElement className="text-center max-w-2xl mx-auto mb-8">
          <Badge className="bg-amber-500/10 text-amber-400 font-bold mb-2 border-amber-500/20 px-3 py-1 rounded-full text-xs tracking-widest uppercase">The Atelier</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2 text-white">D-KADRIS COLLECTIONS</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Explore premium custom denim and traditional structural designs crafted for individual dimensions.</p>
        </AnimatedElement>

        {/* Filter Controls Bar */}
        <div className="flex flex-col mb-8 border border-slate-800 p-3 sm:p-4 rounded-2xl bg-[#16253D] shadow-2xl">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jeans, jackets..." className="pl-10 bg-[#0F1E36] border-slate-700 text-white placeholder-slate-500 rounded-xl h-10 text-xs" />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {Object.keys(CATEGORY_MAP).map(c => (
                <Button 
                  key={c} 
                  type="button"
                  onClick={() => { setSelectedCategory(c); setSelectedSubcategory("ALL"); }} 
                  className={`rounded-xl font-black text-xs tracking-wider h-10 px-4 transition-all ${
                    selectedCategory === c 
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400" 
                      : "border-slate-700 bg-transparent text-white hover:bg-slate-800"
                  }`}
                >
                  {c}
                </Button>
              ))}
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-44 bg-[#0F1E36] border-slate-700 h-10 rounded-xl font-bold text-xs text-slate-300">
                <SelectValue placeholder="Sort Layout" />
              </SelectTrigger>
              <SelectContent className="bg-[#16253D] border-slate-800 text-white">
                <SelectItem value="DEFAULT">Default Ordering</SelectItem>
                <SelectItem value="PRICE_LOW">Price: Low to High</SelectItem>
                <SelectItem value="PRICE_HIGH">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {CATEGORY_MAP[selectedCategory]?.length > 0 && (
            <div className="flex gap-2 w-full overflow-x-auto pt-3 pb-1 border-t border-slate-800 mt-3">
              {CATEGORY_MAP[selectedCategory].map(sub => (
                <Button 
                  key={sub} 
                  type="button"
                  onClick={() => setSelectedSubcategory(sub)} 
                  className={`rounded-lg text-[11px] h-7 px-3 font-extrabold uppercase tracking-wider transition-all ${
                    selectedSubcategory === sub 
                      ? "bg-white text-slate-950 font-black shadow" 
                      : "bg-transparent text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  {sub === "ALL" ? `All ${selectedCategory.toLowerCase()}` : sub}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Loading Inventory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl">
            <Package className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400 text-xs">No garments matched your filtering parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {filtered.map((product, idx) => (
              <AnimatedElement key={product.id} delay={idx * 50} className="group bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 flex flex-col h-full transition-all hover:-translate-y-1">
                
                {/* Image Section */}
                <div 
                  onClick={() => { setLightboxImage(product.image_url); setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-zoom-in"
                >
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded-lg text-white flex items-center gap-1 text-[10px] font-bold">
                      <Maximize2 className="h-3 w-3" /> Zoom
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFav(product.id); }} 
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-slate-200 text-slate-900 shadow-sm hover:scale-105 transition-all"
                  >
                    <Heart className={`h-3.5 w-3.5 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
                  </button>
                  {product.is_new_arrival && <Badge className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded">New</Badge>}
                </div>
                
                {/* Content Section */}
                <div className="p-3 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-amber-600 text-[9px] font-black tracking-wider uppercase">{product.category}</span>
                    {product.subcategory && <span className="text-slate-500 text-[9px] font-bold uppercase">• {product.subcategory}</span>}
                  </div>
                  
                  <h3 className="font-bold text-slate-950 text-xs sm:text-sm tracking-tight mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-slate-500 text-[11px] line-clamp-2 mb-2 min-h-[2rem] leading-tight">{product.description || "Bespoke handcrafted garment tailored to individual measurements."}</p>
                  
                  <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <span className="text-amber-600 font-black text-sm sm:text-base">₦{(product.price || 0).toLocaleString()}</span>
                    
                    {/* Quick View Dialog */}
                    <Dialog open={selectedProduct?.id === product.id} onOpenChange={(isOpen) => { 
                      if (isOpen) { 
                        setSelectedProduct(product); 
                        setOrderDone(false); 
                        setActiveTab("ready");
                        setAffiliateCode(localStorage.getItem("dkadris_affiliate_ref") || "");
                      } else { 
                        setSelectedProduct(null); 
                      } 
                    }}>
                      <DialogTrigger asChild>
                        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg h-7 px-2.5 transition-all">
                          Quick View
                        </Button>
                      </DialogTrigger>
            
                      <DialogContent className="bg-[#111F38] border-slate-800 max-w-4xl w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden text-white">
                        {selectedProduct && (
                          <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
                            
                            {/* Modal Left Image */}
                            <div className="w-full md:w-1/2 bg-slate-950 relative flex-shrink-0 h-56 md:h-full">
                              <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover object-top" />
                            </div>
                    
                            {/* Modal Right Side Tabs */}
                            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 justify-between">
                              <div>
                                <DialogHeader className="mb-3">
                                  <span className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
                                    {selectedProduct.category} {selectedProduct.subcategory ? `/ ${selectedProduct.subcategory}` : ""}
                                  </span>
                                  <DialogTitle className="font-black text-xl text-white">{selectedProduct.name}</DialogTitle>
                                  <span className="text-amber-400 font-black text-lg mt-0.5">₦{(selectedProduct.price || 0).toLocaleString()}</span>
                                </DialogHeader>

                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                  <TabsList className="grid grid-cols-2 w-full bg-[#091324] border border-slate-800 rounded-xl p-1 mb-4">
                                    <TabsTrigger value="ready" className="rounded-lg font-bold text-[10px] uppercase">1. Base Selection</TabsTrigger>
                                    <TabsTrigger value="custom" className="rounded-lg font-bold text-[10px] uppercase">2. Bespoke Details</TabsTrigger>
                                  </TabsList>

                                  {/* TAB 1: SELECTION OPTIONS + FULL DETAILS */}
                                  <TabsContent value="ready" className="space-y-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-bold uppercase text-slate-400">Select Size</Label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(Array.isArray(selectedProduct.sizes) ? selectedProduct.sizes : ["30", "32", "34", "36", "38", "M", "L", "XL"]).map(s => (
                                          <button key={s} type="button" onClick={() => setChosenSize(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${chosenSize === s ? "bg-white text-slate-950 border-white" : "bg-[#091324] border-slate-800 text-slate-300"}`}>{s}</button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-bold uppercase text-slate-400">Select Finish</Label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(Array.isArray(selectedProduct.colors) ? selectedProduct.colors : ["Indigo Blue", "Raw Black", "Stone Wash", "Burgundy"]).map(c => (
                                          <button key={c} type="button" onClick={() => setChosenColor(c)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${chosenColor === c ? "bg-white text-slate-950 border-white" : "bg-[#091324] border-slate-800 text-slate-300"}`}>{c}</button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-bold uppercase text-slate-400">Quantity</Label>
                                      <div className="flex items-center gap-3 border border-slate-800 w-max rounded-xl p-1 bg-[#091324]">
                                        <button type="button" onClick={() => setQty(p => Math.max(1, p - 1))} className="w-7 h-7 hover:bg-slate-800 rounded-lg font-bold text-base">-</button>
                                        <span className="w-6 text-center font-bold text-xs">{qty}</span>
                                        <button type="button" onClick={() => setQty(p => p + 1)} className="w-7 h-7 hover:bg-slate-800 rounded-lg font-bold text-base">+</button>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-bold uppercase text-slate-400">Affiliate Code (Optional)</Label>
                                      <Input 
                                        value={affiliateCode} 
                                        onChange={e => {
                                          const val = e.target.value.toUpperCase();
                                          setAffiliateCode(val);
                                          if (val) localStorage.setItem("dkadris_affiliate_ref", val);
                                        }} 
                                        placeholder="e.g. PARTNER10" 
                                        className="bg-[#091324] border-slate-700 rounded-xl h-9 text-xs text-white placeholder-slate-600" 
                                      />
                                      {affiliateCode && (
                                        <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                          <Check className="h-3 w-3 stroke-[3]" /> Affiliate code "{affiliateCode}" will be linked to this order.
                                        </p>
                                      )}
                                    </div>

                                    {/* CONSOLIDATED DETAILS BELOW AFFILIATE CODE */}
                                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                                          <Shirt className="h-3 w-3" /> Garment Blueprint Manual
                                        </Label>
                                        <p className="text-xs text-slate-300 leading-relaxed bg-[#091324] p-3 rounded-xl border border-slate-800/80">
                                          {selectedProduct.description || "Masterly crafted piece built with premium structural finish and reinforced stitching."}
                                        </p>
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                                          <ShieldCheck className="h-3 w-3" /> Care & Maintenance
                                        </Label>
                                        <div className="text-xs text-slate-300 leading-relaxed bg-[#091324] p-3 rounded-xl border border-slate-800/80 space-y-1">
                                          <p>• {selectedProduct.care_instructions || selectedProduct.care || "Wash inside out in cold water using mild detergent."}</p>
                                          <p>• Air dry away from direct high heat to preserve denim/fabric structure.</p>
                                          <p>• Iron on moderate heat on reverse side if needed.</p>
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3" /> Style Recommendation
                                        </Label>
                                        <p className="text-xs text-slate-300 leading-relaxed bg-[#091324] p-3 rounded-xl border border-slate-800/80">
                                          {selectedProduct.style_tips || selectedProduct.style_recommendation || "Pair with D-Kadris bespoke footwear or crisp raw denim layer for a sharp contemporary silhouette."}
                                        </p>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  {/* TAB 2: BESPOKE MEASUREMENTS & CUSTOMER DETAILS */}
                                  <TabsContent value="custom" className="space-y-3">
                                    {orderDone ? (
                                      <div className="text-center py-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mb-2"><Check className="h-5 w-5 stroke-[3]" /></div>
                                        <h4 className="font-bold text-base text-white mb-1">Order Submitted Successfully!</h4>
                                        <p className="text-amber-400 text-xs font-black max-w-xs px-4 mb-2 uppercase tracking-wider">Go to your cart bag to checkout via WhatsApp!</p>
                                        <Button onClick={() => { setSelectedProduct(null); setCartOpen(true); }} className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl px-5 py-2">Open Cart Bag</Button>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-[9px] font-bold uppercase text-slate-400">Full Name *</Label>
                                            <Input required value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Client Name" className="bg-[#091324] border-slate-700 rounded-xl h-9 text-xs text-white" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[9px] font-bold uppercase text-slate-400">Phone Number *</Label>
                                            <Input required value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="0803 xxxx 789" className="bg-[#091324] border-slate-700 rounded-xl h-9 text-xs text-white" />
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-[9px] font-bold uppercase text-slate-400">Email Address *</Label>
                                          <Input required type="email" value={custEmail} onChange={e=>setCustEmail(e.target.value)} placeholder="client@example.com" className="bg-[#091324] border-slate-700 rounded-xl h-9 text-xs text-white" />
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-[9px] font-bold uppercase text-slate-400">Fit Mapping Preference</Label>
                                          <Select value={fitPref} onValueChange={setFitPref}>
                                            <SelectTrigger className="bg-[#091324] border-slate-700 h-9 rounded-xl text-xs font-bold text-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#16253D] border-slate-800 text-white">
                                              <SelectItem value="Slim">Slim/Tapered Fit</SelectItem>
                                              <SelectItem value="Regular">Regular Comfort Fit</SelectItem>
                                              <SelectItem value="Oversized">Relaxed/Oversized Fit</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="border border-slate-800 bg-[#091324] rounded-xl p-3">
                                          <span className="block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Measurement Data (Inches)</span>
                                          <div className="grid grid-cols-4 gap-1.5 text-center">
                                            {[["Shoulder", shoulder, setShoulder, "18"], ["Chest", chest, setChest, "40"], ["Sleeve", sleeve, setSleeve, "24"], ["Top Length", topLength, setTopLength, "30"], ["Waist", waist, setWaist, "34"], ["Thigh", thigh, setThigh, "24"], ["Length", jeansLength, setJeansLength, "42"]].map(([lbl, val, setVal, ph]) => (
                                              <div key={lbl} className="bg-[#111F38] border border-slate-800 p-1 rounded-lg">
                                                <span className="text-[8px] text-slate-400 uppercase font-bold block mb-0.5 truncate">{lbl}</span>
                                                <input value={val} onChange={e=>setVal(e.target.value)} placeholder={ph} className="w-full bg-transparent text-center font-extrabold text-white text-xs focus:outline-none" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-slate-400">Styling Variations</Label><Textarea value={customNotes} onChange={e=>setCustomNotes(e.target.value)} placeholder="Describe custom cuts, pocket options..." className="bg-[#091324] border-slate-700 rounded-xl text-xs h-12 resize-none text-white" /></div>
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </div>

                              {/* Footer Action Buttons */}
                              <div className="pt-3 border-t border-slate-800 mt-4">
                                {activeTab === "ready" && (
                                  <Button onClick={() => setActiveTab("custom")} disabled={!chosenSize || !chosenColor} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs tracking-widest uppercase disabled:opacity-50">
                                    Add & Continue to Bespoke Fitting
                                  </Button>
                                )}
                                {activeTab === "custom" && !orderDone && (
                                  <>
                                    {dbError && <div className="p-2 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-xl font-bold mb-2">⚠️ {dbError}</div>}
                                    <Button onClick={handleCustomOrderSubmit} disabled={dbSubmitting} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs tracking-widest uppercase">
                                      {dbSubmitting ? "Syncing Admin..." : "Order Now"}
                                    </Button>
                                  </>
                                )}
                              </div>
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

        {/* Magnification Lightbox with Touch & Mouse Drag Support */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4"
            >
              <div className="w-full flex justify-between items-center z-20">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400">
                  <Maximize2 className="h-4 w-4" /> Zoom: {zoomScale.toFixed(1)}x
                </div>
                <button 
                  onClick={() => { setLightboxImage(null); setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="w-9 h-9 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors shadow-lg"
                >
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <div 
                className="relative flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden my-4 cursor-grab active:cursor-grabbing select-none touch-none"
                onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
                onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
                onMouseUp={handleEndDrag}
                onMouseLeave={handleEndDrag}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 1) handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchEnd={handleEndDrag}
              >
                <img 
                  src={lightboxImage} 
                  alt="Full Zoom View" 
                  style={{
                    transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                    transition: isDragging ? "none" : "transform 0.2s ease-out"
                  }}
                  className="max-h-[75vh] max-w-full object-contain pointer-events-none rounded-lg shadow-2xl" 
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-2xl z-20">
                <Button onClick={handleZoomOut} disabled={zoomScale <= 1} className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl h-9 px-3 font-bold text-xs">
                  <ZoomOut className="h-4 w-4" /> Zoom Out
                </Button>
                <Button onClick={() => { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }} disabled={zoomScale === 1} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl h-9 px-3 font-bold text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Reset
                </Button>
                <Button onClick={handleZoomIn} disabled={zoomScale >= 4} className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl h-9 px-3 font-black text-xs">
                  <ZoomIn className="h-4 w-4" /> Zoom In
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Cart Sidebar Drawer */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-[#111F38] border-l border-slate-800 h-full flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#091324]">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <ShoppingBag className="h-5 w-5 text-amber-400" />
                  <span>Your Cart Bag ({cartItems.length})</span>
                </div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-xl bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors">
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">Your styling bag is currently empty.</div>
                ) : (
                  cartItems.map((item, i) => (
                    <div key={i} className="flex gap-3 border border-slate-800 p-3 rounded-xl bg-[#091324] items-center shadow-inner">
                      <img src={item.img} alt={item.name} className="w-14 h-16 object-cover rounded-lg bg-slate-950 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                          {item.id && (
                            <button 
                              onClick={() => openProductFromCart(item.id)}
                              className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-0.5 underline shrink-0"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Size: {item.size} | Finish: {item.color} | Qty: {item.qty}</p>
                        
                        {/* ITEM PRICE DISPLAY IN CART */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400">₦{(item.price || 0).toLocaleString()} each</span>
                          <span className="text-amber-400 font-extrabold text-xs">₦{((item.price || 0) * item.qty).toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => setCartItems(p => p.filter((_, j) => j !== i))} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-5 border-t border-slate-800 bg-[#091324]">
                  <div className="flex justify-between text-white font-bold mb-4 text-base">
                    <span>Total Subtotal</span>
                    <span className="text-amber-400 font-black">₦{cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0).toLocaleString()}</span>
                  </div>
                  
                  {/* WHATSAPP CHECKOUT MESSAGE WITH INDIVIDUAL PRICES INCLUDED */}
                  <a 
                    href={`https://wa.me/2348163914835?text=${encodeURIComponent(
  `D-KADRIS BESPOKE ORDER\n-----------------------------------\n\n` +
  cartItems.map(item => {
    let block = `👕 *Garment:* ${item.name}\n💰 *Price:* ₦${(item.price || 0).toLocaleString()} each\n🎨 *Finish:* ${item.color} | *Size:* ${item.size} | *Qty:* ${item.qty}\n💵 *Item Subtotal:* ₦${((item.price || 0) * item.qty).toLocaleString()}\n`;
    if (item.isCustom && item.measurements) {
      block += `👤 *Client:* ${item.measurements.client}\n📞 *Phone:* ${item.measurements.phone}\n📧 *Email:* ${item.measurements.email}\n⚙️ *Fit Mapping:* ${item.fitPreference || item.color}\n`;
    }
    if (item.affiliateCode) {
      block += `🏷️ *Ref Code:* ${item.affiliateCode}\n`;
    }
    return block;
  }).join('\n-----------------------------------\n\n') +
  `\n💰 *Total Gross:* ₦${cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0).toLocaleString()}`
)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl py-5 tracking-widest uppercase text-xs shadow-xl transition-all">
                      <MessageCircle className="mr-2 h-4 w-4 stroke-[2.5]" /> Checkout via WhatsApp
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
