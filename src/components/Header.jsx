import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Matches your lib folder setup

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoHeight, setLogoHeight] = useState(40);
  const location = useLocation();

  // Scroll listener for background opacity change
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch logo settings from the single site settings row
  useEffect(() => {
    async function fetchLogoSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("brand_logo_url")
          .maybeSingle(); // Safely fetches your settings row

        if (error) throw error;

        if (data && data.brand_logo_url) {
          setLogoUrl(data.brand_logo_url);
        }
      } catch (error) {
        console.error("Error fetching logo configuration:", error.message);
      }
    }

    fetchLogoSettings();
  }, []);

  const navLinks = [
    { label: "HOME", to: "/" },
    { label: "SHOP", to: "/Catalog" },
    { label: "AFFILIATES", to: "/Affiliate" },
  ];

  const isActive = (to) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-xl shadow-2xl shadow-background/50 border-b border-border/50 py-3" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo — Dynamic image from database or text fallback */}
        <Link to="/" className="group flex items-center">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="D-Kadris" 
              style={{ height: `${logoHeight}px`, maxWidth: "180px", objectFit: "contain" }} 
              className="transition-opacity group-hover:opacity-80" 
            />
          ) : (
            <div className="px-4 py-1.5 border border-accent/40 rounded-lg group-hover:border-accent group-hover:bg-accent/5 transition-all duration-300">
              <span className="text-accent font-bold text-lg tracking-wide font-serif">D-Kadris</span>
            </div>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1 border border-border/50 rounded-full p-1 bg-background/40 backdrop-blur-md">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`px-5 py-2 rounded-full text-[11px] font-bold tracking-[0.2em] transition-all duration-300 ${isActive(link.to) ?
                "bg-foreground/10 text-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted"}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon" className="text-accent hover:bg-accent/10 rounded-full border border-accent/40">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background border-l border-border w-72">
            <div className="flex flex-col h-full pt-6">
              <div className="mb-10 px-4 py-2 border border-accent/40 rounded-lg inline-block w-max">
                <span className="text-accent font-bold text-xl font-serif">D-Kadris</span>
              </div>
              <nav className="flex flex-col gap-2 flex-1">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to}
                    className={`px-5 py-4 rounded-xl font-bold tracking-widest text-sm transition-all duration-200 ${isActive(link.to) ?
                      "bg-accent/10 text-accent border border-accent/20" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}>
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-3 pt-6 border-t border-border">
                <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-accent text-accent-foreground font-bold rounded-full py-6">
                    <MessageCircle className="h-5 w-5 mr-2" /> WhatsApp Us
                  </Button>
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
