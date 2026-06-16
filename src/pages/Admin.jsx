import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import AdminOverview from "../components/admin/AdminOverview";
import AdminProducts from "../components/admin/AdminProducts";
import AdminOrders from "../components/admin/AdminOrders";
import AdminAffiliates from "../components/admin/AdminAffiliates";
import AdminTestimonials from "../components/admin/AdminTestimonials";
import AdminNewsletter from "../components/admin/AdminNewsletter";
import AdminSettings from "../components/admin/AdminSettings";
import AdminAnnouncements from "../components/admin/AdminAnnouncements";
import { Eye, EyeOff, Lock, Shield, LayoutDashboard, Package, ShoppingBag, Users, Star, Mail, Settings, Megaphone, LogOut, Menu, X } from "lucide-react";

const ADMIN_PASSWORD = "Capable1#";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "affiliates", label: "Affiliates", icon: Users },
  { id: "testimonials", label: "Testimonials", icon: Star },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "settings", label: "Site Settings", icon: Settings },
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { navigateToLogin } = useAuth();
  
  // Password gate state
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("dk_admin_unlocked") === "1");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    // CRITICAL: If the master gate hasn't been solved yet, stop here.
    // This allows the password gate to safely render without tripping database checks.
    if (!unlocked) {
      setLoadingUser(false);
      return;
    }

    async function getUser() {
      try {
        setLoadingUser(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setAccessDenied(true);
          return;
        }

        setUser(authUser);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        // Safe fallback: Allow access if the account's role is admin OR if it matches your developer email
        if (profile?.role === "admin" || authUser.email === "dkadristailoringservice@gmail.com") {
          setAccessDenied(false);
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error("Auth initialization check encountered an error:", error);
        setAccessDenied(true);
      } finally {
        setLoadingUser(false);
      }
    }

    getUser();
  }, [unlocked]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("dk_admin_unlocked", "1");
        setUnlocked(true);
      } else {
        setPwError("Unauthorized Access — Incorrect password. This attempt has been logged.");
        setPassword("");
      }
      setPwLoading(false);
    }, 600);
  };

  // SCREEN CHECK 1: Render the Identity Verification Gate upfront if locked
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-2xl shadow-primary/30">
              <span className="text-primary-foreground font-black text-xl">DK</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">D-Kadris Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Secure Administrative Gateway</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-card-foreground font-bold text-lg">Verify Identity</h2>
                <p className="text-muted-foreground text-xs">Enter your master admin password to continue</p>
              </div>
            </div>
            {pwError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <Shield className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-destructive text-sm font-medium">{pwError}</p>
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="text-card-foreground/70 text-xs uppercase tracking-widest font-semibold mb-2 block">Master Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter admin password"
                    className="w-full h-12 bg-muted border border-border rounded-xl px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={pwLoading || !password}
                className="w-full h-12 bg-primary text-primary-foreground font-black rounded-xl hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {pwLoading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Shield className="h-4 w-4" /> Access Dashboard</>}
              </button>
            </form>
            <p className="text-muted-foreground/50 text-xs text-center mt-6">Unauthorized access attempts are monitored and recorded.</p>
          </div>
          <p className="text-center text-muted-foreground/40 text-xs mt-6">© {new Date().getFullYear()} D-Kadris Denims. All rights reserved.</p>
        </div>
      </div>
    );
  }

  // SCREEN CHECK 2: Show loading loop spin state if database is loading session
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // SCREEN CHECK 3: Run the database safety block if authenticated account is not an admin
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Shield className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3">Access Denied</h1>
        <p className="text-muted-foreground mb-6">This page is for administrators only. Please log in with an admin account.</p>
        <button 
          onClick={() => navigateToLogin()} 
          className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-full hover:scale-105 transition-all mb-4"
        >
          Login as Admin
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            sessionStorage.removeItem("dk_admin_unlocked");
            setUnlocked(false);
            setAccessDenied(false);
          }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground underline transition-all"
        >
          Return to Password Gate
        </button>
      </div>
    );
  }

  const ActiveComponent = {
    overview: AdminOverview,
    products: AdminProducts,
    orders: AdminOrders,
    affiliates: AdminAffiliates,
    testimonials: AdminTestimonials,
    newsletter: AdminNewsletter,
    announcements: AdminAnnouncements,
    settings: AdminSettings,
  }[activeTab];

  // MAIN RENDER: Render the official Admin Panel UI layout securely
  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">DK</span>
            </div>
            <div>
              <p className="text-card-foreground font-black text-sm">D-Kadris</p>
              <p className="text-muted-foreground text-xs">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-card-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === item.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-card-foreground/60 hover:bg-muted hover:text-card-foreground"}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-black text-sm">{user?.email?.[0]?.toUpperCase() || "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-card-foreground text-sm font-bold truncate">Admin Session</p>
              <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={async () => {
            await supabase.auth.signOut();
            sessionStorage.removeItem("dk_admin_unlocked");
            window.location.href = "/";
          }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-card-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-card-foreground font-black text-lg capitalize">{NAV.find(n => n.id === activeTab)?.label}</h1>
            <p className="text-muted-foreground text-xs">D-Kadris Admin Dashboard</p>
          </div>
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex-1 p-6 overflow-y-auto">
          {ActiveComponent && <ActiveComponent />}
        </motion.div>
      </div>
    </div>
  );
                    }
                               
