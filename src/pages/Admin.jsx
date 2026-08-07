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
import AdminAnalytics from "../components/admin/AdminAnalytics";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  LayoutDashboard, 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Users, 
  Star, 
  Mail, 
  Settings, 
  Megaphone, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from "lucide-react";

const ADMIN_PASSWORD = "Capable1#";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
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
  
  // Persist current tab in localStorage so refreshing/mobile switching doesn't reset to overview
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("dk_admin_tab") || "overview";
  });
  
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
    localStorage.setItem("dk_admin_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!unlocked) {
      setLoadingUser(false);
      return;
    }

    setAccessDenied(false);
    setLoadingUser(false);
  }, [unlocked]);
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("dk_admin_unlocked", "1");
        setUnlocked(true);
        setAccessDenied(false);
      } else {
        setPwError("Unauthorized Access — Incorrect password. Attempt logged.");
        setPassword("");
      }
      setPwLoading(false);
    }, 600);
  };

  // 1. Password Verification Screen
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl rounded-2xl mb-4 shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/10">
              DK
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">D-Kadris Admin</h1>
            <p className="text-slate-400 text-xs mt-1 font-semibold tracking-wide uppercase">Atelier Control System</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Verify Access</h2>
                <p className="text-slate-400 text-xs">Enter master administrative credentials</p>
              </div>
            </div>

            {pwError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3 text-rose-400">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{pwError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="text-slate-300 text-[11px] uppercase tracking-wider font-bold mb-2 block">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="••••••••••••"
                    className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={pwLoading || !password}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {pwLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4" /> Access Dashboard
                  </>
                )}
              </button>
            </form>
          </div>
          <p className="text-center text-slate-600 text-xs mt-8">© {new Date().getFullYear()} D-Kadris Denims. All rights reserved.</p>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Access Denied Fallback
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <Shield className="h-10 w-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black mb-2">Access Restricted</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">Administrator verification failed. Please authenticate with an authorized account.</p>
        
        <button 
          onClick={() => navigateToLogin()} 
          className="bg-amber-500 text-slate-950 font-black px-8 py-3 rounded-xl hover:bg-amber-400 transition-all mb-4 text-sm"
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
          className="text-xs font-bold text-slate-400 hover:text-white underline transition-all"
        >
          Return to Lock Screen
        </button>
      </div>
    );
  }

  // Active Component Mapping
  const ActiveComponent = {
    overview: AdminOverview,
    analytics: AdminAnalytics,
    products: AdminProducts,
    orders: AdminOrders,
    affiliates: AdminAffiliates,
    testimonials: AdminTestimonials,
    newsletter: AdminNewsletter,
    announcements: AdminAnnouncements,
    settings: AdminSettings,
  }[activeTab];

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex font-sans">
      
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#0d1835] border-r border-slate-800/80 z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-950 font-black text-sm">DK</span>
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">D-Kadris</p>
              <p className="text-amber-400 text-[10px] font-bold tracking-wider uppercase mt-1">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button 
                key={item.id} 
                onClick={() => { 
                  setActiveTab(item.id); 
                  setSidebarOpen(false); 
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive 
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20" 
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-slate-950" : "text-amber-400/80"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Session Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              sessionStorage.removeItem("dk_admin_unlocked");
              localStorage.removeItem("dk_admin_tab");
              window.location.href = "/";
            }} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080e21]">
        
        {/* Top Header Bar */}
        <div className="bg-[#0d1835]/90 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-800 bg-slate-900"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-white font-black text-lg capitalize flex items-center gap-2">
                {NAV.find(n => n.id === activeTab)?.label}
              </h1>
              <p className="text-slate-400 text-[11px] font-medium">Real-time studio & store analytics management</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Live Studio System</span>
          </div>
        </div>

        {/* Dynamic Tab Renderer */}
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.2 }} 
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6"
        >
          {ActiveComponent ? <ActiveComponent /> : <AdminOverview />}
        </motion.div>
      </div>

    </div>
  );
      }
        
