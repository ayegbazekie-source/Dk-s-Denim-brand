import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase"; // Updated client module location path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Settings, Globe, Phone, AlertTriangle, Share2, Upload, ImageIcon } from "lucide-react";

const DEFAULTS = {
  site_name: "D-Kadris Denims",
  tagline: "Handcrafted denim that fits properly.",
  whatsapp_number: "2348163914835",
  email: "dkadristailoringservice@gmail.com",
  instagram_url: "https://www.instagram.com/dkadris_tailoring?igsh=MW1jM2xud2Y1YW1xdw==",
  facebook_url: "https://www.facebook.com/profile.php?id=61589847017682",
  additional_link: "",
  hero_headline: "D-Kadris Denims",
  hero_subtext: "Premium denim crafted for you",
  brand_logo_url: "",
  logo_height: "40",
  commission_rate: "10",
  payout_threshold: "5000",
  maintenance_mode: "false",
  privacy_policy: "Your privacy is important to us. We collect only necessary information to process your orders and improve your experience.",
  refund_policy: "We accept returns within 7 days of delivery for alterations if the fit isn't perfect. Custom orders are final sale.",
  shipping_policy: "Standard delivery within Nigeria takes 3-7 business days depending on location. International shipping takes 7-14 business days.",
  terms_conditions: "By using our platform, you agree to provide accurate custom measurements. D-Kadris is not liable for errors due to incorrect measurements provided.",
  affiliate_terms: "Affiliates earn 10% commission on successful sales made via their link. Payouts are processed on the last Friday of every month.",
};

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Fetch settings from your Supabase key-value configs metadata table
  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("*");

      if (error) throw error;

      // Transform raw row records array [{ key, value }] into an easily accessible dictionary map
      if (data && data.length > 0) {
        const dictionary = {};
        data.forEach(item => {
          dictionary[item.key] = item.value;
        });
        setSettings(dictionary);
      } else {
        setSettings(DEFAULTS);
      }
    } catch (err) {
      console.error("Error fetching system configuration rows:", err.message);
      setSettings(DEFAULTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Update specific dictionary parameters dynamically on frontend keystrokes
  const f = (key) => ({
    value: settings[key] ?? DEFAULTS[key] ?? "",
    onChange: (e) => setSettings(s => ({ ...s, [key]: e.target.value })),
  });

  // Logo file uploads handling mapping onto Supabase Asset Buckets
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `brand/${fileName}`;

      // Execute stream upload on target bucket
      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Acquire asset URL string from public storage configuration distributions
      const { data: { publicUrl } } = supabase.storage
        .from("brand-assets")
        .getPublicUrl(filePath);

      setSettings(s => ({ ...s, brand_logo_url: publicUrl }));
    } catch (err) {
      console.error("Error uploading logo:", err.message);
      alert("Failed to upload image. Verify that the 'brand-assets' storage bucket exists and public policies are active.");
    } finally {
      setUploading(false);
    }
  };

  // Perform bulk upsert operations into the custom Postgres configuration table keys
  const handleSave = async () => {
    setSaving(true);
    
    // Combine current working configuration parameters with baseline defaults
    const completePayload = { ...DEFAULTS, ...settings };
    
    // Structure records into a key-value format row payload map array
    const upsertRows = Object.keys(completePayload).map(key => ({
      key: key,
      value: String(completePayload[key]),
      updated_at: new Date().toISOString()
    }));

    try {
      const { error } = await supabase
        .from("settings")
        .upsert(upsertRows, { onConflict: "key" }); // Prevents row duplication by rewriting keys

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving records:", err.message);
      alert(`Database configuration modification issue: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "branding", label: "Branding & Hero", icon: Globe },
    { id: "contact", label: "Contact & Links", icon: Phone },
    { id: "affiliates", label: "Affiliate System", icon: Share2 },
    { id: "policies", label: "Policy Pages", icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ActiveIcon = sections.find(s => s.id === activeSection)?.icon || Settings;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-64 bg-card border border-border rounded-2xl p-3 space-y-1 shrink-0">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === s.id ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-card-foreground"}`}>
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Main Settings Panel Workspace */}
      <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 text-accent"><ActiveIcon className="h-5 w-5" /></div>
            <h1 className="text-card-foreground font-black text-xl capitalize">{activeSection} Settings</h1>
          </div>
          {saved && (
            <div className="bg-accent/10 border border-accent/30 rounded-full px-4 py-1 text-accent font-bold text-xs flex items-center gap-1.5 animate-pulse">
              <Check className="h-3.5 w-3.5" /> All changes updated successfully
            </div>
          )}
        </div>

        {activeSection === "general" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Platform Name</Label>
              <Input {...f("site_name")} className="bg-muted border-border text-card-foreground mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Brand Tagline</Label>
              <Input {...f("tagline")} className="bg-muted border-border text-card-foreground mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Maintenance Mode State</Label>
              <select value={settings.maintenance_mode ?? "false"} onChange={e => setSettings(s => ({ ...s, maintenance_mode: e.target.value }))}
                className="w-full bg-muted border border-border text-card-foreground text-sm rounded-xl px-3 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-accent/40">
                <option value="false">Live (Accessible to everyone)</option>
                <option value="true">Under Maintenance (Admin lockdown restriction overlay)</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === "branding" && (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Company Brand Logo Asset</Label>
              <div className="mt-1 flex items-center gap-4">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="bg-muted border border-border text-card-foreground hover:bg-muted/80 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2">
                  {uploading ? "Uploading..." : <><Upload className="h-4 w-4" /> Upload Custom Logo</>}
                </Button>
                {settings.brand_logo_url ? (
                  <div className="h-10 px-3 bg-muted border border-border rounded-xl flex items-center justify-center">
                    <img src={settings.brand_logo_url} alt="Logo Preview" style={{ height: `${settings.logo_height || 40}px` }} className="object-contain" />
                  </div>
                ) : (
                  <div className="h-10 w-12 bg-muted border border-border rounded-xl flex items-center justify-center text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Rendered Height Boundary (Pixels)</Label>
              <Input type="number" {...f("logo_height")} className="bg-muted border-border text-card-foreground mt-1" placeholder="40" />
            </div>
            <div className="border-t border-border pt-4 mt-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Hero Headline</Label>
              <Input {...f("hero_headline")} className="bg-muted border-border text-card-foreground mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Hero Section Subtext Description</Label>
              <Textarea {...f("hero_subtext")} className="bg-muted border-border text-card-foreground mt-1 min-h-[70px]" />
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Customer Relations WhatsApp (With Country Code)</Label>
              <Input {...f("whatsapp_number")} className="bg-muted border-border text-card-foreground mt-1" placeholder="234..." />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Corporate Outbound Email Address</Label>
              <Input type="email" {...f("email")} className="bg-muted border-border text-card-foreground mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Instagram Profile URL</Label>
              <Input {...f("instagram_url")} className="bg-muted border-border text-card-foreground mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Facebook Page Link Configuration</Label>
              <Input {...f("facebook_url")} className="bg-muted border-border text-card-foreground mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">External Catalog Hyperlink Reference</Label>
              <Input {...f("additional_link")} className="bg-muted border-border text-card-foreground mt-1" placeholder="https://..." />
            </div>
          </div>
        )}

        {activeSection === "affiliates" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Baseline Affiliate Commission Rate (%)</Label>
              <Input type="number" {...f("commission_rate")} className="bg-muted border-border text-card-foreground mt-1" />
              <p className="text-muted-foreground text-xs mt-1">Default cut assigned per successful client checkout</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Minimum Payout Settlement Threshold (₦)</Label>
              <Input type="number" {...f("payout_threshold")} className="bg-muted border-border text-card-foreground mt-1" />
              <p className="text-muted-foreground text-xs mt-1">Minimum amount before affiliates can withdraw</p>
            </div>
          </div>
        )}

        {activeSection === "policies" && (
          <div className="space-y-5">
            {[["privacy_policy", "Privacy Policy"], ["refund_policy", "Refund Policy"], ["shipping_policy", "Shipping Policy"], ["terms_conditions", "Terms & Conditions"], ["affiliate_terms", "Affiliate Terms"]].map(([key, label]) => (
              <div key={key}>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">{label}</Label>
                <Textarea value={settings[key] ?? DEFAULTS[key] ?? ""} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 min-h-[100px]" />
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground font-bold rounded-full px-10 py-3 hover:scale-105 transition-all">
            {saving ? "Saving Configuration..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
