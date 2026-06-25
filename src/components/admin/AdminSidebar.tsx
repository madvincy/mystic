// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Percent,
  Clock,
  Box,
  Upload,
  Download,
  Settings,
  LogOut,
  Gift,
  Flame,
  BarChart3,
  Truck,
  CreditCard,
  Shield,
  Bell,
  FileText,
  Image as ImageIcon,
  Star,
  Zap,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { memo, useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  badgeKey?: string; // For dynamic badge updates
}

// ✅ Memoize the sidebar to prevent re-renders
const AdminSidebar = memo(function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // ✅ Fetch notification counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch unread notifications
        const { count: unread, error: notifError } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);

        if (!notifError) {
          setUnreadNotificationCount(unread || 0);
        }

        // Fetch pending orders (status = 'pending' or 'processing')
        const { count: pending, error: orderError } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "processing"]);

        if (!orderError) {
          setPendingOrderCount(pending || 0);
        }

        // Fetch low stock products (stock < 10)
        const { count: lowStock, error: stockError } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .lt("stock", 10);

        if (!stockError) {
          setLowStockCount(lowStock || 0);
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();

    // Set up real-time subscriptions
    const channel = supabase
      .channel("sidebar-counts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Refetch notification count
          supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("is_read", false)
            .then(({ count }) => {
              if (count !== null) setUnreadNotificationCount(count);
            });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          // Refetch order count
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .in("status", ["pending", "processing"])
            .then(({ count }) => {
              if (count !== null) setPendingOrderCount(count);
            });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          // Refetch stock count
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .lt("stock", 10)
            .then(({ count }) => {
              if (count !== null) setLowStockCount(count);
            });
        },
      )
      .subscribe();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .then(({ count }) => {
          if (count !== null) setUnreadNotificationCount(count);
        });
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: <Package className="h-5 w-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      badge: pendingOrderCount > 0 ? pendingOrderCount : undefined,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Categories",
      href: "/admin/categories",
      icon: <Tag className="h-5 w-5" />,
    },
    {
      title: "Discounts",
      href: "/admin/discounts",
      icon: <Percent className="h-5 w-5" />,
    },
    {
      title: "Flash Sales",
      href: "/admin/flash-sales",
      icon: <Flame className="h-5 w-5" />,
    },
    {
      title: "Featured Products",
      href: "/admin/featured",
      icon: <Star className="h-5 w-5" />,
    },
    {
      title: "Inventory",
      href: "/admin/inventory",
      icon: <Box className="h-5 w-5" />,
    },
    {
      title: "Bulk Upload",
      href: "/admin/bulk-upload",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      title: "Export Data",
      href: "/admin/export",
      icon: <Download className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Advertisements",
      href: "/admin/ads",
      icon: <ImageIcon className="h-5 w-5" />,
    },
    {
      title: "Gift Cards",
      href: "/admin/gifts",
      icon: <Gift className="h-5 w-5" />,
    },
    {
      title: "Shipping",
      href: "/admin/shipping",
      icon: <Truck className="h-5 w-5" />,
    },
    {
      title: "Payments",
      href: "/admin/payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: <Bell className="h-5 w-5" />,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
    },
    {
      title: "Blogs",
      href: "/admin/blog",
      icon: <Book className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: <FileText className="h-5 w-5" />, 
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  // ✅ Fix: Properly detect active route
  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href) && href !== "/admin";
  };

  return (
    <aside className="h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Logo */}
        {/* <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </span>
        </div> */}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.title}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        item.title === "Notifications"
                          ? "bg-pink-600 text-white animate-pulse"
                          : item.title === "Orders"
                            ? "bg-blue-600 text-white"
                            : item.title === "Products"
                              ? "bg-orange-600 text-white"
                              : "bg-pink-600 text-white",
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer - Sign Out */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
});

export default AdminSidebar;
