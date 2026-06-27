// src/app/checkout/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { clearCart } from "@/lib/store/cartSlice";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/shadCn/ui/button";
import { Input } from "@/components/shadCn/ui/input";
import { Label } from "@/components/shadCn/ui/label";
import { Card, CardContent } from "@/components/shadCn/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/shadCn/ui/radio-group";
import {
  Phone,
  MapPin,
  User,
  CreditCard,
  Smartphone,
  MessageCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Info,
  Search,
  X,
  LocateFixed,
  AlertTriangle,
  WifiOff,
  UserX,
  ShieldAlert,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { isValidMpesaPhone, validateMpesaPhone } from "@/lib/utils/mpesa";
import { motion, AnimatePresence } from "framer-motion";
import { downloadReceipt } from "@/lib/utils/receipt";
import Image from "next/image";

// ✅ Nairobi bounds for location restrictions
const NAIROBI_BOUNDS = {
  north: -1.15,
  south: -1.45,
  west: 36.65,
  east: 37.1,
};

// ✅ PaymentStatus interface with all possible statuses
interface PaymentStatus {
  status:
    | "idle"
    | "pending"
    | "processing"
    | "success"
    | "failed"
    | "cancelled"
    | "insufficient_funds"
    | "invalid_credentials"
    | "timeout"
    | "user_unreachable";
  message: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  transactionId?: string;
  resultCode?: string;
  resultDesc?: string;
}

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("mpesa");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: "idle",
    message: "",
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [useDifferentPhone, setUseDifferentPhone] = useState(false);
  const [differentPhone, setDifferentPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Location states - using OpenStreetMap Nominatim
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] = useState(false);
  const [addressUpdated, setAddressUpdated] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Nairobi",
    country: "Kenya",
    latitude: "",
    longitude: "",
  });

  // ✅ Check if cart has items
  const hasCartItems = items.length > 0;

  // ✅ Load user data when available
  useEffect(() => {
    if (user) {
      const userPhone = user.phone || user.user_metadata?.phone || "";
      const userName = user.user_metadata?.name || "";
      const userEmail = user.email || "";
      const userAddress = user.user_metadata?.address || "";
      const userCity = user.user_metadata?.city || "Nairobi";

      setFormData((prev) => ({
        ...prev,
        name: userName || prev.name,
        email: userEmail || prev.email,
        phone: userPhone || prev.phone,
        address: userAddress || prev.address,
        city: userCity || prev.city,
        latitude: user.user_metadata?.latitude || "",
        longitude: user.user_metadata?.longitude || "",
      }));

      if (userPhone) {
        setDifferentPhone(userPhone);
      }
    }
  }, [user]);

  // ✅ Handle cart redirection with proper checks
  useEffect(() => {
    const shouldRedirect =
      !hasCartItems && !isLoading && paymentStatus.status === "idle";

    if (shouldRedirect) {
      router.push("/cart");
    }
  }, [hasCartItems, isLoading, paymentStatus.status, router]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
      }
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
    };
  }, []);

  const validatePhone = (phone: string): boolean => {
    const isValid = isValidMpesaPhone(phone);
    if (!isValid) {
      setPhoneError("Please enter a valid M-Pesa number (e.g., 0712345678)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // ✅ Log payment to database
  const logPayment = async ({
    orderId,
    transactionId,
    amount,
    phone,
    status,
    error,
    metadata,
  }: {
    orderId: string;
    transactionId?: string;
    amount: number;
    phone: string;
    status: string;
    error?: string;
    metadata?: any;
  }) => {
    try {
      const { error: logError } = await supabase.from("payment_logs").insert({
        order_id: orderId,
        transaction_id: transactionId || null,
        amount: amount,
        phone: phone,
        status: status,
        error: error || null,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      });

      if (logError) {
        console.error("Failed to log payment:", logError);
      } else {
        console.log("✅ Payment logged successfully:", { status, orderId });
      }
    } catch (error) {
      console.error("Error logging payment:", error);
    }
  };

  // ✅ Search location using OpenStreetMap Nominatim with Nairobi restriction
  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const searchQueryWithNairobi = `${query}, Nairobi, Kenya`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQueryWithNairobi)}&format=json&addressdetails=1&limit=10&countrycodes=KE`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "MysticWines App",
          },
        }
      );

      const data = await response.json();

      const filteredSuggestions = data
        .filter((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          return (
            lat >= NAIROBI_BOUNDS.south &&
            lat <= NAIROBI_BOUNDS.north &&
            lon >= NAIROBI_BOUNDS.west &&
            lon <= NAIROBI_BOUNDS.east
          );
        })
        .map((item: any) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          address: {
            road: item.address?.road || "",
            suburb: item.address?.suburb || "",
            city: item.address?.city || item.address?.town || "",
            town: item.address?.town || "",
            state: item.address?.state || "",
            country: item.address?.country || "Kenya",
            postcode: item.address?.postcode || "",
          },
        }));

      setLocationSuggestions(filteredSuggestions);

      if (filteredSuggestions.length === 0 && data.length > 0) {
        toast.info(
          "No locations found in Nairobi area. Please try a more specific search."
        );
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Failed to search location");
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  // ✅ Handle location search input with debounce
  const handleLocationSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      if (value.length >= 3) {
        searchTimeout.current = setTimeout(() => {
          searchLocation(value);
          setShowLocationSearch(true);
        }, 500);
      } else {
        setLocationSuggestions([]);
        setShowLocationSearch(false);
      }
    },
    [searchLocation]
  );

  // ✅ Select a location
  const selectLocation = useCallback((location: LocationSuggestion) => {
    setSelectedLocation(location);
    setShowLocationSearch(false);
    setSearchQuery(location.display_name);
    setLocationSuggestions([]);

    const addressParts = [
      location.address?.road,
      location.address?.suburb,
      location.address?.city || location.address?.town,
    ].filter(Boolean);

    const city = location.address?.city || location.address?.town || "Nairobi";
    const country = location.address?.country || "Kenya";

    setFormData((prev) => ({
      ...prev,
      address: addressParts.join(", ") || location.display_name,
      city: city,
      country: country,
      latitude: location.lat,
      longitude: location.lon,
    }));

    setAddressUpdated(true);
    toast.success("Location selected successfully!");
  }, []);

  // ✅ Detect current location
  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const isWithinNairobi =
          latitude >= NAIROBI_BOUNDS.south &&
          latitude <= NAIROBI_BOUNDS.north &&
          longitude >= NAIROBI_BOUNDS.west &&
          longitude <= NAIROBI_BOUNDS.east;

        if (!isWithinNairobi) {
          toast.warning(
            "You are outside Nairobi. Please enter a Nairobi location manually."
          );
          setIsLoadingLocation(false);
          return;
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "MysticWines App",
              },
            }
          );

          const data = await response.json();

          if (data) {
            const location: LocationSuggestion = {
              place_id: data.place_id,
              display_name: data.display_name,
              lat: data.lat,
              lon: data.lon,
              address: {
                road: data.address?.road || "",
                suburb: data.address?.suburb || "",
                city: data.address?.city || data.address?.town || "",
                town: data.address?.town || "",
                state: data.address?.state || "",
                country: data.address?.country || "Kenya",
                postcode: data.address?.postcode || "",
              },
            };

            selectLocation(location);
            toast.success("Current location detected!");
          }
        } catch (error) {
          console.error("Error getting location:", error);
          toast.error("Failed to get current location");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      () => {
        toast.error(
          "Unable to get current location. Please enable location services or enter address manually."
        );
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [selectLocation]);

  // ✅ Clear selected location
  const clearSelectedLocation = useCallback(() => {
    setSelectedLocation(null);
    setSearchQuery("");
    setAddressUpdated(false);
    setLocationSuggestions([]);
    setFormData((prev) => ({
      ...prev,
      address: "",
      city: "Nairobi",
      latitude: "",
      longitude: "",
    }));
  }, []);

  const createOrder = async () => {
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const orderData = {
      user_id: user?.id || null,
      order_number: orderNumber,
      total_amount: total,
      shipping_cost: 0,
      tax: 0,
      status: "pending",
      payment_method: paymentMethod,
      payment_status: "pending",
      shipping_address: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        latitude: formData.latitude,
        longitude: formData.longitude,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      throw new Error(orderError.message || "Failed to create order");
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw new Error(itemsError.message || "Failed to create order items");
    }

    if (saveAsDefaultAddress && user) {
      await supabase
        .from("users")
        .update({
          user_metadata: {
            ...user.user_metadata,
            address: formData.address,
            city: formData.city,
            latitude: formData.latitude,
            longitude: formData.longitude,
          },
        })
        .eq("id", user.id);

      toast.success("Address saved to your profile!");
    }

    return order;
  };

  const checkPaymentStatus = async (
    orderId: string,
    checkoutRequestId: string,
    phone: string
  ) => {
    try {
      const response = await fetch("/api/mpesa/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutRequestId }),
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        console.error("Query failed:", result.error);
        return;
      }

      const data = result.data;

      // ✅ Handle all error types
      if (data.ResultCode !== "0" && data.ResultDesc) {
        const errorMessage = data.ResultDesc || "Payment failed";
        const errorCode = data.ResultCode;

        // ✅ Log failed payment
        await logPayment({
          orderId: orderId,
          transactionId: checkoutRequestId,
          amount: total,
          phone: phone,
          status: "failed",
          error: errorMessage,
          metadata: { ...data, errorCode },
        });

        // ✅ Check for specific error types with comprehensive matching
        const errorLower = errorMessage.toLowerCase();

        // 1. Insufficient funds
        if (
          errorLower.includes("insufficient") ||
          errorLower.includes("not enough") ||
          errorLower.includes("low balance")
        ) {
          setPaymentStatus({
            status: "insufficient_funds",
            message:
              "Insufficient M-Pesa balance. Please top up your M-Pesa and try again.",
            resultCode: errorCode,
            resultDesc: errorMessage,
            checkoutRequestId: checkoutRequestId,
          });
        }
        // 2. Timeout / User unreachable
        else if (
          errorLower.includes("timeout") ||
          errorLower.includes("cannot be reached") ||
          errorLower.includes("unreachable") ||
          errorLower.includes("ds timeout") ||
          errorCode === "1037"
        ) {
          setPaymentStatus({
            status: "user_unreachable",
            message:
              "We couldn't reach your phone. Please ensure your phone is on and has network coverage, then try again.",
            resultCode: errorCode,
            resultDesc: errorMessage,
            checkoutRequestId: checkoutRequestId,
          });
        }
        // 3. Invalid credentials / Configuration errors
        else if (
          errorLower.includes("invalid") ||
          errorLower.includes("credentials") ||
          errorLower.includes("initiator") ||
          errorLower.includes("authentication") ||
          errorLower.includes("configuration") ||
          errorLower.includes("bad request")
        ) {
          setPaymentStatus({
            status: "invalid_credentials",
            message:
              "Payment configuration error. Please try again or contact support.",
            resultCode: errorCode,
            resultDesc: errorMessage,
            checkoutRequestId: checkoutRequestId,
          });
        }
        // 4. Cancelled by user
        else if (errorCode === "1032" || errorLower.includes("cancel")) {
          setPaymentStatus({
            status: "cancelled",
            message:
              "Payment was cancelled. You can try again or choose another method.",
            resultCode: errorCode,
            resultDesc: errorMessage,
            checkoutRequestId: checkoutRequestId,
          });
        }
        // 5. General timeout
        else if (errorLower.includes("timeout") || errorCode === "1037") {
          setPaymentStatus({
            status: "timeout",
            message:
              "Payment request timed out. Please try again or check your M-Pesa app.",
            resultCode: errorCode,
            resultDesc: errorMessage,
            checkoutRequestId: checkoutRequestId,
          });
        }
        // 6. Any other error
        else {
          setPaymentStatus({
            status: "failed",
            message: errorMessage || "Payment failed. Please try again.",
            resultCode: errorCode,
            resultDesc: errorMessage,
            checkoutRequestId: checkoutRequestId,
          });
        }

        // ✅ Update order status
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            status: "failed",
            payment_error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
        if (paymentTimeoutRef.current) {
          clearTimeout(paymentTimeoutRef.current);
        }
        return;
      }

      // ✅ Payment successful
      if (data.ResultCode === "0") {
        const transactionId = data.MpesaReceiptNumber || data.TransactionId;

        // ✅ Log successful payment
        await logPayment({
          orderId: orderId,
          transactionId: transactionId,
          amount: total,
          phone: phone,
          status: "completed",
          metadata: data,
        });

        setPaymentStatus({
          status: "success",
          message: "Payment confirmed successfully! 🎉",
          transactionId: transactionId,
        });

        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "processing",
            payment_receipt: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
        if (paymentTimeoutRef.current) {
          clearTimeout(paymentTimeoutRef.current);
        }

        generateReceipt(orderId);
      } else {
        // ✅ Any other status - keep checking
        setPaymentStatus({
          status: "processing",
          message: "Waiting for payment confirmation...",
        });
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  const generateReceipt = async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items:order_items(
            *,
            product:products(*)
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setReceiptData(order);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error generating receipt:", error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptData) return;
    try {
      await downloadReceipt(receiptData);
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  const handleMpesaPayment = async (order: any) => {
    const phoneToUse = useDifferentPhone ? differentPhone : formData.phone;

    if (!validatePhone(phoneToUse)) {
      return;
    }

    let formattedPhone: string;
    try {
      formattedPhone = validateMpesaPhone(phoneToUse);
    } catch (error: any) {
      setPhoneError(error.message);
      return;
    }

    const response = await fetch("/api/mpesa/stk-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        amount: Math.round(total),
        orderId: order.order_number,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      // ✅ Log failed payment
      await logPayment({
        orderId: order.id,
        amount: total,
        phone: phoneToUse,
        status: "failed",
        error: result.error || "STK Push failed",
        metadata: result,
      });

      setPaymentStatus({
        status: "failed",
        message: result.error || "M-Pesa payment failed",
      });
      toast.error(result.error || "Payment failed");
      return;
    }

    const checkoutRequestId = result.data.CheckoutRequestID;

    setPaymentStatus({
      status: "pending",
      message: "STK push sent! Please check your phone and enter PIN.",
      checkoutRequestId,
      merchantRequestId: result.data.MerchantRequestID,
    });

    toast.success("STK push sent! Check your phone.");

    // ✅ Log pending payment
    await logPayment({
      orderId: order.id,
      transactionId: checkoutRequestId,
      amount: total,
      phone: phoneToUse,
      status: "pending",
      metadata: { merchantRequestId: result.data.MerchantRequestID },
    });

    // Wait 5 seconds before first query
    setTimeout(() => {
      checkPaymentStatus(order.id, checkoutRequestId, phoneToUse);

      paymentCheckInterval.current = setInterval(() => {
        checkPaymentStatus(order.id, checkoutRequestId, phoneToUse);
      }, 30000);
    }, 5000);

    // Timeout after 5 minutes
    paymentTimeoutRef.current = setTimeout(() => {
      if (
        paymentStatus.status === "pending" ||
        paymentStatus.status === "processing"
      ) {
        // ✅ Log timeout
        logPayment({
          orderId: order.id,
          transactionId: checkoutRequestId,
          amount: total,
          phone: phoneToUse,
          status: "timeout",
          error: "Payment timeout - user did not complete transaction",
          metadata: { timeout: true },
        });

        setPaymentStatus({
          status: "timeout",
          message:
            "Payment request timed out. Please try again or check your M-Pesa app.",
        });
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
      }
    }, 300000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.address
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (paymentMethod === "mpesa") {
      const phoneToUse = useDifferentPhone ? differentPhone : formData.phone;
      if (!validatePhone(phoneToUse)) {
        return;
      }
    }

    setIsLoading(true);
    setPaymentStatus({ status: "processing", message: "Creating order..." });

    try {
      const order = await createOrder();
      setOrderId(order.id);

      if (paymentMethod === "mpesa") {
        await handleMpesaPayment(order);
      } else {
        // ✅ Cash on Delivery - Clear payment status
        setPaymentStatus({ status: "idle", message: "" });

        const message = `Hello Mystic Wines,\n\nI want to place an order:\n\n${items
          .map(
            (item) =>
              `${item.name} x${item.quantity} - KSh ${(item.price * item.quantity).toLocaleString()}`
          )
          .join(
            "\n"
          )}\n\nTotal: KSh ${total.toLocaleString()}\n\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}`;

        const whatsappUrl = `https://wa.me/254710835445?text=${encodeURIComponent(
          message
        )}`;

        toast.success("Order placed! Redirecting to WhatsApp...");
        dispatch(clearCart());

        setTimeout(() => {
          window.open(whatsappUrl, "_blank");
          router.push("/orders");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      setPaymentStatus({
        status: "failed",
        message: error.message || "Failed to place order",
      });
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  // Render payment status
  const renderPaymentStatus = () => {
    // ✅ Don't show payment status for cash payments
    if (paymentMethod === "cash") {
      return null;
    }

    if (paymentStatus.status === "idle") return null;

    // ✅ Status config with all possible statuses
    const statusConfig = {
      pending: {
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
      },
      processing: {
        icon: Loader2,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
      },
      success: {
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
      },
      failed: {
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
      },
      cancelled: {
        icon: Ban,
        color: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800",
      },
      insufficient_funds: {
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
      },
      invalid_credentials: {
        icon: ShieldAlert,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
      },
      timeout: {
        icon: Clock,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
      },
      user_unreachable: {
        icon: WifiOff,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
      },
    } as const;

    // ✅ Safe access with type guard
    type PaymentStatusKey = keyof typeof statusConfig;
    const status = paymentStatus.status as PaymentStatusKey;
    const config = statusConfig[status];

    // ✅ If config is undefined, use a default fallback
    if (!config) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium text-sm">{paymentStatus.message}</p>
            </div>
          </div>
        </motion.div>
      );
    }

    const Icon = config.icon;

    // ✅ Custom rendering for user_unreachable
    if (paymentStatus.status === "user_unreachable") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl ${config.bg} border ${config.border}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <UserX className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-700 dark:text-red-400">
                Phone Unreachable
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {paymentStatus.message}
              </p>
              {paymentStatus.resultDesc && (
                <p className="text-xs text-red-500 mt-1">
                  Error: {paymentStatus.resultDesc}
                </p>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Troubleshooting tips:</span>
                </p>
                <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                  <li>Ensure your phone is switched on and has network coverage</li>
                  <li>Check if you have enough airtime for the transaction</li>
                  <li>Verify your phone number is correct</li>
                  <li>Try again in a few minutes</li>
                </ul>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    setPaymentStatus({ status: "idle", message: "" })
                  }
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentMethod("cash")}
                  size="sm"
                >
                  Use Cash on Delivery
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // ✅ Custom rendering for insufficient funds
    if (paymentStatus.status === "insufficient_funds") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl ${config.bg} border ${config.border}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-700 dark:text-amber-400">
                Insufficient M-Pesa Balance
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {paymentStatus.message}
              </p>
              {paymentStatus.resultDesc && (
                <p className="text-xs text-red-500 mt-1">
                  Error: {paymentStatus.resultDesc}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Please top up your M-Pesa and try again, or choose a different
                payment method.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    setPaymentStatus({ status: "idle", message: "" })
                  }
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentMethod("cash")}
                  size="sm"
                >
                  Use Cash on Delivery
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // ✅ Custom rendering for timeout
    if (paymentStatus.status === "timeout") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl ${config.bg} border ${config.border}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Clock className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-700 dark:text-red-400">
                Payment Request Timed Out
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {paymentStatus.message}
              </p>
              {paymentStatus.resultDesc && (
                <p className="text-xs text-red-500 mt-1">
                  Error: {paymentStatus.resultDesc}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Please try again or check your M-Pesa app for pending requests.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    setPaymentStatus({ status: "idle", message: "" })
                  }
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentMethod("cash")}
                  size="sm"
                >
                  Use Cash on Delivery
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // ✅ Custom rendering for invalid credentials
    if (paymentStatus.status === "invalid_credentials") {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl ${config.bg} border ${config.border}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <ShieldAlert className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-700 dark:text-red-400">
                Payment Configuration Error
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {paymentStatus.message}
              </p>
              {paymentStatus.resultDesc && (
                <p className="text-xs text-red-500 mt-1">
                  Error: {paymentStatus.resultDesc}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Please try again or contact support if the issue persists.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    setPaymentStatus({ status: "idle", message: "" })
                  }
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentMethod("cash")}
                  size="sm"
                >
                  Use Cash on Delivery
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // ✅ Default status rendering
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg ${config.bg} border ${config.border}`}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={`h-5 w-5 mt-0.5 ${config.color} ${paymentStatus.status === "processing" || paymentStatus.status === "pending" ? "animate-spin" : ""}`}
          />
          <div>
            <p className="font-medium text-sm">{paymentStatus.message}</p>
            {paymentStatus.checkoutRequestId && (
              <p className="text-xs text-gray-500 mt-1">
                Reference: {paymentStatus.checkoutRequestId.slice(0, 16)}...
              </p>
            )}
            {paymentStatus.resultDesc &&
              paymentStatus.status !== "cancelled" && (
                <p className="text-xs text-red-500 mt-1">
                  Error: {paymentStatus.resultDesc}
                </p>
              )}
            {paymentStatus.status === "pending" && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-20 bg-gray-200 rounded overflow-hidden">
                  <motion.div
                    className="h-full bg-pink-600 rounded"
                    animate={{ width: ["0%", "100%"] }}
                    transition={{
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Waiting for PIN...
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // ✅ Show empty cart state only when truly empty and not in payment flow
  if (!hasCartItems && paymentStatus.status === "idle" && !isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mt-2">
            Add some items to your cart before checking out
          </p>
          <Link href="/products">
            <Button className="mt-4 bg-pink-600 hover:bg-pink-700 text-white">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {!user && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            🛒 You're checking out as a guest.
            <Link
              href="/auth/login"
              className="ml-2 font-medium hover:underline"
            >
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/auth/register" className="font-medium hover:underline">
              create an account
            </Link>{" "}
            to track your orders.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-pink-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  {user && formData.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      This is your registered phone number. You can update it in
                      your profile.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address with Location Search */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  Delivery Address (Nairobi Area)
                </h3>

                <div className="space-y-2">
                  <Label>Search Location</Label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search for a location in Nairobi..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleLocationSearch(e.target.value);
                          }}
                          onFocus={() => {
                            if (locationSuggestions.length > 0) {
                              setShowLocationSearch(true);
                            }
                          }}
                          className="pl-10"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={clearSelectedLocation}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={detectCurrentLocation}
                        disabled={isLoadingLocation}
                        className="shrink-0"
                      >
                        {isLoadingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LocateFixed className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showLocationSearch && locationSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {isSearchingLocation ? (
                            <div className="p-4 text-center text-gray-500">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                              <p className="text-sm mt-1">Searching...</p>
                            </div>
                          ) : (
                            locationSuggestions.map((location) => (
                              <button
                                key={location.place_id}
                                type="button"
                                onClick={() => selectLocation(location)}
                                className="w-full text-left px-4 py-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                              >
                                <div className="flex items-start gap-3">
                                  <MapPin className="h-4 w-4 text-pink-600 mt-1 shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {location.address?.road ||
                                        location.display_name.split(",")[0]}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {location.address?.city ||
                                        location.address?.town ||
                                        ""}
                                      {location.address?.suburb &&
                                        `, ${location.address.suburb}`}
                                      {location.address?.country &&
                                        `, ${location.address.country}`}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-gray-500">
                    Search for locations within Nairobi area or use the GPS
                    button to detect your current location
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      setAddressUpdated(true);
                    }}
                    required
                    className={addressUpdated ? "border-green-500" : ""}
                  />
                  {addressUpdated && (
                    <p className="text-xs text-green-600">✓ Address updated</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {user && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAsDefaultAddress}
                      onChange={(e) =>
                        setSaveAsDefaultAddress(e.target.checked)
                      }
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <Label
                      htmlFor="saveAddress"
                      className="text-sm cursor-pointer"
                    >
                      Save this address as my default shipping address
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-pink-600" />
                  Payment Method
                </h3>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: any) => {
                    setPaymentMethod(value);
                    if (value === "cash") {
                      setPaymentStatus({ status: "idle", message: "" });
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-pink-500 transition cursor-pointer">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label
                      htmlFor="mpesa"
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="relative w-12 h-8">
                        <Image
                          src="/images/mpesa.png"
                          alt="M-Pesa"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium">M-Pesa</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        Pay with M-Pesa
                      </span>
                    </Label>
                  </div>

                  {paymentMethod === "mpesa" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-6 space-y-3"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">M-Pesa Number:</span>{" "}
                          {useDifferentPhone ? (
                            <span className="text-pink-600 font-medium">
                              {differentPhone || "Not set"}
                            </span>
                          ) : (
                            <span className="text-pink-600 font-medium">
                              {formData.phone || "Not set"}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {useDifferentPhone
                            ? "Using a different phone number for payment"
                            : "Using your registered phone number"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="differentPhone"
                          checked={useDifferentPhone}
                          onChange={(e) => {
                            setUseDifferentPhone(e.target.checked);
                            if (e.target.checked && formData.phone) {
                              setDifferentPhone(formData.phone);
                            }
                          }}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <Label
                          htmlFor="differentPhone"
                          className="text-sm cursor-pointer"
                        >
                          Use a different phone number for payment
                        </Label>
                      </div>

                      {useDifferentPhone && (
                        <div className="space-y-2">
                          <Label htmlFor="mpesaPhone">
                            M-Pesa Phone Number *
                          </Label>
                          <Input
                            id="mpesaPhone"
                            type="tel"
                            placeholder="0712 345 678"
                            value={differentPhone}
                            onChange={(e) => {
                              setDifferentPhone(e.target.value);
                              setPhoneError("");
                            }}
                            className={phoneError ? "border-red-500" : ""}
                          />
                          {phoneError && (
                            <p className="text-red-500 text-sm">{phoneError}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Enter the M-Pesa registered phone number
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-pink-500 transition cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label
                      htmlFor="cash"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span>Cash on Delivery</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        Pay via WhatsApp
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {renderPaymentStatus()}

            {paymentStatus.status === "success" && receiptData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <Button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/orders")}
                  className="flex-1"
                >
                  View Orders
                </Button>
              </motion.div>
            )}

            {paymentStatus.status === "failed" ||
            paymentStatus.status === "cancelled" ||
            paymentStatus.status === "timeout" ||
            paymentStatus.status === "user_unreachable" ? (
              <Button
                type="button"
                onClick={() =>
                  setPaymentStatus({ status: "idle", message: "" })
                }
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              >
                Try Again
              </Button>
            ) : (
              paymentStatus.status !== "success" &&
              paymentStatus.status !== "insufficient_funds" &&
              paymentStatus.status !== "invalid_credentials" && (
                <Button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg py-6"
                  disabled={
                    isLoading ||
                    paymentStatus.status === "processing" ||
                    paymentStatus.status === "pending"
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : paymentStatus.status === "pending" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Waiting for Payment...
                    </>
                  ) : (
                    `Place Order • KSh ${total.toLocaleString()}`
                  )}
                </Button>
              )
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name}{" "}
                      {item.variantValue && `(${item.variantValue})`}
                      <span className="text-gray-400"> x{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>KSh {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-pink-600">
                    KSh {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}