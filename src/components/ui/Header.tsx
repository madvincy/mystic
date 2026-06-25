// src/components/ui/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import { setCartOpen } from "@/lib/store/uiSlice";
import { loadCartFromCache } from "@/lib/store/cartSlice";
import {
  Menu,
  X,
  Search,
  User,
  Heart,
  ShoppingBag,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Wine,
  Beer,
  Martini,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { Button } from "@/components/shadCn/ui/button";
import { Input } from "@/components/shadCn/ui/input";
import { useTheme } from "next-themes";
import CartDrawer from "./CartDrawer";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

// Category structure with subcategories
const categoryStructure = {
  Wine: {
    icon: Wine,
    slug: "wine",
    subcategories: [
      { name: "Red Wine", slug: "red-wine" },
      { name: "White Wine", slug: "white-wine" },
      { name: "Rose Wine", slug: "rose-wine" },
      { name: "Sparkling Wine", slug: "sparkling-wine" },
      { name: "Dessert Wine", slug: "dessert-wine" },
    ],
  },
  Beer: {
    icon: Beer,
    slug: "beer",
    subcategories: [
      { name: "Lager", slug: "lager" },
      { name: "Ale", slug: "ale" },
      { name: "Stout", slug: "stout" },
      { name: "Pilsner", slug: "pilsner" },
      { name: "Craft Beer", slug: "craft-beer" },
      { name: "Imported Beer", slug: "imported-beer" },
    ],
  },
  Spirits: {
    icon: Martini,
    slug: "spirits",
    subcategories: [
      { name: "Whiskey", slug: "whiskey" },
      { name: "Vodka", slug: "vodka" },
      { name: "Gin", slug: "gin" },
      { name: "Rum", slug: "rum" },
      { name: "Tequila", slug: "tequila" },
      { name: "Brandy", slug: "brandy" },
      { name: "Cognac", slug: "cognac" },
      { name: "Liqueurs", slug: "liqueurs" },
    ],
  },
};

// Other categories for the "More" dropdown
const otherCategories = [
  { name: "Energy Drinks", slug: "energy-drinks" },
  { name: "Merchandise", slug: "merchandise" },
  { name: "Vermouth & Shooters", slug: "vermouth-shooters" },
  { name: "Gift Sets", slug: "gifts" },
  { name: "Accessories", slug: "accessories" },
];

export default function Header() {
  // ✅ ALL HOOKS AT THE TOP
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { itemCount } = useSelector((state: RootState) => state.cart);
  const { isCartOpen } = useSelector((state: RootState) => state.ui);

  const { user, isAdmin, loading: authLoading, signOut } = useSupabaseAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // ✅ useEffect for mounting and scroll
  useEffect(() => {
    setMounted(true);
    dispatch(loadCartFromCache());

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dispatch]);

  // ✅ Early return AFTER all hooks have been called
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // ✅ Event handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCartToggle = () => {
    dispatch(setCartOpen(!isCartOpen));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Navigation items
  const navigation = [
    { name: "GIFTS", href: "/gifts" },
    { name: "BLOG", href: "/blog" },
    { name: "CONTACT", href: "/contact" },
  ];

  // Helper to check if path is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) || false;
  };

  // Helper to check if a category is active
  const isCategoryActive = (categoryName: string) => {
    const categorySlugs = {
      Wine: [
        "wine",
        "red-wine",
        "white-wine",
        "rose-wine",
        "sparkling-wine",
        "dessert-wine",
      ],
      Beer: [
        "beer",
        "lager",
        "ale",
        "stout",
        "pilsner",
        "craft-beer",
        "imported-beer",
      ],
      Spirits: [
        "spirits",
        "whiskey",
        "vodka",
        "gin",
        "rum",
        "tequila",
        "brandy",
        "cognac",
        "liqueurs",
      ],
    };

    const slugs =
      categorySlugs[categoryName as keyof typeof categorySlugs] || [];
    return slugs.some(
      (slug) =>
        pathname?.includes(`/products/${slug}`) ||
        pathname?.includes(`?subcategory=${slug}`) ||
        pathname?.includes(`?category=${slug}`),
    );
  };

  const getCategorySlug = (categoryName: string) => {
    const categoryMap = {
      Wine: "wine",
      Beer: "beer",
      Spirits: "spirits",
    };
    return categoryMap[categoryName as keyof typeof categoryMap] || "";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md"
            : "bg-white dark:bg-gray-900"
        } border-b border-gray-200 dark:border-gray-800`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo with Image and Centered Mission */}
            <Link
              href="/"
              className="flex flex-col items-center shrink-0 group"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
                  <Image
                    src="/images/logos/main-logo.png"
                    alt="Mystic Liqour Store"
                    width={100}
                    height={100}
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-display font-bold text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform tracking-wide drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                    Mystic Liqour Store
                  </span>
                  {/* Business Mission - Centered below the store name */}
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs font-serif font-light italic tracking-widest bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent -mt-0.5 text-center"
                  >
                    Drink Your Worth
                  </motion.span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation with Dropdowns */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* Wine Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setHoveredCategory("wine")}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/products?category=${getCategorySlug("Wine")}`}
                  className={cn(
                    "flex items-center gap-1 text-xl font-medium transition-colors py-2",
                    isCategoryActive("Wine")
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400",
                  )}
                >
                  <Wine className="h-4 w-4" />
                  Wine
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      hoveredCategory === "wine" ? "rotate-180" : ""
                    }`}
                  />
                  {isCategoryActive("Wine") && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-pink-600 rounded-full animate-pulse" />
                  )}
                </Link>
                <AnimatePresence>
                  {hoveredCategory === "wine" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {categoryStructure.Wine.subcategories.map((sub) => {
                        const isSubActive = pathname?.includes(
                          `?subcategory=${sub.slug}`,
                        );
                        return (
                          <Link
                            key={sub.slug}
                            href={`/products?subcategory=${sub.slug}`}
                            className={cn(
                              "block px-4 py-2 text-xl transition-colors",
                              isSubActive
                                ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium"
                                : "hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600",
                            )}
                            onClick={() => setHoveredCategory(null)}
                          >
                            {sub.name}
                            {isSubActive && (
                              <span className="ml-2 text-xs text-pink-600">
                                ●
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Beer Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setHoveredCategory("beer")}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/products?category=${getCategorySlug("Beer")}`}
                  className={cn(
                    "flex items-center gap-1 text-xl font-medium transition-colors py-2",
                    isCategoryActive("Beer")
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400",
                  )}
                >
                  <Beer className="h-4 w-4" />
                  Beer
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      hoveredCategory === "beer" ? "rotate-180" : ""
                    }`}
                  />
                  {isCategoryActive("Beer") && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-pink-600 rounded-full animate-pulse" />
                  )}
                </Link>
                <AnimatePresence>
                  {hoveredCategory === "beer" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {categoryStructure.Beer.subcategories.map((sub) => {
                        const isSubActive = pathname?.includes(
                          `?subcategory=${sub.slug}`,
                        );
                        return (
                          <Link
                            key={sub.slug}
                            href={`/products?subcategory=${sub.slug}`}
                            className={cn(
                              "block px-4 py-2 text-xl transition-colors",
                              isSubActive
                                ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium"
                                : "hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600",
                            )}
                            onClick={() => setHoveredCategory(null)}
                          >
                            {sub.name}
                            {isSubActive && (
                              <span className="ml-2 text-xs text-pink-600">
                                ●
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Spirits Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setHoveredCategory("spirits")}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/products?category=${getCategorySlug("Spirits")}`}
                  className={cn(
                    "flex items-center gap-1 text-xl font-medium transition-colors py-2",
                    isCategoryActive("Spirits")
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400",
                  )}
                >
                  <Martini className="h-4 w-4" />
                  Spirits
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      hoveredCategory === "spirits" ? "rotate-180" : ""
                    }`}
                  />
                  {isCategoryActive("Spirits") && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-pink-600 rounded-full animate-pulse" />
                  )}
                </Link>
                <AnimatePresence>
                  {hoveredCategory === "spirits" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {categoryStructure.Spirits.subcategories.map((sub) => {
                        const isSubActive = pathname?.includes(
                          `?subcategory=${sub.slug}`,
                        );
                        return (
                          <Link
                            key={sub.slug}
                            href={`/products?subcategory=${sub.slug}`}
                            className={cn(
                              "block px-4 py-2 text-xl transition-colors",
                              isSubActive
                                ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium"
                                : "hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600",
                            )}
                            onClick={() => setHoveredCategory(null)}
                          >
                            {sub.name}
                            {isSubActive && (
                              <span className="ml-2 text-xs text-pink-600">
                                ●
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* More Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setShowMoreMenu(true)}
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                <button className="flex items-center gap-1 text-xl font-medium hover:text-pink-600 dark:hover:text-pink-400 transition-colors py-2">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      showMoreMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {otherCategories.map((cat) => {
                        const isActive =
                          pathname?.includes(`?category=${cat.slug}`) ||
                          pathname?.includes(`/products/${cat.slug}`);
                        return (
                          <Link
                            key={cat.slug}
                            href={`/products?category=${cat.slug}`}
                            className={cn(
                              "block px-4 py-2 text-xl transition-colors",
                              isActive
                                ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium"
                                : "hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600",
                            )}
                            onClick={() => setShowMoreMenu(false)}
                          >
                            {cat.name}
                            {isActive && (
                              <span className="ml-2 text-xs text-pink-600">
                                ●
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other navigation items */}
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "text-xl font-medium transition-colors relative group py-2",
                      active
                        ? "text-pink-600 dark:text-pink-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400",
                    )}
                  >
                    {item.name}
                    <span
                      className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-pink-600 transition-all duration-300",
                        active ? "w-full" : "w-0 group-hover:w-full",
                      )}
                    />
                    {active && item.name !== "HOME" && (
                      <span className="absolute -top-1 -right-2 h-2 w-2 bg-pink-600 rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ✅ Actions - Desktop & Mobile */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search - Desktop only */}
              <form
                onSubmit={handleSearch}
                className="hidden md:block relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 w-48 lg:w-64 rounded-full border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* ✅ Theme Toggle - Hidden on mobile (already in mobile menu) */}
              <div className="hidden md:block">
                {mounted && <ThemeToggle />}
              </div>

              {/* ✅ User - Hidden on mobile (already in mobile menu) */}
              <div className="hidden md:block relative group">
                <Link href={user ? "/profile" : "/auth/login"}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full relative"
                  >
                    <User className="h-5 w-5" />
                    {user && (
                      <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </Button>
                </Link>
                {user && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-sm">
                        {user.user_metadata?.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Orders
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-pink-600"
                        >
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Wishlist - Hidden on mobile (already in mobile menu) */}
              <div className="hidden md:block">
                <Link href="/wishlist">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full relative"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* ✅ Cart - Visible on all screen sizes */}
              {/* <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative"
                onClick={handleCartToggle}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Button> */}

              {/* ✅ Mobile Menu Toggle - Only visible on mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  // <X className="h-5 w-5" />
                  <div></div>
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => dispatch(setCartOpen(false))}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}