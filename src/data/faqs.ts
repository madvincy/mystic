// src/data/faqs.ts
export const faqData = {
  categories: [
    {
      id: 'ordering',
      name: 'Ordering & Delivery',
      icon: '🛍️',
      questions: [
        {
          id: 'order-online',
          question: 'How do I place an order?',
          answer: 'You can place an order through our website by browsing our collection, adding items to your cart, and proceeding to checkout. You can also order via WhatsApp by sending us a message at 0710 835 445 with your desired items.'
        },
        {
          id: 'delivery-time',
          question: 'How long does delivery take?',
          answer: 'Delivery typically takes 1-3 business days within Nairobi and its environs. For areas outside Nairobi, delivery may take 2-5 business days. We strive to deliver as quickly as possible to ensure your wines arrive in perfect condition.'
        },
        {
          id: 'delivery-fee',
          question: 'What are the delivery charges?',
          answer: 'Delivery is FREE for orders above KSh 5,000. For orders below this amount, a delivery fee of KSh 300 applies within Nairobi. For other locations, delivery fees will be calculated at checkout based on your location.'
        },
        {
          id: 'track-order',
          question: 'How can I track my order?',
          answer: 'Once your order is confirmed and dispatched, you will receive a tracking number via SMS or email. You can also log into your account on our website to view the real-time status of your order.'
        },
        {
          id: 'international-delivery',
          question: 'Do you deliver internationally?',
          answer: 'Currently, we only deliver within Kenya. However, we are working on expanding our delivery network. For international inquiries, please contact us directly at info@mysticwines.co.ke.'
        }
      ]
    },
    {
      id: 'products',
      name: 'Products & Selection',
      icon: '🍷',
      questions: [
        {
          id: 'product-quality',
          question: 'How do you ensure product quality?',
          answer: 'We source our wines and spirits from reputable suppliers and distributors. Each product is carefully selected by our team of experts. We store our products in temperature-controlled environments to maintain their quality and taste.'
        },
        {
          id: 'product-authenticity',
          question: 'Are your products authentic?',
          answer: 'Absolutely! We guarantee 100% authenticity of all products sold on Mystic Wines. We work directly with authorized distributors and importers to ensure every bottle is genuine.'
        },
        {
          id: 'product-availability',
          question: 'What if a product is out of stock?',
          answer: 'If a product is out of stock, you can sign up for a "Back in Stock" notification. We\'ll send you an email or SMS as soon as the product becomes available again.'
        },
        {
          id: 'product-recommendations',
          question: 'Can you recommend products based on my taste?',
          answer: 'Yes! Our team of experts can help you find the perfect wine or spirit based on your preferences. Simply contact us via WhatsApp at 0710 835 445 and we\'ll provide personalized recommendations.'
        },
        {
          id: 'gift-wrapping',
          question: 'Do you offer gift wrapping services?',
          answer: 'Yes, we offer premium gift wrapping services for all our products. You can select the gift wrapping option during checkout, and we\'ll beautifully wrap your items with a personalized message.'
        }
      ]
    },
    {
      id: 'payment',
      name: 'Payment & Pricing',
      icon: '💳',
      questions: [
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept M-Pesa, Cash on Delivery, and Credit/Debit Cards (Visa, Mastercard). M-Pesa is our preferred payment method for its convenience and speed.'
        },
        {
          id: 'mpesa-payment',
          question: 'How do I pay with M-Pesa?',
          answer: 'After placing your order, you will receive an STK push on your M-Pesa registered number. Simply enter your M-Pesa PIN to confirm the payment. You can also pay via Paybill by following the instructions provided at checkout.'
        },
        {
          id: 'price-match',
          question: 'Do you offer price matching?',
          answer: 'We strive to offer competitive pricing on all our products. If you find a lower price on the same product from a legitimate retailer, please contact us and we\'ll do our best to match the price.'
        },
        {
          id: 'bulk-discounts',
          question: 'Do you offer discounts for bulk orders?',
          answer: 'Yes, we offer special discounts for bulk orders. Please contact our sales team at sales@mysticwines.co.ke or call us at 0710 835 445 to discuss your requirements.'
        }
      ]
    },
    {
      id: 'returns',
      name: 'Returns & Refunds',
      icon: '🔄',
      questions: [
        {
          id: 'return-policy',
          question: 'What is your return policy?',
          answer: 'We accept returns within 7 days of delivery for unopened and undamaged products. The product must be in its original packaging. Please contact us at returns@mysticwines.co.ke to initiate a return.'
        },
        {
          id: 'damaged-products',
          question: 'What if I receive a damaged product?',
          answer: 'If you receive a damaged or defective product, please contact us immediately at 0710 835 445 or info@mysticwines.co.ke. We will arrange for a replacement or full refund.'
        },
        {
          id: 'refund-processing',
          question: 'How long does a refund take?',
          answer: 'Refunds are processed within 3-5 business days after we receive and inspect the returned product. The refund will be credited back to your original payment method.'
        }
      ]
    },
    {
      id: 'account',
      name: 'Account & Support',
      icon: '👤',
      questions: [
        {
          id: 'create-account',
          question: 'How do I create an account?',
          answer: 'You can create an account by clicking on the "Sign Up" button in the top right corner of our website. You can sign up using your email address or with your Google account.'
        },
        {
          id: 'reset-password',
          question: 'How do I reset my password?',
          answer: 'If you\'ve forgotten your password, click on the "Forgot Password" link on the login page. We\'ll send you a password reset link to your registered email address.'
        },
        {
          id: 'update-profile',
          question: 'How do I update my profile information?',
          answer: 'After logging in, go to your Dashboard and click on "Profile Settings". Here you can update your name, email, phone number, and delivery address.'
        },
        {
          id: 'contact-support',
          question: 'How can I contact support?',
          answer: 'You can reach our support team via phone at 0710 835 445, email at info@mysticwines.co.ke, or through our WhatsApp business line. We are available Monday to Friday, 9 AM to 8 PM.'
        }
      ]
    },
    {
      id: 'promotions',
      name: 'Promotions & Offers',
      icon: '🎉',
      questions: [
        {
          id: 'promotions',
          question: 'How do I stay updated on promotions?',
          answer: 'Subscribe to our newsletter, follow us on social media, and download our mobile app to stay updated on the latest promotions, flash sales, and exclusive offers.'
        },
        {
          id: 'referral-program',
          question: 'Do you have a referral program?',
          answer: 'Yes! Refer a friend and both you and your friend get KSh 500 off your next order. Simply share your referral link with friends and family.'
        },
        {
          id: 'loyalty-program',
          question: 'Is there a loyalty program?',
          answer: 'Yes, we have a loyalty program where you earn points on every purchase. Accumulated points can be redeemed for discounts on future orders. Sign up to start earning today!'
        }
      ]
    }
  ]
}