import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase"; // Points to your native supabase setup

// Mapping keys directly to your row-based keys in the "key" column
const POLICY_KEYS = {
  privacy: { 
    key: "privacy_policy", 
    title: "Privacy Policy", 
    default: "Your privacy is important to us. We collect only necessary information to process your orders and improve your experience." 
  },
  refund:  { 
    key: "refund_policy",  
    title: "Refund Policy",  
    default: "We accept returns within 7 days of delivery for unworn items in original condition. Custom orders are non-refundable." 
  },
  shipping:{ 
    key: "shipping_policy", 
    title: "Shipping Policy", 
    default: "We ship to all 36 states in Nigeria. Standard delivery takes 3-7 business days. Express delivery available on request." 
  },
  terms:   { 
    key: "terms_conditions", 
    title: "Terms & Conditions", 
    default: "By using D-Kadris Denims, you agree to our terms. All products are handcrafted and may have slight variations." 
  },
  // CHANGED FROM 'affiliate' TO 'earn' AND UPDATED LABELS/DEFAULTS
  earn: { 
    key: "affiliate_terms", 
    title: "Earn with D-kadris Terms", 
    default: "Partners earn 10% commission on verified sales. Payout threshold is ₦5,000. Self-referral and spam are strictly prohibited." 
  },
};

export default function PolicyModal({ policyType, open, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback support if an older caller uses 'affiliate' dynamically as the policyType prop
  const activeKey = policyType === "affiliate" ? "earn" : policyType;
  const policy = POLICY_KEYS[activeKey];

  useEffect(() => {
    if (!open || !policy) return;
    setLoading(true);

    async function fetchPolicyContent() {
      try {
        // Querying the row where the 'key' column matches our policy key
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", policy.key)
          .maybeSingle(); // Safely gets the exact row object

        if (error) throw error;

        if (data && data.value) {
          setContent(data.value);
        } else {
          setContent(policy.default);
        }
      } catch (err) {
        console.error(`Error loading ${policy.title}:`, err.message);
        setContent(policy.default);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicyContent();
  }, [open, activeKey]);

  if (!policy) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-gray-200 max-w-2xl w-[95vw] flex flex-col" style={{ maxHeight: "85vh" }}>
        <style>{`[data-radix-dialog-close] { color: #000 !important; opacity: 1 !important; } [data-radix-dialog-close] svg { color: #000 !important; stroke: #000 !important; }`}</style>
        <DialogHeader>
          <DialogTitle className="font-black text-xl text-gray-900">{policy.title}</DialogTitle>
          <p className="text-gray-500 text-sm">D-Kadris Denims — Official Policy</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {content && content.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="text-gray-800 text-sm leading-relaxed">{para}</p>
              ))}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600 text-xs mt-4">
                Last updated by D-Kadris Denims.
                For questions, contact us at dkadristailoringservice@gmail.com or +234 816 391 4835.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
