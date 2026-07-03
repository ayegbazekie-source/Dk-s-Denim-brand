import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Affiliate from './pages/Affiliate';
import Layout from './components/Layout';
import Admin from './pages/Admin';

// FIX: Pointing directly to the correct pages folder location
import PageNotFound from './pages/PageNotFound';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, settings } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref) {
        localStorage.setItem("dkadris_affiliate_ref", ref.trim().toUpperCase());
        console.log("🎯 Affiliate tracking code permanently locked:", ref.trim().toUpperCase());
      }
    }
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Strict Maintenance Flag Evaluation
  let isMaintenanceMode = false;
  if (Array.isArray(settings)) {
    const maintenanceRow = settings.find(item => item.key === 'maintenance_mode' || item.key === 'maintenance');
    isMaintenanceMode = maintenanceRow?.value === 'maintenance';
  } else if (settings && typeof settings === 'object') {
    isMaintenanceMode = settings.maintenance_mode === 'maintenance' || settings.maintenance === 'maintenance';
  }

  const isAdminPath = location.pathname.toLowerCase().startsWith('/admin');

  if (isMaintenanceMode && !isAdminPath) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#111111] text-white p-6 z-[9999]">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-[#1c1c1e] border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-[#D4AF37] font-black text-2xl tracking-tighter">DKs</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-wide text-white uppercase">System Optimization</h1>
            <p className="text-[#D4AF37] text-xs uppercase tracking-widest font-bold">D-Kadris Atelier &bull; Digital Studio</p>
          </div>

          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto" />

          <p className="text-zinc-400 text-sm leading-relaxed">
            Our marketplace is briefly offline while we fine-tune our structural design layers and pattern drafting engines. Handcrafted tailoring updates complete shortly.
          </p>

          <p className="text-zinc-600 text-[11px] font-mono">
            Administration updates are currently propagating live.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/Catalog" element={<Catalog />} />
        <Route path="/Affiliate" element={<Affiliate />} />
      </Route>
      <Route path="/Admin" element={<Admin />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
