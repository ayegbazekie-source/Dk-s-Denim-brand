import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Scissors, Zap, Shield, MessageCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CustomerReviews from "@/components/home/CustomerReviews";

const AnimatedElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { 
      setIsVisible(true); 
      return; 
    }
    
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { 
        clearTimeout(fallback); 
        setTimeout(() => setIsVisible(true), delay); 
        observer.unobserve(el); 
      }
    }, { threshold: 0.05, rootMargin: "0px 0px 100px 0px" });
    
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${className || ""}`}>
      {children}
    </div>
  );
};

// Fallback images used while database loads or as a clean backup
const DEFAULT_HERO_IMAGES = {
  mobile: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop",
  desktop: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=2000&auto=format&fit=crop"
};

function HeroSection({ featuredProducts, loadingProducts }) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const [selectedHeroImage, setSelectedHeroImage] = useState(DEFAULT_HERO_IMAGES.desktop);

  // Randomly pick a featured product image whenever products are loaded
  useEffect(() => {
    if (!loadingProducts && featuredProducts && featuredProducts.length > 0) {
      const randomIndex = Math.floor(Math.random() * featuredProducts.length);
      const chosenProduct = featuredProducts[randomIndex];
      if (chosenProduct?.image_url) {
        setSelectedHeroImage(chosenProduct.image_url);
      }
    }
  }, [featuredProducts, loadingProducts]);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-between pt-28 pb-16 overflow-hidden">
      
      {/* BACKGROUND IMAGE UNDERLAY WITH MOTION PARALLAX EFFECT */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
        <picture>
          <source 
            media="(max-width: 640px)" 
            srcSet={selectedHeroImage === DEFAULT_HERO_IMAGES.desktop ? DEFAULT_HERO_IMAGES.mobile : selectedHeroImage} 
          />
          <img 
            src={selectedHeroImage} 
            alt="D-Kadris Premium Campaign" 
            className="w-full h-full object-cover object-center select-none transition-all duration-1000"
          />
        </picture>
        
        {/* Dark vignette gradient to keep text readable on any background image */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </motion.div>

      {/* Decorative subtle texture noise grid */}
      <div className="absolute inset-0 opacity-[0.02] z-0 mix-blend-overlay pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")' }}
      />

      <div className="h-4 w-full" />

      {/* MAIN CONTENT BLOCK */}
      <motion.div style={{ opacity }} className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full my-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl md:text-8xl font-black text-[#E5B842] mb-6 tracking-tight leading-[1.1] font-serif drop-shadow-md"
        >
          D-Kadris Denims
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-slate-300 text-lg sm:text-xl md:text-2xl font-light mb-12 tracking-wide max-w-md"
        >
          Premium denim crafted for you
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full sm:w-auto"
        >
          <Link to="/Catalog" className="w-full sm:w-auto">
            <Button className="w-full relative overflow-hidden bg-primary text-primary-foreground font-bold px-10 py-6 text-sm sm:text-base rounded-full hover:scale-105 transition-all duration-500 shadow-xl shadow-primary/20 group">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Shop Now
            </Button>
          </Link>
          <Link to="/Affiliate" className="w-full sm:w-auto">
            <Button className="w-full bg-[#cbd5e1] text-[#1e293b] font-bold px-10 py-6 text-sm sm:text-base rounded-full hover:scale-105 transition-all duration-500 border border-transparent hover:bg-white">
              Affiliate Dashboard
            </Button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 1 }} className="mt-12">
          <p className="text-[#E5B842] text-lg sm:text-xl italic font-serif opacity-90 tracking-wide">
            Your style, your perfect fit.
          </p>
        </motion.div>
      </motion.div>

      {/* SCROLL ANCHOR */}
      <motion.a
        href="#catalog"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group select-none"
        onClick={e => { e.preventDefault(); document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' }); }}
      >
        <span className="text-slate-400 text-[10px] font-bold tracking-[0.25em] uppercase group-hover:text-accent transition-colors">Scroll</span>
        <div className="w-10 h-10 rounded-full border border-slate-700/50 bg-slate-900/30 group-hover:border-accent flex items-center justify-center transition-all duration-300 group-hover:bg-accent/10 animate-bounce">
          <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-accent transition-colors" />
        </div>
      </motion.a>
    </section>
  );
}

function FloatingDivider() {
  return (
    <div className="bg-background py-16 flex justify-center items-center">
      <AnimatedElement>
        <p className="text-accent italic font-serif text-xl opacity-90">Crafted with precision and style</p>
      </AnimatedElement>
    </div>
  )
}

function FeaturedCollectionsSection({ featuredProducts, loading }) {
  const staticFallback = [
    { id: "1", name: "Kadris Signature Jacket", category: "Jackets", image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000", is_featured: true },
    { id: "2", name: "Precision Slim Jeans", category: "Jeans", image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000", is_featured: true },
    { id: "3", name: "Utility Cargo Denims", category: "Cargo", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000", is_featured: true },
    { id: "4", name: "Classic Raw Denim", category: "Jeans", image_url: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=1000", is_featured: true },
    { id: "5", name: "Tailored Denim Vest", category: "Vests", image_url: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?q=80&w=1000", is_featured: true },
    { id: "6", name: "Vintage Wash Jacket", category: "Jackets", image_url: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1000", is_featured: true },
  ];

  const featured = featuredProducts.length > 0 ? featuredProducts : staticFallback.slice(0, 6);

  return (
    <section id="catalog" className="bg-muted py-32 px-6 border-y border-border/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        
        <AnimatedElement className="text-center mb-20">
          <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase mb-4 block">The Collection</span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-6 font-serif tracking-tight">Masterpieces in Denim</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Each piece is tailored with precision — handcrafted by master tailors in Nigeria, designed for the modern world.</p>
        </AnimatedElement>

        {/* 
          OPTIMIZATION: 
          - Mobile Carousel layout uses "min-w-[68vw]" (instead of 82vw) to shrink card size so the swipe navigation is instantly obvious.
          - Padding "px-6" on the track gives clean spacing.
        */}
        <div 
          className={`
            flex overflow-x-auto snap-x snap-mandatory gap-5 pb-8 scrollbar-none px-4 -mx-4
            md:grid md:grid-cols-12 md:gap-8 md:overflow-x-visible md:pb-0 md:px-0 md:mx-0
            ${loading ? "opacity-50" : "opacity-100"} transition-opacity duration-700
          `}
        >
          {featured.map((product, index) => {
            // Editorial custom size parameters to break uniform box looks on desktop
            const gridSpans = [
              "md:col-span-7", 
              "md:col-span-5", 
              "md:col-span-4", 
              "md:col-span-8", 
              "md:col-span-6", 
              "md:col-span-6", 
            ];

            return (
              <div 
                key={product.id || index} 
                className={`
                  min-w-[68vw] sm:min-w-[40vw] snap-center shrink-0 
                  md:min-w-0 md:shrink ${gridSpans[index] || "md:col-span-4"}
                `}
              >
                <AnimatedElement delay={index * 100}>
                  <Link to="/Catalog">
                    {/* 
                      OPTIMIZATION:
                      - aspect-[2/3] on mobile prevents heavy image cropping and zoom, keeping full vertical garments in view.
                      - md:aspect-auto allows desktop sizes to respond naturally.
                    */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-card cursor-pointer aspect-[2/3] md:aspect-[16/11] lg:aspect-square xl:aspect-[4/5] shadow-2xl shadow-black/20 hover:-translate-y-2 hover:shadow-accent/10 transition-all duration-700 border border-white/5">
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-500" />
                      
                      {/* Text adjustments for smaller mobile layout */}
                      <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full transform translate-y-1 group-hover:translate-y-0 transition-all duration-500">
                        <p className="text-accent text-[10px] md:text-xs uppercase tracking-widest mb-1.5 font-bold">{product.category}</p>
                        <h3 className="text-foreground font-black text-lg md:text-2xl mb-2 font-serif leading-tight">{product.name}</h3>
                        <div className="flex items-center text-foreground/70 text-xs md:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                          Explore Piece <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-accent" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedElement>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyDKadrisSection() {
  const reasons = [
    { icon: Scissors, title: "Tailor Precision", desc: "Every piece is measured and cut with millimeter accuracy by experienced Nigerian tailors." },
    { icon: Shield, title: "Durable Quality", desc: "Premium 12-14oz denim fabric that gets better with age, not worse." },
    { icon: Zap, title: "Perfect Fit", desc: "Submit your measurements for a custom fit that feels like it was made just for you." },
  ];

  return (
    <section className="bg-background py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedElement>
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-2xl">
              <img 
                src="https://uwbvliklifubrfvpunag.supabase.co/storage/v1/object/public/brand-assets/craftsmanship.jpg" 
                alt="Craftsmanship" 
                className="w-full h-full object-cover scale-105" 
                style={{ animation: 'slowZoom 20s ease-in-out infinite alternate' }} 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <div className="backdrop-blur-md bg-background/30 border border-white/10 text-foreground rounded-2xl p-6 shadow-2xl">
                  <span className="text-accent font-black text-4xl block mb-1 font-serif">100%</span>
                  <span className="font-medium text-sm tracking-widest uppercase">Handcrafted</span>
                </div>
              </div>
            </div>
          </AnimatedElement>
          
          <div>
            <AnimatedElement delay={100}>
              <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase mb-4 block">Our Story</span>
              <h3 className="text-foreground text-4xl sm:text-5xl font-black mb-8 leading-[1.1] font-serif">Built by Tailors, <br />Worn by Leaders</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-12">D-Kadris was born from a simple frustration: the best denim in the world didn't fit African body types properly. Our master tailors in Nigeria decided to change that, creating a brand synonymous with uncompromising quality and perfect fit.</p>
            </AnimatedElement>
            
            <div className="flex flex-col gap-8">
              {reasons.map((r, i) => (
                <AnimatedElement key={r.title} delay={200 + (i * 100)}>
                  <div className="flex gap-6 group cursor-default">
                    <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors duration-500">
                      <r.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold text-xl mb-2 font-serif group-hover:text-accent transition-colors">{r.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                </AnimatedElement>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
      `}} />
    </section>
  );
}

function CustomOrderSection() {
  return (
    <section className="bg-muted py-32 px-6 border-y border-border/30 relative">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <AnimatedElement>
          <h2 className="text-4xl sm:text-5xl font-bold text-accent mb-6 font-serif">Your Fit, Your Way</h2>
          <p className="text-foreground/80 text-lg sm:text-xl mb-10 max-w-xl mx-auto font-light">
            Contact us at +2348163914835 or dkadristailoringservice@gmail.com
          </p>
          <Link to="/Catalog">
            <Button className="bg-primary text-primary-foreground font-bold text-lg px-12 py-7 rounded-full hover:scale-105 transition-all duration-500 shadow-xl shadow-primary/20">
              Start Custom Order
            </Button>
          </Link>
        </AnimatedElement>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("newsletter_subscribers") 
        .insert([
          {
            email,
            subscribed_date: new Date().toISOString(),
            is_active: true
          }
        ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("Subscription error:", err);
      alert(`Subscription error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-background py-24 px-6 border-t border-border/30">
      <div className="max-w-3xl mx-auto text-center">
        <AnimatedElement>
          <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase mb-4 block">Exclusive Access</span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-6 font-serif">Join the Inner Circle</h2>
          <p className="text-muted-foreground mb-10 text-lg">Subscribe to receive updates on new collections and custom tailoring availability.</p>
          
          {submitted ? (
            <div className="bg-muted border border-border rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-accent font-bold text-xl mb-2 font-serif">Welcome.</h3>
              <p className="text-foreground/70">You are now on the list.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-muted border-transparent focus-visible:ring-accent text-foreground placeholder:text-muted-foreground rounded-full px-8 h-14 text-base shadow-inner"
                required
              /> <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground font-bold px-10 h-14 rounded-full hover:scale-105 transition-all duration-300 whitespace-nowrap shadow-lg shadow-accent/20">
                {loading ? "Joining..." : "Subscribe"}
              </Button>
            </form>
          )}
        </AnimatedElement>
      </div>
    </section>
  );
}

export default function Home() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Consolidated database logic to fetch items once at the root
  useEffect(() => {
    async function checkMaintenanceStatus() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .single();

        if (!error && data) {
          setIsMaintenance(data.value === "true");
        }
      } catch (err) {
        console.error("Error reading application layout flags:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoadingProducts(false);
      }
    }

    checkMaintenanceStatus();
    fetchProducts();
  }, []);

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 6);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <div className="bg-background min-h-[100svh] w-full fixed inset-0 z-[99999] flex flex-col items-center justify-center text-center px-6 overflow-hidden selection:bg-accent/30">
        <div className="absolute inset-0 bg-background z-0" />
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60vw] h-[60vw] bg-accent/5 rounded-full blur-[130px]" />
        </div>
        
        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
          <h1 className="text-4xl sm:text-6xl font-black text-accent mb-6 font-serif tracking-tight leading-tight">
            Under Maintenance
          </h1>
          <p className="text-foreground/80 text-base sm:text-xl font-light mb-10 max-w-md leading-relaxed">
            We are working behind the scenes to enhance your custom denim experience. The platform will return online shortly.
          </p>
          <div className="w-24 h-[1px] bg-border/40 mb-6" />
          <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
            Admin Lockdown Active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen selection:bg-accent/30 selection:text-accent">
      <HeroSection featuredProducts={featuredProducts} loadingProducts={loadingProducts} />
      <FloatingDivider />
      <FeaturedCollectionsSection featuredProducts={featuredProducts} loading={loadingProducts} />
      <WhyDKadrisSection />
      <CustomOrderSection />
      <CustomerReviews />
      <NewsletterSection />
      
      {/* Floating WhatsApp CTA */}
      <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 hover:scale-110 hover:-translate-y-2 transition-all duration-500 group">
        <MessageCircle className="h-8 w-8 text-accent-foreground" />
        <span className="absolute right-20 bg-background border border-border text-foreground text-sm font-bold px-4 py-2.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-xl pointer-events-none">
          Chat with a Tailor
        </span>
      </a>
    </div>
  );
}
