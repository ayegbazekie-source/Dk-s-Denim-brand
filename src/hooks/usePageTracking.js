import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Skip tracking for admin panel views
    if (location.pathname.startsWith("/admin")) return;

    const recordView = async () => {
      try {
        await supabase.from("page_views").insert([
          {
            page_path: location.pathname,
            user_agent: navigator.userAgent,
          },
        ]);
      } catch (err) {
        console.error("Error logging page view:", err.message);
      }
    };

    recordView();
  }, [location.pathname]);
}
