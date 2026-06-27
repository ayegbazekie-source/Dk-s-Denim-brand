import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Check, Copy, TrendingUp, Users, DollarSign, ArrowRight, MessageCircle, Star, Shield, Zap, Gift, Lock, Pencil, AlertTriangle, Clock } from "lucide-react";
import { checkRateLimit, sanitize, isDisposableEmail, validatePassword, validatePhone } from "@/lib/security";
import TermsModal from "@/components/affiliate/TermsModal";

// Import your pre-configured supabase client
import { supabase } from "@/lib/supabase"; 

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
    }, { threshold: 0.05, rootMargin: "0px 0px 200px 0px" });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className || ""}`}>
      {children}
    </div>);
};

function generateCode(name) {
  return "DK" + name.toUpperCase().replace(/\s/g, "").slice(0, 5) + Math.floor(Math.random() * 1000);
}

export default function Affiliate() {
  const [tab, setTab] = useState("join");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", referral_code: "", agreed: false });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [affiliate, setAffiliate] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);

  // Bank details state
  const [bankForm, setBankForm] = useState({ bank_name: "", account_number: "", account_name: "" });
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  // Payout state
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Listen to Supabase Auth State changes on mount
  useEffect(() => {
    const fetchAffiliateProfile = async (userId) => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (!error && data) {
        setAffiliate(data);
        setLoggedIn(true);
      }
    };

    // Check current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAffiliateProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAffiliateProfile(session.user.id);
      } else {
        setLoggedIn(false);
        setAffiliate(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pre-fill bank form when affiliate profile data loads
  useEffect(() => {
    if (affiliate) {
      const hasBankDetails = affiliate.bank_name || affiliate.account_number || affiliate.account_name;
      setBankForm({
        bank_name: affiliate.bank_name || "",
        account_number: affiliate.account_number || "",
        account_name: affiliate.account_name || ""
      });
      setEditingBank(!hasBankDetails);
    }
  }, [affiliate]);

  // Track user activity timestamp directly in DB
  useEffect(() => {
    if (loggedIn && affiliate?.id) {
      supabase
        .from("affiliates")
        .update({ last_active_date: new Date().toISOString() })
        .eq("id", affiliate.id);
    }
  }, [loggedIn, affiliate?.id]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!checkRateLimit("signup", 3, 60000)) {
      setError("Too many signup attempts. Please wait 1 minute and try again.");
      return;
    }
    if (!form.agreed) { setError("Please accept the terms and conditions."); return; }

    const cleanName = sanitize(form.name);
    const cleanEmail = sanitize(form.email).toLowerCase();
    const cleanPhone = sanitize(form.phone);
    const cleanReferral = sanitize(form.referral_code).toUpperCase();

    if (isDisposableEmail(cleanEmail)) {
      setError("Disposable/temporary email addresses are not allowed. Please use a real email.");
      return;
    }
    const pwCheck = validatePassword(form.password);
    if (!pwCheck.valid) { setError(pwCheck.message); return; }
    if (!validatePhone(cleanPhone)) {
      setError("Please enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678).");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Self referral validation using Supabase Table
      if (cleanReferral) {
        const { data: matchingReferrer } = await supabase
          .from("affiliates")
          .select("email, phone")
          .eq("referral_code", cleanReferral)
          .maybeSingle();

        if (matchingReferrer && (matchingReferrer.email === cleanEmail || matchingReferrer.phone === cleanPhone)) {
          setError("Self-referral is not permitted. You cannot use your own affiliate code.");
          setSubmitting(false);
          return;
        }
      }

      // 2. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
      });

      if (authError) throw authError;

      const code = generateCode(cleanName);

      // 3. Create relational profile in 'affiliates' table linked via auth UID
      const { data: newAffiliate, error: profileError } = await supabase
        .from("affiliates")
        .insert([{
          id: authData.user.id,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          referral_code: code,
          total_clicks: 0,
          orders_generated: 0,
          total_earnings: 500,
          pending_payout: 500,
          paid_commissions: 0,
          status: "pending",
          joined_date: new Date().toISOString(),
          last_active_date: new Date().toISOString(),
          referred_by: cleanReferral || null,
          payout_requested: false,
          failed_login_attempts: 0
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // 4. Update parent referrer stats if valid
      if (cleanReferral) {
        const { data: referrer } = await supabase
          .from("affiliates")
          .select("id, total_earnings, pending_payout")
          .eq("referral_code", cleanReferral)
          .maybeSingle();

        if (referrer) {
          await supabase
            .from("affiliates")
            .update({
              total_earnings: (referrer.total_earnings || 0) + 300,
              pending_payout: (referrer.pending_payout || 0) + 300
            })
            .eq("id", referrer.id);
        }
      }
      
      setAffiliate(newAffiliate);
      setLoggedIn(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!checkRateLimit("login", 5, 60000)) {
      setError("Too many validation attempts. Please hold for 1 minute.");
      return;
    }

    const cleanEmail = sanitize(loginForm.email).trim().toLowerCase();
    setSubmitting(true);

    try {
      // 1. Gather profile security parameters before checking passwords
      const { data: profile } = await supabase
        .from("affiliates")
        .select("id, status, failed_login_attempts, lockout_until")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profile) {
        if (profile.status === "suspended") {
          setError("Account frozen due to security failure rules or dormancy. Contact management.");
          setSubmitting(false);
          return;
        }
        if (profile.lockout_until && new Date(profile.lockout_until) > new Date()) {
          const remainingMins = Math.ceil((new Date(profile.lockout_until) - new Date()) / 60000);
          setError(`Security Hold active. Try again in ${remainingMins} minutes.`);
          setSubmitting(false);
          return;
        }
      }

      // 2. Perform Primary Supabase Authentication Pass
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginForm.password,
      });

      // 3. Handle Failure Scenarios gracefully
      if (authError) {
        if (profile) {
          let currentFailures = (profile.failed_login_attempts || 0) + 1;
          let updatePayload = { failed_login_attempts: currentFailures };

          if (currentFailures === 3) {
            updatePayload.lockout_until = new Date(Date.now() + 10 * 60000).toISOString();
            setError("Incorrect credentials 3 times. Security window locked for 10 minutes.");
          } else if (currentFailures >= 5) {
            updatePayload.status = "suspended";
            setError("Profile frozen permanently after 5 continuous failures. Contact support.");
          } else {
            setError("Invalid email or password structure. Please try again.");
          }
          await supabase.from("affiliates").update(updatePayload).eq("id", profile.id);
        } else {
          setError("Invalid authentication details.");
        }
        return;
      }

      // 4. Post-Login Configuration Match verification
      let { data: verifiedProfile } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      // Fix popup blocks for all users by safely creating a database record on-the-fly if it was missed
      if (!verifiedProfile) {
        const code = generateCode(cleanEmail.split("@")[0]);
        const { data: autoRepairedProfile, error: repairError } = await supabase
          .from("affiliates")
          .insert([{
            id: authData.user.id,
            name: cleanEmail.split("@")[0],
            email: cleanEmail,
            phone: "",
            referral_code: code,
            total_clicks: 0,
            orders_generated: 0,
            total_earnings: 500,
            pending_payout: 500,
            paid_commissions: 0,
            status: "pending",
            joined_date: new Date().toISOString(),
            last_active_date: new Date().toISOString(),
            payout_requested: false,
            failed_login_attempts: 0
          }])
          .select()
          .single();

        if (repairError) throw new Error("Could not initialize your tracking profile configuration parameters.");
        verifiedProfile = autoRepairedProfile;
      } else {
        // Clear parameters down on normal verification pass
        await supabase
          .from("affiliates")
          .update({ failed_login_attempts: 0, lockout_until: null })
          .eq("id", authData.user.id);
      }

      if (verifiedProfile.status === "suspended") {
        setError("Account frozen due to security failure rules or dormancy. Contact management.");
        await supabase.auth.signOut();
        return;
      }

      setAffiliate(verifiedProfile);
      setLoggedIn(true);
    } catch (err) {
      setError(err.message || "An unexpected validation exception occurred.");
    } finally { setSubmitting(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setAffiliate(null);
  };

  const copyLink = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(`https://d-kadrisdenims.com/?ref=${affiliate.referral_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveBankDetails = async (e) => {
    e.preventDefault();
    setSavingBank(true);

    try {
      const { error: updateError } = await supabase
        .from("affiliates")
        .update({
          bank_name: bankForm.bank_name,
          account_number: bankForm.account_number,
          account_name: bankForm.account_name
        })
        .eq("id", affiliate.id);

      if (updateError) throw updateError;

      setAffiliate((a) => ({ ...a, ...bankForm }));
      setEditingBank(false);
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
    } catch {
      setError("Failed to update bank details.");
    } finally { setSavingBank(false); }
  };

  const requestPayout = async () => {
    setPayoutSubmitting(true);
    try {
      const { error: payoutError } = await supabase
        .from("affiliates")
        .update({ payout_requested: true })
        .eq("id", affiliate.id);

      if (payoutError) throw payoutError;

      setAffiliate((a) => ({ ...a, payout_requested: true }));
      setPayoutSuccess(true);
    } catch {
      setError("Failed to process payout request.");
    } finally { setPayoutSubmitting(false); }
  };

  const canRequestPayout = (affiliate?.pending_payout || 0) >= 5000;
  const hasBankDetails = affiliate?.bank_name && affiliate?.account_number && affiliate?.account_name;

  const stats = [
    { label: "Total Clicks", value: affiliate?.total_clicks || 0, icon: TrendingUp, color: "text-accent" },
    { label: "Orders Generated", value: affiliate?.orders_generated || 0, icon: Users, color: "text-primary" },
    { label: "Total Earnings (₦)", value: (affiliate?.total_earnings || 0).toLocaleString(), icon: DollarSign, color: "text-accent" },
    { label: "Pending Payout (₦)", value: (affiliate?.pending_payout || 0).toLocaleString(), icon: Gift, color: "text-primary" }
  ];

  const benefits = [
    { icon: DollarSign, title: "10% Commission", desc: "Earn 10% on every order you generate. No cap on earnings." },
    { icon: Zap, title: "Real-time Tracking", desc: "See every click, every order, and every naira you've earned in real time." },
    { icon: Shield, title: "Guaranteed Payouts", desc: "Earn above ₦5,000 threshold and withdraw directly to your bank account." },
    { icon: Star, title: "₦500 Sign-up Bonus", desc: "Get ₦500 credited to your wallet instantly upon approval. Refer friends for ₦300 each." }
  ];

  if (loggedIn && affiliate) {
    const isPending = affiliate.status === "pending";
    const isSuspended = affiliate.status === "suspended";

    return (
      <div className="bg-background min-h-screen">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="bg-muted py-16 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <Badge className="bg-accent/20 text-accent border-accent/30 mb-3 text-xs font-bold tracking-widest">Affiliate Dashboard</Badge>
                <h1 className="text-4xl font-black text-foreground">Welcome, {affiliate.name?.split(" ")[0]}!</h1>
                <button onClick={handleSignOut}
                  className="text-muted-foreground text-xs hover:text-destructive mt-1 transition-colors">Sign Out</button>
                <p className="text-muted-foreground mt-1">
                  Account Status:{" "}
                  <span className={`font-bold ${affiliate.status === "active" ? "text-green-400" : affiliate.status === "suspended" ? "text-destructive" : "text-orange-400"}`}>
                    {affiliate.status || "pending"}
                  </span>
                </p>
              </div>
              {!isSuspended &&
                <div className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border">
                  <div>
                    <p className="text-card-foreground/50 text-xs uppercase tracking-wide">Your Referral Code</p>
                    <p className={`font-black text-2xl ${isPending ? "blur-sm select-none text-muted-foreground" : "text-accent"}`}>
                      {isPending ? "PENDING" : affiliate.referral_code}
                    </p>
                  </div>
                  {!isPending &&
                    <button onClick={copyLink} className="ml-4 bg-accent/20 hover:bg-accent hover:text-accent-foreground text-accent rounded-xl p-3 transition-all duration-200">
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  }
                </div>
              }
            </div>
            {!isPending && !isSuspended &&
              <div className="mt-4 bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                <p className="text-card-foreground/50 text-xs flex-1 truncate">https://d-kadrisdenims.com/?ref={affiliate.referral_code}</p>
                <button onClick={copyLink} className="text-accent text-xs font-bold hover:underline">{copied ? "Copied!" : "Copy Link"}</button>
              </div>
            }
          </div>
        </motion.section>

        {/* Status banners */}
        {isPending &&
          <div className="max-w-5xl mx-auto px-6 mt-6">
            <div className="bg-orange-400/10 border border-orange-400/25 rounded-2xl p-5 flex items-start gap-4">
              <Clock className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 font-bold text-base">Account Pending Approval</p>
                <p className="text-orange-400/80 text-sm mt-1">Your account is undergoing review.
                  You cannot earn commissions or track sales until an admin approves your account.
                  You will receive an email notification once approved. Your ₦500 sign-up bonus is held until activation.</p>
              </div>
            </div>
          </div>
        }
        {isSuspended &&
          <div className="max-w-5xl mx-auto px-6 mt-6">
            <div className="bg-destructive/10 border border-destructive/25 rounded-2xl p-5 flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-destructive font-bold text-base">Account Suspended</p>
                <p className="text-destructive/80 text-sm mt-1">Your affiliate account has been suspended.
                  Your referral code is currently inactive and no commissions can be earned.
                  Please contact us on WhatsApp (+2348163914835) for assistance.</p>
              </div>
            </div>
          </div>
        }

        <section className="py-12 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {stats.map((s, i) =>
                <AnimatedElement key={s.label} delay={i * 80}>
                  <div className={`bg-card rounded-2xl p-5 border border-border hover:shadow-xl transition-all duration-300 group ${isPending || isSuspended ? "opacity-60" : ""}`}>
                    <s.icon className={`h-6 w-6 ${s.color} mb-3 group-hover:scale-110 transition-transform`} />
                    <p className={`font-black text-2xl ${s.color}`}>{s.value}</p>
                    <p className="text-card-foreground/50 text-xs mt-1">{s.label}</p>
                  </div>
                </AnimatedElement>
              )}
            </div>

            {/* Earning Progress */}
            <AnimatedElement delay={200}>
              <div className="bg-card rounded-2xl p-6 border border-border mb-6">
                <h3 className="text-card-foreground font-bold text-lg mb-4">Earning Progress to Next Payout</h3>
                <div className="flex justify-between text-sm text-card-foreground/60 mb-2">
                  <span>₦{(affiliate.pending_payout || 0).toLocaleString()}</span>
                  <span>₦5,000 threshold</span>
                </div>
                <Progress value={Math.min(100, (affiliate.pending_payout || 0) / 5000 * 100)} className="h-3 bg-muted" />
                <p className="text-card-foreground/50 text-xs mt-2">
                  {(affiliate.pending_payout || 0) >= 5000 ?
                    "You qualify for payout! Fill in your bank details below and click Request Payout." :
                    `₦${(5000 - (affiliate.pending_payout || 0)).toLocaleString()} more to qualify for withdrawal`}
                </p>
              </div>
            </AnimatedElement>

            {/* Bank Details */}
            <AnimatedElement delay={280}>
              <div className="bg-card rounded-2xl p-6 border border-border mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-card-foreground font-bold text-xl">Bank Account Details</h3>
                  {hasBankDetails && !editingBank &&
                    <button onClick={() => setEditingBank(true)} className="flex items-center gap-1 text-accent text-xs font-bold hover:underline">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  }
                </div>

                {!editingBank && hasBankDetails ?
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[["Bank Name", affiliate.bank_name], ["Account Number", affiliate.account_number], ["Account Name", affiliate.account_name]].map(([label, val]) =>
                      <div key={label} className="bg-muted rounded-xl p-3">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-card-foreground font-bold text-sm">{val}</p>
                      </div>
                    )}
                    {bankSaved && <p className="col-span-3 text-accent text-xs font-bold flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Details saved successfully.</p>}
                  </div> :

                  <form onSubmit={saveBankDetails} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Bank Name</Label><Input value={bankForm.bank_name} onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1" placeholder="GTBank, Access, UBA..." required /></div>
                      <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Account Number</Label><Input value={bankForm.account_number} onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1" placeholder="0123456789" required /></div>
                    </div>
                    <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Account Name</Label><Input value={bankForm.account_name} onChange={(e) => setBankForm((f) => ({ ...f, account_name: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1" required /></div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={savingBank} className="bg-primary text-primary-foreground font-bold rounded-full px-8 py-2.5 hover:scale-105 transition-all">
                        {savingBank ? "Saving..." : "Save Bank Details"}
                      </Button>
                      {hasBankDetails &&
                        <Button type="button" onClick={() => setEditingBank(false)} variant="outline" className="rounded-full px-6">Cancel</Button>
                      }
                    </div>
                  </form>
                }
              </div>
            </AnimatedElement>

            {/* Request Payout */}
            <AnimatedElement delay={350}>
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-card-foreground font-bold text-xl mb-2">Request Payout</h3>
                {payoutSuccess || affiliate.payout_requested ?
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="h-7 w-7 text-accent" /></div>
                    <h4 className="text-card-foreground font-bold text-xl mb-2">Payout Request Submitted!</h4>
                    <p className="text-card-foreground/60">Your request has been flagged for admin review. Payment will be processed within 24–48 hours.</p>
                  </div> :

                  <div className="space-y-4">
                    {!canRequestPayout &&
                      <p className="text-muted-foreground text-sm bg-muted rounded-xl p-3">
                        Minimum payout threshold is <strong className="text-foreground">₦5,000</strong>.
                        Your current balance is <strong className="text-accent">₦{(affiliate.pending_payout || 0).toLocaleString()}</strong>.
                      </p>
                    }
                    {!hasBankDetails && canRequestPayout &&
                      <p className="text-orange-400 text-sm bg-orange-400/10 border border-orange-400/20 rounded-xl p-3">
                        Please save your bank account details above before requesting a payout.
                      </p>
                    }
                    {isPending || isSuspended ?
                      <p className="text-muted-foreground text-sm">Payouts are only available for active accounts.</p> :

                      <Button
                        onClick={requestPayout}
                        disabled={!canRequestPayout || !hasBankDetails || payoutSubmitting || isPending || isSuspended}
                        className="bg-primary text-primary-foreground font-bold rounded-full px-8 py-3 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                        {payoutSubmitting ? "Submitting..." : "Request Payout"}
                      </Button>
                    }
                  </div>
                }
              </div>
            </AnimatedElement>
          </div>
        </section>

        <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 hover:scale-110 transition-all duration-300">
          <MessageCircle className="h-7 w-7 text-accent-foreground" />
        </a>
      </div>);
  }

  return (
    <div className="bg-background min-h-screen">
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="bg-muted py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <Badge className="bg-accent/20 text-accent border-accent/30 mb-6 text-xs font-bold tracking-widest uppercase">Affiliate Program</Badge>
          <h1 className="text-5xl sm:text-7xl font-black text-foreground mb-6 leading-tight">
            Earn with <br /><span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent animate-gradient-x">D-Kadris</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto mb-8">Share your unique link, earn 10% on every order you generate. No cap. No stress. Pure income.</p>
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {[["10%", "Commission Rate"], ["₦500", "Sign-up Bonus"], ["24h", "Payout Processing"], ["500+", "Active Affiliates"]].map(([num, label]) =>
              <div key={label} className="text-center min-w-[100px]">
                <div className="text-3xl font-black text-accent">{num}</div>
                <div className="text-muted-foreground text-sm">{label}</div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Benefits */}
      <AnimatedElement>
        <section className="bg-background py-20 px-6 pb-28">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-foreground mb-3">Why Join Our Program?</h2>
              <p className="text-muted-foreground">Built for Nigerian fashion influencers, content creators, and denim lovers.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
              {benefits.map((b, i) =>
                <AnimatedElement key={b.title} delay={i * 80}>
                  <div className="group p-px rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-accent/20 hover:from-primary/60 hover:to-accent/40 transition-all duration-500">
                    <div className="bg-card rounded-2xl p-7 h-full">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <b.icon className="h-6 w-6 text-accent" />
                      </div>
                      <h3 className="text-card-foreground font-bold text-xl mb-2">{b.title}</h3>
                      <p className="text-card-foreground/60">{b.desc}</p>
                    </div>
                  </div>
                </AnimatedElement>
              )}
            </div>

            {/* Auth forms */}
            <AnimatedElement delay={200}>
              <div className="max-w-lg mx-auto">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="w-full bg-muted mb-8 rounded-full p-1">
                    <TabsTrigger value="join" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Join as Affiliate</TabsTrigger>
                    <TabsTrigger value="login" className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Log In</TabsTrigger>
                  </TabsList>

                  <TabsContent value="join">
                    <div className="bg-card rounded-2xl p-8 border border-border shadow-2xl">
                      <h3 className="text-card-foreground font-black text-2xl mb-6 text-center">Create Affiliate Account</h3>
                      {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 rounded-lg p-3">{error}</p>}

                      <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-3 py-2 mb-4">
                        <Gift className="h-4 w-4 text-accent shrink-0" />
                        <p className="text-accent text-xs font-medium">₦500 sign-up bonus credited upon account approval!</p>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-4">
                        <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Full Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" required /></div>
                        <div>
                          <Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Email Address</Label>
                          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" required />
                          <p className="text-muted-foreground text-xs mt-1">Disposable/temporary emails are blocked.</p>
                        </div>
                        <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Phone Number</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" placeholder="e.g. 08012345678" required /></div>
                        <div>
                          <Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Password</Label>
                          <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" required />
                          <p className="text-muted-foreground text-xs mt-1">Min. 8 characters · at least 1 number · 1 special character (e.g. @#$%)</p>
                        </div>
                        <div>
                          <Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Referral Code (optional)</Label>
                          <Input value={form.referral_code} onChange={(e) => setForm((f) => ({ ...f, referral_code: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" placeholder="Who referred you?" />
                          <p className="text-muted-foreground text-xs mt-1">Referring affiliate earns ₦300 bonus.Self-referral is strictly prohibited.</p>
                        </div>
                        <div className="flex items-start gap-3 pt-2">
                          <input type="checkbox" id="terms" checked={form.agreed} onChange={(e) => setForm((f) => ({ ...f, agreed: e.target.checked }))} className="mt-1 accent-primary" />
                          <label htmlFor="terms" className="text-card-foreground/70 text-sm">
                            I accept the{" "}
                            <button type="button" onClick={() => setTermsOpen(true)} className="text-accent hover:underline font-bold">Terms and Conditions</button>
                            {" "}and agree to the 10% commission structure.
                          </label>
                        </div>
                        <Button type="submit" disabled={submitting} className="relative overflow-hidden w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-full hover:scale-105 transition-all mt-2">
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />
                          {submitting ? "Creating Account..." : "Join Now — It's Free"}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  <TabsContent value="login">
                    <div className="bg-card rounded-2xl p-8 border border-border shadow-2xl">
                      <h3 className="text-card-foreground font-black text-2xl mb-6 text-center">Affiliate Login</h3>
                      {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 rounded-lg p-3">{error}</p>}
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Email Address</Label><Input type="email" value={loginForm.email} onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" required /></div>
                        <div><Label className="text-card-foreground/70 text-xs uppercase tracking-wide">Password</Label><Input type="password" value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} className="bg-muted border-border text-card-foreground mt-1 rounded-xl h-12" required /></div>
                        <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-full hover:scale-105 transition-all mt-2">
                          {submitting ? "Signing in..." : "Sign In to Dashboard"}
                        </Button>
                      </form>
                      <p className="text-card-foreground/50 text-sm text-center mt-4">Don't have an account? <button onClick={() => setTab("join")} className="text-accent hover:underline font-bold">Join for free</button></p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </AnimatedElement>
          </div>
        </section>
      </AnimatedElement>

      {/* How It Works */}
      <AnimatedElement>
        <section className="bg-primary py-20 pb-28 px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h2 className="text-4xl font-black text-primary-foreground mb-4">How It Works</h2>
            <p className="text-primary-foreground/70 mb-12 max-w-xl mx-auto">Three simple steps to start earning with D-Kadris Denims</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Register Free", desc: "Sign up with your details and get your unique referral code instantly. Receive ₦500 bonus on approval." },
                { step: "02", title: "Share Your Code", desc: "Tell buyers to enter your referral code in checkout. Post on WhatsApp, Instagram, TikTok." },
                { step: "03", title: "Earn 10%", desc: "Every order with your code earns you 10% commission. Withdraw once you hit ₦5,000." }
              ].map((step, i) =>
                <AnimatedElement key={step.step} delay={i * 100}>
                  <div className="text-center">
                    <div className="text-6xl font-black text-primary-foreground/20 mb-3">{step.step}</div>
                    <h3 className="text-primary-foreground font-bold text-xl mb-2">{step.title}</h3>
                    <p className="text-primary-foreground/70">{step.desc}</p>
                  </div>
                </AnimatedElement>
              )}
            </div>
          </div>
        </section>
      </AnimatedElement>

      <a href="https://wa.me/2348163914835" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 hover:scale-110 transition-all duration-300">
        <MessageCircle className="h-7 w-7 text-accent-foreground" />
      </a>
    </div>);
}
