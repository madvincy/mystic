// src/components/ui/Footer.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Send,
  ArrowUp,
  CreditCard,
  Shield,
  Truck,
  Gift,
  Github,
  Linkedin,
  MessageCircle,
  Globe,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/shadCn/ui/input";
import { Button } from "@/components/shadCn/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Map platform names to Lucide icons
const iconMap: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  github: Github,
  website: Globe,
  default: LinkIcon,
};

interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
}

export default function Footer() {
  // ✅ ALL HOOKS AT THE TOP
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  // ✅ Early return AFTER all hooks have been called
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // ✅ Fetch social links from database
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const { data, error } = await supabase
          .from("social_links")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setSocialLinks(data || []);
      } catch (error) {
        console.error("Error fetching social links:", error);
        // Fallback to default links if database fails
        setSocialLinks([
          { id: "1", platform: "facebook", url: "https://facebook.com/mysticwines", icon: "Facebook", is_active: true },
          { id: "2", platform: "twitter", url: "https://twitter.com/mysticwines", icon: "Twitter", is_active: true },
          { id: "3", platform: "instagram", url: "https://instagram.com/mysticwines", icon: "Instagram", is_active: true },
          { id: "4", platform: "youtube", url: "https://youtube.com/mysticwines", icon: "Youtube", is_active: true },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, []);

  // ✅ Newsletter subscription handler
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubscribing(true);

    try {
      // Check if email already exists
      const { data: existing, error: checkError } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, status")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        if (existing.status === 'active') {
          toast.info("You're already subscribed to our newsletter! 🎉");
          setSubscribed(true);
          setEmail("");
          return;
        } else if (existing.status === 'unsubscribed') {
          // Reactivate subscription
          const { error: updateError } = await supabase
            .from("newsletter_subscribers")
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
          
          toast.success("Welcome back! You've been resubscribed 🎉");
          setSubscribed(true);
          setEmail("");
          return;
        }
      }

      // Insert new subscriber
      const { error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: email.toLowerCase().trim(),
          status: 'active',
          subscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: 'website_footer',
        });

      if (insertError) throw insertError;

      toast.success("Subscribed successfully! 🎉 Check your email for confirmation.");
      setSubscribed(true);
      setEmail("");

      // Optional: Send confirmation email (you'd need an API endpoint for this)
      // await fetch('/api/newsletter/confirm', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        toast.info("You're already subscribed to our newsletter! 🎉");
        setSubscribed(true);
        setEmail("");
      } else {
        toast.error(error.message || "Failed to subscribe. Please try again.");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerLinks = {
    Shop: [
      { name: "All Products", href: "/products" },
      { name: "Wines", href: "/products?category=wine" },
      { name: "Spirits", href: "/products?category=spirits" },
      { name: "Sparkling", href: "/products?category=sparkling" },
      { name: "Gift Sets", href: "/gifts" },
    ],
    "Customer Service": [
      { name: "Shipping Policy", href: "/shipping" },
      { name: "Returns & Refunds", href: "/returns" },
      { name: "FAQs", href: "/faq" },
      { name: "Contact Us", href: "/contact" },
    ],
    About: [
      { name: "Our Story", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  // ✅ Get the appropriate icon component
  const getIcon = (platform: string) => {
    const Icon = iconMap[platform.toLowerCase()] || iconMap.default;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white mt-16 relative">
      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="absolute -top-5 left-1/2 -translate-x-1/2 bg-pink-600 hover:bg-pink-700 p-3 rounded-full shadow-lg transition-all hover:scale-110"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Main Footer */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                MysticWines
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Premium wines & spirits delivered with care. Discover our
              exquisite collection from around the world.
            </p>
            <div className="flex flex-wrap gap-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
                ))
              ) : socialLinks.length > 0 ? (
                socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors duration-300 hover:scale-110 transform"
                    aria-label={social.platform}
                  >
                    {getIcon(social.platform)}
                  </a>
                ))
              ) : (
                // Fallback links
                <>
                  <a
                    href="https://facebook.com/mysticwines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="https://twitter.com/mysticwines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="https://instagram.com/mysticwines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://youtube.com/mysticwines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors"
                    aria-label="Youtube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-lg mb-4 text-pink-400">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-pink-400 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-lg mb-4 text-pink-400">
              Newsletter
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Subscribe for exclusive offers and updates
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 flex-1 pr-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing || subscribed}
                  required
                />
                {subscribed && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700"
                disabled={isSubscribing || subscribed}
              >
                {isSubscribing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : subscribed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            {subscribed ? (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Subscribed successfully!
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                Get 10% off your first order
              </p>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-800">
          {[
            {
              icon: Truck,
              label: "Free Delivery",
              description: "On orders over KSh 5,000",
            },
            {
              icon: Shield,
              label: "Secure Payment",
              description: "100% secure transactions",
            },
            {
              icon: Gift,
              label: "Gift Cards",
              description: "Perfect for any occasion",
            },
            {
              icon: CreditCard,
              label: "M-Pesa Accepted",
              description: "Pay with M-Pesa",
            },
          ].map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <Icon className="h-8 w-8 mx-auto text-pink-400 mb-2" />
                <p className="font-medium text-sm">{benefit.label}</p>
                <p className="text-xs text-gray-400">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">We accept:</span>
            <div className="flex gap-3">
              <img
                src="/images/mpesa.png"
                alt="M-Pesa"
                className="h-8 bg-white rounded p-1"
              />
              <img
                src="/images/visa.png"
                alt="Visa"
                className="h-8 bg-white rounded p-1"
              />
              <img
                src="/images/mastercard.png"
                alt="Mastercard"
                className="h-8 bg-white rounded p-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-pink-400">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-pink-400">
              Terms
            </Link>
            <span>•</span>
            <p>
              &copy; {new Date().getFullYear()} Mystic Wines. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}