// src/app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { clearCart } from "@/lib/store/cartSlice";
import { useHybridAuth } from "@/providers/HybridAuthProvider";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { isValidMpesaPhone } from "@/lib/utils/mpesa";
import PhoneInput from "@/components/ui/PhoneInput";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    supabaseToken,
    isSynced,
    isLoading: isAuthLoading,
    isGuest,
  } = useHybridAuth();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("mpesa");
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "Ongata Rongai",
    country: "Kenya",
  });

  // Check if cart has items
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
    setIsPageLoading(false);
  }, [items, router]);

  // Update form data when session loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata?.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Handle loading states - only show loading if explicitly loading
  if (isPageLoading || status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          <p className="text-gray-500 text-sm">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Only show auth loading if it's actually loading and not a guest
  if (isAuthLoading && !isGuest && status === "authenticated") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
          <p className="text-gray-500 text-sm">Syncing your account...</p>
        </div>
      </div>
    );
  }

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

    setIsLoading(true);

    try {
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
          address: formData.address,
          city: formData.city,
          country: formData.country,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(
        `📝 Creating order for ${isGuest ? "GUEST" : "AUTHENTICATED"} user`,
      );

      // Use regular Supabase client
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("❌ Order error:", orderError);
        throw new Error(orderError.message || "Failed to create order");
      }

      console.log("✅ Order created successfully:", order.id);

      // Create order items
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
        console.error("❌ Order items error:", itemsError);
        throw new Error(itemsError.message || "Failed to create order items");
      }

      if (paymentMethod === "mpesa") {
        // ✅ Validate phone before sending
        if (!isValidMpesaPhone(formData.phone)) {
          toast.error(
            "Please enter a valid M-Pesa phone number (e.g., 0712345678)",
          );
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/mpesa/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formData.phone,
            amount: Math.round(total),
            orderId: order.order_number || order.id,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          if (result.code === "INVALID_PHONE") {
            toast.error("Invalid phone number format. Please use 0712345678");
          } else {
            toast.error(result.error || "M-Pesa payment failed");
          }
          return;
        }

        toast.success("M-Pesa STK push sent! Please check your phone.");
      } else {
        // Cash payment - redirect to WhatsApp
        const message = `Hello Mystic Wines,\n\nI want to place an order:\n\n${items
          .map(
            (item) =>
              `${item.name} x${item.quantity} - KSh ${(item.price * item.quantity).toLocaleString()}`,
          )
          .join(
            "\n",
          )}\n\nTotal: KSh ${total.toLocaleString()}\n\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}`;

        const whatsappUrl = `https://wa.me/254710835445?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
      }

      dispatch(clearCart());
      toast.success("Order placed successfully! 🎉");

      if (user) {
        router.push("/orders");
      } else {
        router.push(`/order-confirmation?order=${order.id}`);
      }
    } catch (error: any) {
      console.error("❌ Checkout error:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
                  <div className="relative">
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) =>
                        setFormData({ ...formData, phone: value })
                      }
                      label="Phone Number *"
                      placeholder="0712 345 678"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  Delivery Address
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
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
              </CardContent>
            </Card>

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
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="h-5 w-5 text-green-600" />
                      M-Pesa
                      <span className="text-xs text-gray-500">
                        (Pay with M-Pesa)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-pink-500 transition cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label
                      htmlFor="cash"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      Cash on Delivery
                      <span className="text-xs text-gray-500">
                        (Pay via WhatsApp)
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place Order • KSh ${total.toLocaleString()}`
              )}
            </Button>
          </form>
        </div>

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
