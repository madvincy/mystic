// src/app/about/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  Wine,
  Award,
  Users,
  Truck,
  Star,
  Heart,
  Shield,
  Clock,
  ArrowRight,
  Gift,
  Link,
} from "lucide-react";
import { Card, CardContent } from "@/components/shadCn/ui/card";
import { Button } from "@/components/shadCn/ui/button";

export default function AboutPage() {
  const values = [
    {
      icon: Award,
      title: "Quality First",
      description:
        "We source only the finest wines and spirits from around the world.",
    },
    {
      icon: Users,
      title: "Expert Knowledge",
      description: "Our team of sommeliers and experts curate every selection.",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description:
        "We deliver your orders quickly and safely to your doorstep.",
    },
    {
      icon: Heart,
      title: "Passion for Wine",
      description: "Every bottle is chosen with love and expertise.",
    },
  ];

  const stats = [
    { value: "500+", label: "Premium Brands" },
    { value: "10K+", label: "Happy Customers" },
    { value: "5+", label: "Years of Excellence" },
    { value: "100%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="relative mb-4">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 text-white py-12 md:py-20 px-6 md:px-12 mt-4"
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-10 right-10 opacity-10">
              <Wine className="h-32 w-32" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              >
                🍷 Premium Selection
              </motion.div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Welcome to
                <span className="block text-white/90">Mystic Wines</span>
              </h1>
              <p className="text-base md:text-lg text-white/80 max-w-xl mb-8">
                Discover our exquisite collection of premium wines & spirits,
                delivered with care.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="bg-white text-pink-600 hover:bg-white/90 hover:text-pink-700 shadow-lg"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/gifts">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Gift Ideas
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
                {[
                  { label: "Premium Brands", value: "500+" },
                  { label: "Happy Customers", value: "10K+" },
                  { label: "Years Excellence", value: "5+" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-xl md:text-2xl font-bold">
                      {stat.value}
                    </p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-12"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full">
            <Wine className="h-12 w-12 text-pink-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          About Mystic Wines
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          We are passionate about bringing you the finest selection of wines and
          spirits from around the world. Our journey began with a simple
          mission: to make premium drinks accessible to everyone.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <p className="text-3xl font-bold text-pink-600">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Values */}
      <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {values.map((value, index) => {
          const Icon = value.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-500">{value.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Story Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Mystic Wines was founded with a vision to bring the world's finest
            wines and spirits to Kenya. What started as a small passion project
            has grown into a trusted destination for wine lovers and
            connoisseurs across the country.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Today, we continue to explore and discover new treasures from
            vineyards and distilleries around the globe, ensuring that every
            bottle in our collection tells a story of quality, craftsmanship,
            and passion.
          </p>
        </div>
      </motion.div>

      {/* Contact CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-12"
      >
        <h3 className="text-xl font-semibold mb-2">Have questions?</h3>
        <p className="text-gray-500 mb-4">We'd love to hear from you</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:0710835445" className="text-pink-600 hover:underline">
            📞 0710 835 445
          </a>
          <a
            href="mailto:info@mysticwines.co.ke"
            className="text-pink-600 hover:underline"
          >
            ✉️ info@mysticwines.co.ke
          </a>
          <a href="/contact" className="text-pink-600 hover:underline">
            📍 Visit Us
          </a>
        </div>
      </motion.div>
    </div>
  );
}
