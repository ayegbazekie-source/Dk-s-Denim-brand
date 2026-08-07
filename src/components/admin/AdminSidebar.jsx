import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingBag, 
  Package, 
  Users, 
  Megaphone, 
  Mail, 
  Settings, 
  MessageSquare 
} from "lucide-react";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 }, // DEDICATED TAB
  { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Affiliates", path: "/admin/affiliates", icon: Users },
  { label: "Announcements", path: "/admin/announcements", icon: Megaphone },
  { label: "Newsletter", path: "/admin/newsletter", icon: Mail },
  { label: "Testimonials", path: "/admin/testimonials", icon: MessageSquare },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];
