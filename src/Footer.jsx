import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Instagram, Facebook, MessageCircle, Mail, Phone, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import PolicyModal from "@/components/PolicyModal";
import { supabase } from "@/lib/supabase"; // Matches your lib folder setup

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subDone, setSubDone] = useState(false);
  const [policyModal, setPolicyModal] = useState(null);
  const [socialLinks, setSocialLinks] = useState({
    instagram_url: "https://www.instagram.com/dkadris_tailoring?igsh=MW1jM2xud2Y1YW1xdw==",
    facebook_url: "https://www.facebook.com/profile.php?id=61589847017682",
    additional_link: ""
  });

  // Fetch Social Links columns directly from the active settings row
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("instagram_url, facebook_url")
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSocialLinks(s => ({
            ...s,
            instagram_url: data.instagram_url || s.instagram_url,
            facebook_url: data.facebook_url || s.facebook_url
          }));
        }
      } catch (error) {
        console.error("Error fetching social configurations:", error.message);
      }
    }

    fetchSettings();
  }, []);

  // Submit new subscriber to your database structure
  const handleSub = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([
          { 
            email: email, 
            subscribed_date: new Date().toISOString(), 
            is_active: true 
          }
        ]);

      if (error) throw error;
      setSubDone(true);
    } catch (error) {
      console.error("Error saving subscriber:", error.message);
    }
  };

  const openPolicy = (type) => (e) => { 
    e.preventDefault(); 
    setPolicyModal(type); 
  };

  return (
    <footer className="bg-muted text-foreground border-t border-border/30">
      <PolicyModal policyType={policyModal} open={!!policyModal} onClose={() => setPolicyModal(null)} />

      {/* Top CTA Bar */}
      <div className="bg-primary px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-primary-foreground font-heading font-bold text-2xl mb-1">Ready to wear D-Kadris?</h3>
            <p className="text-primary-foreground/70 font-body">Handcrafted denim, precision fit, Nigerian excellence.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/Catalog">
              <Button className="bg-accent text-accent-foreground font-bold rounded-full px-8 py-3 hover:scale-105 transition-all duration-300">
                Shop Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-bold rounded-full px-8 py-3 transition-all duration-300">
                <MessageCircle className="mr-2 h-4 w-4" /> Order via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-sm">DK</span>
              </div>
              <span className="text-accent font-heading font-bold text-xl">D-Kadris</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-body">
              Premium handcrafted denim built by professional tailors in Nigeria. Precision fit, durability, and modern style for every body.
            </p>
            <div className="flex gap-3">
              {socialLinks.instagram_url && (
                <a href={socialLinks.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-200 group">
                  <Instagram className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
              )}
              {socialLinks.facebook_url && (
                <a href={socialLinks.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-200 group">
                  <Facebook className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
              )}
              {socialLinks.additional_link && (
                <a href={socialLinks.additional_link} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-200 group">
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
              )}
              <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:scale-110 transition-all duration-200">
                <MessageCircle className="h-4 w-4 text-accent-foreground" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-foreground font-heading font-bold text-sm uppercase tracking-widest mb-5">Quick Links</h4>
            <ul className="space-y-3 font-body">
              <li><Link to="/" className="text-muted-foreground hover:text-accent transition-colors text-sm">Home</Link></li>
              <li><Link to="/Catalog" className="text-muted-foreground hover:text-accent transition-colors text-sm">Shop Collection</Link></li>
              <li><Link to="/Affiliate" className="text-muted-foreground hover:text-accent transition-colors text-sm">Affiliate Program</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors text-sm">Custom Tailoring</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors text-sm">Size Guide</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-foreground font-heading font-bold text-sm uppercase tracking-widest mb-5">Policies</h4>
            <ul className="space-y-3 font-body">
              <li><a href="#" onClick={openPolicy("privacy")} className="text-muted-foreground hover:text-accent transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" onClick={openPolicy("refund")} className="text-muted-foreground hover:text-accent transition-colors text-sm">Refund Policy</a></li>
              <li><a href="#" onClick={openPolicy("shipping")} className="text-muted-foreground hover:text-accent transition-colors text-sm">Shipping Policy</a></li>
              <li><a href="#" onClick={openPolicy("terms")} className="text-muted-foreground hover:text-accent transition-colors text-sm">Terms & Conditions</a></li>
              <li><a href="#" onClick={openPolicy("affiliate")} className="text-muted-foreground hover:text-accent transition-colors text-sm">Affiliate Terms</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="text-foreground font-heading font-bold text-sm uppercase tracking-widest mb-5">Contact Us</h4>
            <ul className="space-y-3 mb-7 font-body">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <a href="tel:+2348163914835" className="hover:text-accent transition-colors">+234 816 391 4835</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <a href="mailto:dkadristailoringservice@gmail.com" className="hover:text-accent transition-colors break-all">dkadristailoringservice@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Nigeria — Serving all 36 states</span>
              </li>
            </ul>
            <div>
              <p className="text-foreground text-xs font-heading font-bold uppercase tracking-widest mb-3">Newsletter</p>
              {subDone ? (
                <p className="text-accent text-sm font-bold font-body">Thanks for subscribing!</p>
              ) : (
                <form onSubmit={handleSub} className="flex gap-2">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" required
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-full h-10 text-sm flex-1" />
                  <Button type="submit" className="bg-primary text-primary-foreground rounded-full h-10 px-4 hover:scale-105 transition-all flex-shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/30 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-body">
            © {new Date().getFullYear()} <span className="text-accent font-bold">D-Kadris Denims</span>. All rights reserved. Made with precision in Nigeria.
          </p>
          <div className="flex items-center gap-6 text-muted-foreground text-xs font-body">
            <a href="#" onClick={openPolicy("privacy")} className="hover:text-accent transition-colors">Privacy</a>
            <a href="#" onClick={openPolicy("terms")} className="hover:text-accent transition-colors">Terms</a>
            <a href="#" onClick={openPolicy("refund")} className="hover:text-accent transition-colors">Refunds</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
