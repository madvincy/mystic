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
  Navigation,
  Map,
  Home,
  Building,
  LocateFixed,
  AlertCircle,
  AlertTriangle,
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
  east: 37.10,
};

// ✅ Nairobi area coordinates
const NAIROBI_CENTER = {
  lat: -1.2921,
  lng: 36.8219,
};

interface PaymentStatus {
  status: 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'insufficient_funds';
  message: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  transactionId?: string;
  resultCode?: string;
  resultDesc?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("mpesa");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle', message: '' });
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [useDifferentPhone, setUseDifferentPhone] = useState(false);
  const [differentPhone, setDifferentPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isCartEmpty, setIsCartEmpty] = useState(false);
  const [hasCheckedCart, setHasCheckedCart] = useState(false);
  
  // Location states
  const [searchQuery, setSearchQuery] = useState("");
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] = useState(false);
  const [addressUpdated, setAddressUpdated] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const geocoder = useRef<any>(null);

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

  // ✅ Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not found. Location search will be disabled.');
        return;
      }

      if (window.google) {
        setGoogleMapsLoaded(true);
        initGoogleServices();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        setGoogleMapsLoaded(true);
        initGoogleServices();
      };
      
      document.head.appendChild(script);
    };

    const initGoogleServices = () => {
      if (window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        geocoder.current = new window.google.maps.Geocoder();
      }
    };

    loadGoogleMaps();
  }, []);

  // ✅ Check if cart has items - with proper handling
  useEffect(() => {
    if (!hasCheckedCart) {
      if (items.length === 0) {
        setIsCartEmpty(true);
        // Only redirect if not loading and not in the middle of a payment
        if (!isLoading && paymentStatus.status === 'idle') {
          router.push("/cart");
        }
      } else {
        setIsCartEmpty(false);
      }
      setHasCheckedCart(true);
    }
  }, [items, hasCheckedCart, isLoading, paymentStatus.status, router]);

  // Load user data when available
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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
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

  // ✅ Search location using Google Places Autocomplete with Nairobi restrictions
  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !googleMapsLoaded || !autocompleteService.current) {
      setPlacePredictions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'ke' },
        types: ['geocode', 'establishment'],
        locationBias: {
          bounds: {
            north: NAIROBI_BOUNDS.north,
            south: NAIROBI_BOUNDS.south,
            east: NAIROBI_BOUNDS.east,
            west: NAIROBI_BOUNDS.west,
          }
        },
      };

      const response = await new Promise((resolve, reject) => {
        autocompleteService.current.getPlacePredictions(request, (predictions: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(predictions);
          } else {
            reject(status);
          }
        });
      });

      // ✅ Filter predictions to ensure they are within Nairobi bounds
      const filteredPredictions = (response as any[]).filter((prediction) => {
        const terms = prediction.terms.map((t: any) => t.value.toLowerCase());
        const isNairobi = terms.some((term: string) => 
          term.includes('nairobi') || 
          term.includes('ongata rongai') ||
          term.includes('karen') ||
          term.includes('langata') ||
          term.includes('thika') ||
          term.includes('kiambu') ||
          term.includes('kikuyu')
        );
        return isNairobi;
      });

      setPlacePredictions(filteredPredictions || []);
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  }, [googleMapsLoaded]);

  // ✅ Get place details
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!googleMapsLoaded || !placesService.current) return null;

    try {
      const request = {
        placeId: placeId,
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
      };

      const response = await new Promise((resolve, reject) => {
        placesService.current.getDetails(request, (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(place);
          } else {
            reject(status);
          }
        });
      });

      return response as PlaceDetails;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }, [googleMapsLoaded]);

  // ✅ Select a location
  const selectLocation = useCallback(async (prediction: PlacePrediction) => {
    setIsLoadingLocation(true);
    try {
      const placeDetails = await getPlaceDetails(prediction.place_id);
      
      if (!placeDetails) {
        toast.error('Could not get location details. Please try again.');
        return;
      }

      setSelectedPlace(placeDetails);
      setShowLocationSearch(false);
      setSearchQuery(prediction.description);
      setPlacePredictions([]);

      const addressComponents = placeDetails.address_components || [];
      const getComponent = (type: string) => {
        const component = addressComponents.find((c) => c.types.includes(type));
        return component?.long_name || '';
      };

      const streetNumber = getComponent('street_number');
      const route = getComponent('route');
      const city = getComponent('locality') || getComponent('administrative_area_level_2') || 'Nairobi';
      const country = getComponent('country') || 'Kenya';
      
      const streetAddress = [streetNumber, route].filter(Boolean).join(' ') || placeDetails.formatted_address;

      const lat = placeDetails.geometry.location.lat();
      const lng = placeDetails.geometry.location.lng();
      
      const isWithinNairobi = 
        lat >= NAIROBI_BOUNDS.south && 
        lat <= NAIROBI_BOUNDS.north &&
        lng >= NAIROBI_BOUNDS.west && 
        lng <= NAIROBI_BOUNDS.east;

      if (!isWithinNairobi) {
        toast.warning('This location is outside Nairobi. Please select a location within Nairobi and its environs.');
      }

      setFormData(prev => ({
        ...prev,
        address: streetAddress || placeDetails.formatted_address,
        city: city,
        country: country,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
      
      setAddressUpdated(true);
      toast.success('Location selected successfully!');
    } catch (error) {
      console.error('Error selecting location:', error);
      toast.error('Failed to select location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [getPlaceDetails]);

  // ✅ Detect current location
  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
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
          toast.warning('You are outside Nairobi. Please enter a Nairobi location manually.');
          setIsLoadingLocation(false);
          return;
        }

        try {
          const response = await new Promise((resolve, reject) => {
            geocoder.current.geocode({
              location: { lat: latitude, lng: longitude },
              bounds: {
                north: NAIROBI_BOUNDS.north,
                south: NAIROBI_BOUNDS.south,
                east: NAIROBI_BOUNDS.east,
                west: NAIROBI_BOUNDS.west,
              },
            }, (results: any, status: any) => {
              if (status === window.google.maps.GeocoderStatus.OK) {
                resolve(results[0]);
              } else {
                reject(status);
              }
            });
          });

          const place = response as any;
          const addressComponents = place.address_components || [];
          const getComponent = (type: string) => {
            const component = addressComponents.find((c: any) => c.types.includes(type));
            return component?.long_name || '';
          };

          const streetNumber = getComponent('street_number');
          const route = getComponent('route');
          const city = getComponent('locality') || getComponent('administrative_area_level_2') || 'Nairobi';
          const country = getComponent('country') || 'Kenya';
          const streetAddress = [streetNumber, route].filter(Boolean).join(' ') || place.formatted_address;

          setFormData(prev => ({
            ...prev,
            address: streetAddress || place.formatted_address,
            city: city,
            country: country,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          
          setAddressUpdated(true);
          setSearchQuery(place.formatted_address);
          toast.success('Current location detected!');
        } catch (error) {
          console.error('Error getting location:', error);
          toast.error('Failed to get current location');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      () => {
        toast.error('Unable to get current location. Please enable location services or enter address manually.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // ✅ Clear selected location
  const clearSelectedLocation = useCallback(() => {
    setSelectedPlace(null);
    setSearchQuery('');
    setAddressUpdated(false);
    setPlacePredictions([]);
    setFormData(prev => ({
      ...prev,
      address: '',
      city: 'Nairobi',
      latitude: '',
      longitude: '',
    }));
  }, []);

  // ✅ Handle location search input with debounce
  const handleLocationSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.length > 2) {
      searchLocation(value);
      setShowLocationSearch(true);
    } else {
      setPlacePredictions([]);
      setShowLocationSearch(false);
    }
  }, [searchLocation]);

  const createOrder = async () => {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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
          }
        })
        .eq("id", user.id);
      
      toast.success("Address saved to your profile!");
    }

    return order;
  };

  const checkPaymentStatus = async (orderId: string, checkoutRequestId: string) => {
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
        console.error('Query failed:', result.error);
        return;
      }

      const data = result.data;
      
      // ✅ Check for insufficient funds or other errors
      if (data.ResultCode === "1" && data.ResultDesc) {
        // Check if it's insufficient funds
        if (data.ResultDesc.toLowerCase().includes('insufficient')) {
          setPaymentStatus({
            status: 'insufficient_funds',
            message: 'Insufficient M-Pesa balance. Please top up your M-Pesa and try again.',
            resultCode: data.ResultCode,
            resultDesc: data.ResultDesc,
            checkoutRequestId: checkoutRequestId,
          });
          
          // Update order status
          await supabase
            .from("orders")
            .update({ 
              payment_status: "failed",
              status: "failed",
              payment_error: data.ResultDesc,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (paymentCheckInterval.current) {
            clearInterval(paymentCheckInterval.current);
          }
          return;
        }
        
        // Other payment errors
        setPaymentStatus({
          status: 'failed',
          message: data.ResultDesc || 'Payment failed. Please try again.',
          resultCode: data.ResultCode,
          resultDesc: data.ResultDesc,
          checkoutRequestId: checkoutRequestId,
        });
        
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
        return;
      }
      
      if (data.ResultCode === "0") {
        setPaymentStatus({
          status: 'success',
          message: 'Payment confirmed successfully! 🎉',
          transactionId: data.MpesaReceiptNumber || data.TransactionId,
        });
        
        await supabase
          .from("orders")
          .update({ 
            payment_status: "paid",
            status: "processing",
            payment_receipt: data.MpesaReceiptNumber || data.TransactionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        await supabase
          .from("payment_logs")
          .insert({
            order_id: orderId,
            payment_method: "mpesa",
            amount: total,
            transaction_id: data.MpesaReceiptNumber || data.TransactionId,
            status: "completed",
            metadata: data,
          });

        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
        
        generateReceipt(orderId);
        
      } else if (data.ResultCode === "1032") {
        setPaymentStatus({
          status: 'cancelled',
          message: 'Payment was cancelled. You can try again or choose another method.',
        });
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
      } else if (data.ResultCode === "1") {
        setPaymentStatus({
          status: 'failed',
          message: data.ResultDesc || 'Payment failed. Please try again.',
        });
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
      } else {
        setPaymentStatus({
          status: 'processing',
          message: 'Waiting for payment confirmation...',
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
        .select(`
          *,
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
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
      setPaymentStatus({
        status: 'failed',
        message: result.error || "M-Pesa payment failed",
      });
      toast.error(result.error || "Payment failed");
      return;
    }

    const checkoutRequestId = result.data.CheckoutRequestID;
    
    setPaymentStatus({
      status: 'pending',
      message: 'STK push sent! Please check your phone and enter PIN.',
      checkoutRequestId,
      merchantRequestId: result.data.MerchantRequestID,
    });

    toast.success("STK push sent! Check your phone.");

    // Wait 5 seconds before first query
    setTimeout(() => {
      checkPaymentStatus(order.id, checkoutRequestId);
      
      paymentCheckInterval.current = setInterval(() => {
        checkPaymentStatus(order.id, checkoutRequestId);
      }, 30000);
    }, 5000);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (paymentStatus.status === 'pending' || paymentStatus.status === 'processing') {
        setPaymentStatus({
          status: 'failed',
          message: 'Payment timeout. Please try again.',
        });
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
        }
      }
    }, 300000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
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
    setPaymentStatus({ status: 'processing', message: 'Creating order...' });

    try {
      const order = await createOrder();
      setOrderId(order.id);

      if (paymentMethod === "mpesa") {
        await handleMpesaPayment(order);
      } else {
        const message = `Hello Mystic Wines,\n\nI want to place an order:\n\n${items
          .map(
            (item) =>
              `${item.name} x${item.quantity} - KSh ${(item.price * item.quantity).toLocaleString()}`,
          )
          .join("\n")}\n\nTotal: KSh ${total.toLocaleString()}\n\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}`;

        const whatsappUrl = `https://wa.me/254710835445?text=${encodeURIComponent(message)}`;
        
        setPaymentStatus({
          status: 'success',
          message: 'Order placed! Redirecting to WhatsApp...',
        });

        dispatch(clearCart());
        
        setTimeout(() => {
          window.open(whatsappUrl, "_blank");
          router.push("/orders");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      setPaymentStatus({
        status: 'failed',
        message: error.message || "Failed to place order",
      });
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  // Render payment status
  const renderPaymentStatus = () => {
    if (paymentStatus.status === 'idle') return null;

    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
      processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
      success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
      failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
      cancelled: { icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
      insufficient_funds: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
    };

    const config = statusConfig[paymentStatus.status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;

    // ✅ Special rendering for insufficient funds
    if (paymentStatus.status === 'insufficient_funds') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl ${config?.bg} border ${config?.border}`}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle className={`h-6 w-6 ${config?.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-700 dark:text-amber-400">Insufficient M-Pesa Balance</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {paymentStatus.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Please top up your M-Pesa and try again, or choose a different payment method.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  onClick={() => setPaymentStatus({ status: 'idle', message: '' })}
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

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg ${config?.bg} border ${config?.border}`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 ${config?.color} ${paymentStatus.status === 'processing' || paymentStatus.status === 'pending' ? 'animate-spin' : ''}`} />
          <div>
            <p className="font-medium text-sm">{paymentStatus.message}</p>
            {paymentStatus.checkoutRequestId && (
              <p className="text-xs text-gray-500 mt-1">
                Reference: {paymentStatus.checkoutRequestId.slice(0, 16)}...
              </p>
            )}
            {paymentStatus.resultDesc && (
              <p className="text-xs text-red-500 mt-1">
                Error: {paymentStatus.resultDesc}
              </p>
            )}
            {paymentStatus.status === 'pending' && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-20 bg-gray-200 rounded overflow-hidden">
                  <motion.div
                    className="h-full bg-pink-600 rounded"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <span className="text-xs text-gray-500">Waiting for PIN...</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // ✅ Loading state - only show if cart is empty and not in payment flow
  if (isCartEmpty && paymentStatus.status === 'idle' && !isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          <p className="text-gray-500 text-sm">Redirecting to cart...</p>
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
            <Link href="/auth/login" className="ml-2 font-medium hover:underline">
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
                      This is your registered phone number. You can update it in your profile.
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
                  Delivery Address
                </h3>
                
                {/* Location Search */}
                <div className="space-y-2">
                  <Label>Search Location (Nairobi Area)</Label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search for a location in Nairobi..."
                          value={searchQuery}
                          onChange={(e) => {
                            handleLocationSearch(e.target.value);
                          }}
                          onFocus={() => setShowLocationSearch(true)}
                          className="pl-10"
                          disabled={!googleMapsLoaded}
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
                        disabled={!googleMapsLoaded || isLoadingLocation}
                        className="shrink-0"
                      >
                        {isLoadingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LocateFixed className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Location Suggestions */}
                    <AnimatePresence>
                      {showLocationSearch && (placePredictions.length > 0 || isSearchingLocation) && (
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
                            placePredictions.map((prediction) => (
                              <button
                                key={prediction.place_id}
                                type="button"
                                onClick={() => selectLocation(prediction)}
                                className="w-full text-left px-4 py-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                              >
                                <div className="flex items-start gap-3">
                                  <MapPin className="h-4 w-4 text-pink-600 mt-1 shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {prediction.structured_formatting.main_text}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {prediction.structured_formatting.secondary_text}
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
                    Search for locations within Nairobi area or use the GPS button to detect your current location
                  </p>
                  {!googleMapsLoaded && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Google Maps is loading. Please wait...
                    </p>
                  )}
                </div>

                {/* Address Details */}
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
                    className={addressUpdated ? 'border-green-500' : ''}
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

                {/* Save as default address */}
                {user && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAsDefaultAddress}
                      onChange={(e) => setSaveAsDefaultAddress(e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
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
                  onValueChange={(value: any) => setPaymentMethod(value)}
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
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-6 space-y-3"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">M-Pesa Number:</span>{' '}
                          {useDifferentPhone ? (
                            <span className="text-pink-600 font-medium">
                              {differentPhone || 'Not set'}
                            </span>
                          ) : (
                            <span className="text-pink-600 font-medium">
                              {formData.phone || 'Not set'}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {useDifferentPhone 
                            ? 'Using a different phone number for payment'
                            : 'Using your registered phone number'}
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
                        <Label htmlFor="differentPhone" className="text-sm cursor-pointer">
                          Use a different phone number for payment
                        </Label>
                      </div>
                      
                      {useDifferentPhone && (
                        <div className="space-y-2">
                          <Label htmlFor="mpesaPhone">M-Pesa Phone Number *</Label>
                          <Input
                            id="mpesaPhone"
                            type="tel"
                            placeholder="0712 345 678"
                            value={differentPhone}
                            onChange={(e) => {
                              setDifferentPhone(e.target.value);
                              setPhoneError("");
                            }}
                            className={phoneError ? 'border-red-500' : ''}
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

            {paymentStatus.status === 'success' && receiptData && (
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
                  onClick={() => router.push('/orders')}
                  className="flex-1"
                >
                  View Orders
                </Button>
              </motion.div>
            )}

            {paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled' ? (
              <Button
                type="button"
                onClick={() => setPaymentStatus({ status: 'idle', message: '' })}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              >
                Try Again
              </Button>
            ) : paymentStatus.status !== 'success' && paymentStatus.status !== 'insufficient_funds' && (
              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg py-6"
                disabled={isLoading || paymentStatus.status === 'processing' || paymentStatus.status === 'pending'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : paymentStatus.status === 'pending' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Waiting for Payment...
                  </>
                ) : (
                  `Place Order • KSh ${total.toLocaleString()}`
                )}
              </Button>
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