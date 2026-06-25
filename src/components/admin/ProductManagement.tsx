// src/components/admin/ProductManagement.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Plus,
  Star,
  TrendingUp,
  Sparkles,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/shadCn/ui/button";
import { Input } from "@/components/shadCn/ui/input";
import { Badge } from "@/components/shadCn/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadCn/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadCn/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadCn/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadCn/ui/select";
import ProductForm from "./ProductForm";
import { useDispatch } from "react-redux";
import { supabase } from "@/lib/supabase/client";
import { fetchProducts } from "../../lib/store/productSlice";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  category_id: string;
  subcategory_id?: string;
  images: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  rating: number;
  review_count: number;
  stock_status: "in_stock" | "out_of_stock" | "pre_order";
  created_at: string;
  updated_at: string;
  category?: { name: string };
  subcategory?: { name: string };
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price: number;
  stock: number;
  sku: string;
}

export default function ProductManagement() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const itemsPerPage = 10;

  useEffect(() => {
    fetchProductsManaged();
    fetchCategories();
  }, []);

  const fetchProductsManaged = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(name),
          subcategory:subcategories(name),
          variants:product_variants(*)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (data) setCategories(data);
  };

   useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setViewMode(mobile ? 'grid' : 'table')
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  const deleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productToDelete);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete);

      if (error) throw error;
      toast.success("Product deleted successfully");
      fetchProductsManaged();
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast.error("Failed to delete product: " + error.message);
    }
  };

  const exportProducts = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = [
        "Name",
        "Price",
        "Category",
        "Stock Status",
        "Featured",
        "Best Seller",
        "New",
      ];
      const csvRows = [
        headers.join(","),
        ...data.map((p: any) =>
          [
            `"${p.name}"`,
            p.price,
            `"${p.category?.name || ""}"`,
            p.stock_status,
            p.is_featured,
            p.is_bestseller,
            p.is_new,
          ].join(","),
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} products`);
    } catch (error: any) {
      toast.error("Failed to export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const importProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));

      const productsToImport = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line
            .split(",")
            .map((v) => v.trim().replace(/^"|"$/g, ""));
          return {
            name: values[0] || "",
            price: parseFloat(values[1]) || 0,
            category_name: values[2] || "",
            stock_status: values[3] || "in_stock",
            is_featured: values[4] === "true",
            is_bestseller: values[5] === "true",
            is_new: values[6] === "true",
          };
        });

      let successCount = 0;
      for (const p of productsToImport) {
        if (!p.name) continue;

        let categoryId = null;
        if (p.category_name) {
          const { data: existing } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", p.category_name)
            .single();

          if (existing) {
            categoryId = existing.id;
          } else {
            const { data: newCategory } = await supabase
              .from("categories")
              .insert({
                name: p.category_name,
                slug: p.category_name.toLowerCase().replace(/\s+/g, "-"),
              })
              .select()
              .single();
            if (newCategory) categoryId = newCategory.id;
          }
        }

        const { error } = await supabase.from("products").insert({
          ...p,
          category_id: categoryId,
          images: ["/images/placeholder.jpg"],
          slug: p.name.toLowerCase().replace(/\s+/g, "-"),
        });

        if (!error) successCount++;
      }

      toast.success(`Imported ${successCount} products`);
      fetchProductsManaged();
    } catch (error: any) {
      toast.error("Failed to import: " + error.message);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const getStockBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> =
      {
        in_stock: {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          icon: CheckCircle,
          label: "In Stock",
        },
        out_of_stock: {
          color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          icon: XCircle,
          label: "Out of Stock",
        },
        pre_order: {
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          icon: Clock,
          label: "Pre-Order",
        },
      };
    return config[status] || config.in_stock;
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || p.category_id === filterCategory;
    const matchesStatus =
      filterStatus === "all" || p.stock_status === filterStatus;
    const matchesFeatured =
      filterFeatured === "all" ||
      (filterFeatured === "featured" && p.is_featured) ||
      (filterFeatured === "bestseller" && p.is_bestseller) ||
      (filterFeatured === "new" && p.is_new);
    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalStock = products.reduce((sum, p) => {
    return sum + (p.variants?.reduce((s, v) => s + v.stock, 0) || 0);
  }, 0);

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Total Stock",
      value: totalStock,
      icon: Package,
      color: "text-green-600",
    },
    {
      label: "Featured",
      value: products.filter((p) => p.is_featured).length,
      icon: Star,
      color: "text-yellow-600",
    },
    {
      label: "Best Sellers",
      value: products.filter((p) => p.is_bestseller).length,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      label: "New",
      value: products.filter((p) => p.is_new).length,
      icon: Sparkles,
      color: "text-pink-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-gray-500">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportProducts}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={importProducts}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm" disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProductsManaged}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-pink-600 hover:bg-pink-700"
            onClick={() => {
              setSelectedProduct(null);
              setShowEditForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="pre_order">Pre-Order</option>
        </select>
        <select
          value={filterFeatured}
          onChange={(e) => setFilterFeatured(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="all">All</option>
          <option value="featured">Featured</option>
          <option value="bestseller">Best Sellers</option>
          <option value="new">New Arrivals</option>
        </select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-pink-600" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-pink-600" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Products Display */}
      {viewMode === "table" ? (
        // Table View
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badges
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto" />
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const stockBadge = getStockBadge(product.stock_status);
                    const StockIcon = stockBadge.icon;
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-gray-500">
                                {product.category?.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold">
                            KSh {product.price.toLocaleString()}
                          </p>
                          {product.sale_price && (
                            <p className="text-xs text-gray-400 line-through">
                              KSh {product.sale_price.toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {product.variants?.reduce((s, v) => s + v.stock, 0) ||
                            0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${stockBadge.color}`}
                          >
                            <StockIcon className="h-3 w-3" /> {stockBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {product.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            {product.is_bestseller && (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            )}
                            {product.is_new && (
                              <Sparkles className="h-4 w-4 text-pink-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowProductDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowEditForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setProductToDelete(product.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
              >
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))
          ) : paginatedProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No products found
            </div>
          ) : (
            paginatedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  <img
                    src={product.images?.[0] || "/images/placeholder.jpg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {product.is_bestseller && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {product.is_new && (
                      <Sparkles className="h-4 w-4 text-pink-500" />
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium line-clamp-1">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.category?.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-pink-600">
                      KSh {product.price.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStockBadge(product.stock_status).color}`}
                    >
                      {getStockBadge(product.stock_status).label}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductDetails(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditForm(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
      {/* Product Details Dialog */}
      {/* Edit Form Dialog - Make it larger */}
      {/* Edit Form Dialog - Force background with !important */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="!max-w-7xl !w-[95vw] max-h-[90vh] overflow-y-auto p-6 !bg-white dark:!bg-gray-900">
          <DialogHeader className="sticky top-0 !bg-white dark:!bg-gray-900 z-10 pb-4 border-b border-gray-200 dark:border-gray-800 pr-10">
            <DialogTitle className="text-2xl">
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <ProductForm
              initialData={selectedProduct}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedProduct(null);
                fetchProductsManaged();
              }}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedProduct(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      {/* Product Details Dialog */}
      <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto !bg-white dark:!bg-gray-900">
          <DialogHeader className="!bg-white dark:!bg-gray-900">
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
           {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  <img
                    src={
                      selectedProduct.images?.[0] || "/images/placeholder.jpg"
                    }
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500">
                    Slug: {selectedProduct.slug}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge
                      className={
                        getStockBadge(selectedProduct.stock_status).color
                      }
                    >
                      {getStockBadge(selectedProduct.stock_status).label}
                    </Badge>
                    {selectedProduct.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                    {selectedProduct.is_bestseller && (
                      <Badge className="bg-green-100 text-green-800">
                        Best Seller
                      </Badge>
                    )}
                    {selectedProduct.is_new && (
                      <Badge className="bg-pink-100 text-pink-800">New</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-xl font-bold">
                    KSh {selectedProduct.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p>{selectedProduct.category?.name || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p>
                    ⭐ {selectedProduct.rating || 0} (
                    {selectedProduct.review_count || 0})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p>
                    {new Date(selectedProduct.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm">{selectedProduct.description}</p>
                </div>
              )}
              {selectedProduct.variants &&
                selectedProduct.variants.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Variants ({selectedProduct.variants.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedProduct.variants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                        >
                          <div>
                            <span className="font-medium">
                              {v.variant_value}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({v.variant_type})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">KSh {v.price}</span>
                            <Badge variant="outline">{v.stock} in stock</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="!max-w-7xl !w-[95vw] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4 border-b border-gray-200 dark:border-gray-800">
            <DialogTitle className="text-2xl">
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <ProductForm
              initialData={selectedProduct}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedProduct(null);
                fetchProductsManaged();
              }}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedProduct(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog> */}
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and all its variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
