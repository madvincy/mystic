// src/components/ui/AdSlider.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ShoppingCart,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/shadCn/ui/button";
import { Badge } from "@/components/shadCn/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { addItem } from "@/lib/store/cartSlice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  product_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  display_type:
    | "product"
    | "category"
    | "subcategory"
    | "custom"
    | "multiple_products";
  cta_text: string;
  order_position: number;
  is_active: boolean;
  product_ids?: string[];
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    slug: string;
  };
  products?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    slug: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface AdSliderProps {
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  showDots?: boolean;
  fullWidth?: boolean;
  limit?: number;
}

export default function AdSlider({
  className = "",
  autoPlay = true,
  interval = 30000,
  showControls = true,
  showDots = true,
  fullWidth = true,
  limit = 5,
}: AdSliderProps) {
  const dispatch = useDispatch();
  const [ads, setAds] = useState<Ad[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data: adsData, error: adsError } = await supabase
          .from("advertisements")
          .select(
            `
          *,
          product:products(id, name, price, images, slug)
        `
          )
          .eq("is_active", true)
          .order("order_position", { ascending: true })
          .limit(limit);

        if (adsError) throw adsError;

        const now = new Date().toISOString();
        const filteredAds =
          adsData?.filter((ad) => {
            if (!ad.end_date) return true;
            return ad.end_date >= now;
          }) || [];

        const adsWithProducts = await Promise.all(
          filteredAds.map(async (ad) => {
            if (ad.display_type === "multiple_products" && ad.product_ids?.length > 0) {
              const { data: productsData } = await supabase
                .from("products")
                .select("id, name, price, images, slug")
                .in("id", ad.product_ids);
              return { ...ad, products: productsData || [] };
            }
            return ad;
          })
        );

        setAds(adsWithProducts);

        const categoryIds =
          adsData
            ?.filter((ad) => ad.display_type === "category" && ad.category_id)
            .map((ad) => ad.category_id) || [];
        const subcategoryIds =
          adsData
            ?.filter(
              (ad) => ad.display_type === "subcategory" && ad.subcategory_id
            )
            .map((ad) => ad.subcategory_id) || [];

        let fetchedProducts: any[] = [];

        if (categoryIds.length > 0) {
          const { data: catProducts } = await supabase
            .from("products")
            .select("*, category:categories(name)")
            .in("category_id", categoryIds)
            .limit(20);
          if (catProducts) {
            fetchedProducts = [...fetchedProducts, ...catProducts];
          }
        }

        if (subcategoryIds.length > 0) {
          const { data: subProducts } = await supabase
            .from("products")
            .select("*, subcategory:subcategories(name)")
            .in("subcategory_id", subcategoryIds)
            .limit(20);
          if (subProducts) {
            fetchedProducts = [...fetchedProducts, ...subProducts];
          }
        }

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [limit]);

  useEffect(() => {
    if (ads.length === 0 || !autoPlay || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, interval);

    return () => clearInterval(timer);
  }, [ads.length, autoPlay, interval, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product) return;

    const price = product.sale_price || product.price;

    dispatch(
      addItem({
        id: product.id,
        productId: product.id,
        variantId: undefined,
        name: product.name,
        variantValue: undefined,
        price: price,
        quantity: 1,
        image: product.images?.[0] || "/images/placeholder.jpg",
        stock: product.stock || 0,
      })
    );

    setAddedProducts((prev) => new Set(prev).add(product.id));
    toast.success(`Added ${product.name} to cart! 🛒`);
    setTimeout(() => {
      setAddedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div
        className={cn(
          "relative bg-gray-200 dark:bg-gray-800",
          // ✅ Mobile: taller aspect ratio, Desktop: standard
          "aspect-[4/3] sm:aspect-[16/6]",
          "min-h-[300px] sm:min-h-[200px] md:min-h-[300px] lg:min-h-[400px] max-h-[500px] sm:max-h-[400px]",
          fullWidth
            ? "w-screen relative left-1/2 -translate-x-1/2"
            : "rounded-xl",
          className
        )}
      />
    );
  }

  if (ads.length === 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-gray-100 dark:bg-gray-800",
          // ✅ Mobile: taller aspect ratio, Desktop: standard
          "aspect-[4/3] sm:aspect-[16/6]",
          "min-h-[300px] sm:min-h-[200px] md:min-h-[300px] lg:min-h-[400px] max-h-[500px] sm:max-h-[400px]",
          "flex items-center justify-center",
          fullWidth ? "w-full -mx-4 sm:-mx-6 lg:-mx-8" : "rounded-xl",
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">
          No advertisements available
        </p>
      </div>
    );
  }

  const currentAd = ads[currentIndex];

  const getAdProducts = () => {
    if (!currentAd) return [];
    
    if (currentAd.display_type === "multiple_products" && currentAd.products) {
      return currentAd.products.slice(0, 6);
    }
    if (currentAd.display_type === "product" && currentAd.product) {
      return [currentAd.product];
    }
    if (currentAd.display_type === "category" && currentAd.category_id) {
      return products
        .filter((p) => p.category_id === currentAd.category_id)
        .slice(0, 4);
    }
    if (currentAd.display_type === "subcategory" && currentAd.subcategory_id) {
      return products
        .filter((p) => p.subcategory_id === currentAd.subcategory_id)
        .slice(0, 4);
    }
    return [];
  };

  const adProducts = getAdProducts();

  return (
    <div
      className={cn(
        "relative overflow-hidden group",
        fullWidth
          ? "w-screen relative left-1/2 -translate-x-1/2"
          : "rounded-xl",
        className
      )}
    >
      <div 
        className={cn(
          "relative w-full",
          // ✅ Mobile: taller aspect ratio (4:3), Desktop: widescreen (16:6)
          "aspect-[4/3] sm:aspect-[16/6]",
          // ✅ Minimum heights for different screen sizes
          "min-h-[350px] sm:min-h-[250px] md:min-h-[350px] lg:min-h-[450px]",
          // ✅ Maximum heights to prevent overflow
          "max-h-[500px] sm:max-h-[450px] md:max-h-[500px] lg:max-h-[600px]"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            {/* Background Image - Full width */}
            <Image
              src={currentAd.image_url}
              alt={currentAd.title || "Advertisement"}
              fill
              className="object-cover w-full h-full"
              priority
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
              <div className="px-3 sm:px-6 md:px-12 max-w-4xl w-full">
                {currentAd.display_type !== "custom" && adProducts.length > 0 ? (
                  // ✅ Product Display Mode - Responsive Cards
                  <div className="space-y-2 sm:space-y-4">
                    <Badge className="bg-pink-600 text-white border-0 text-xs sm:text-base px-3 sm:px-5 py-1 sm:py-1.5">
                      {currentAd.display_type === "product"
                        ? "🌟 Featured Product"
                        : currentAd.display_type === "multiple_products"
                        ? `🛒 ${currentAd.title || "Collection"}`
                        : currentAd.display_type === "category"
                        ? `📂 ${currentAd.title || "Category"} Collection`
                        : `📁 ${currentAd.title || "Subcategory"} Selection`}
                    </Badge>

                    {/* ✅ Responsive Grid - 1 column on mobile, 3 on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                      {adProducts.slice(0, 6).map((product, idx) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                          <Link
                            href={`/products/${product.slug}`}
                            className="block"
                          >
                            <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                              <img
                                src={
                                  product.images?.[0] ||
                                  "/images/placeholder.jpg"
                                }
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="text-xs sm:text-sm md:text-base font-semibold mt-1 sm:mt-2 line-clamp-1 text-gray-900 dark:text-white">
                              {product.name}
                            </h4>
                            <div className="flex items-center justify-between mt-0.5 sm:mt-1.5">
                              <span className="text-pink-600 font-bold text-xs sm:text-base md:text-lg">
                                KSh {product.price.toLocaleString()}
                              </span>
                              {product.rating && (
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
                                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                                    {product.rating}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                          <Button
                            size="default"
                            className="w-full mt-1.5 sm:mt-3 bg-pink-600 hover:bg-pink-700 text-white text-[10px] sm:text-sm h-7 sm:h-9"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={addedProducts.has(product.id)}
                          >
                            {addedProducts.has(product.id) ? (
                              <>
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1.5" />
                                Added!
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1.5" />
                                <span className="hidden xs:inline">Add to Cart</span>
                                <span className="xs:hidden">Add</span>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    {adProducts.length > 6 && (
                      <Link
                        href={`/products?category=${currentAd.category_id || currentAd.subcategory_id}`}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm text-xs sm:text-sm"
                        >
                          View All Products →
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  // ✅ Custom Display Mode (Link Only) - Larger Text
                  <div>
                    <Badge className="bg-pink-600 text-white border-0 text-xs sm:text-base px-3 sm:px-5 py-1 sm:py-1.5 mb-2 sm:mb-4">
                      🎯 Special Offer
                    </Badge>
                    <h3 className="text-xl sm:text-3xl md:text-5xl font-bold text-white mb-1 sm:mb-3 leading-tight">
                      {currentAd.title}
                    </h3>
                    {currentAd.description && (
                      <p className="text-white/80 text-xs sm:text-base md:text-lg mb-3 sm:mb-5 max-w-lg">
                        {currentAd.description}
                      </p>
                    )}
                    <Link href={currentAd.link_url || "#"}>
                      <Button className="bg-white text-pink-600 hover:bg-white/90 font-semibold text-sm sm:text-base px-4 sm:px-8 py-3 sm:py-6">
                        {currentAd.cta_text || "Learn More"}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {showControls && ads.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <button
            onClick={togglePause}
            className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play className="h-3 w-3 sm:h-4 sm:w-4" /> : <Pause className="h-3 w-3 sm:h-4 sm:w-4" />}
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && ads.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-1.5 sm:h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-4 sm:w-6 bg-pink-600"
                  : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/50 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
          {currentIndex + 1} / {ads.length}
        </div>
      )}
    </div>
  );
}