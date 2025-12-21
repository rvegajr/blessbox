'use client';

import { useState, useEffect, useRef } from 'react';

// Square Web Payments SDK types
declare global {
  interface Window {
    Square: {
      payments: (applicationId: string, locationId: string) => {
        card: () => Promise<{
          tokenize: () => Promise<{ status: string; token?: string }>;
          attach: (selector: string) => Promise<void>;
          destroy: () => Promise<void>;
        }>;
      };
    };
  }
}

interface SquarePaymentFormProps {
  amount: number;
  currency: string;
  planType: 'free' | 'standard' | 'enterprise';
  billingCycle?: 'monthly' | 'yearly';
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentError: (error: string) => void;
  applicationId: string;
  locationId: string;
  environment?: 'sandbox' | 'production';
}

export default function SquarePaymentForm({
  amount,
  currency,
  planType,
  billingCycle = 'monthly',
  onPaymentSuccess,
  onPaymentError,
  applicationId,
  locationId,
  environment = 'sandbox',
}: SquarePaymentFormProps) {
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initializingRef = useRef(false);
  const cardRef = useRef<any>(null);

  useEffect(() => {
    // Prevent double initialization (React Strict Mode)
    if (initializingRef.current) return;
    if (!applicationId || !locationId) return;

    initializingRef.current = true;

    const initializeSquare = async () => {
      try {
        // Wait for container to be in DOM
        let container = document.getElementById('card-container');
        let attempts = 0;
        while (!container && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 50));
          container = document.getElementById('card-container');
          attempts++;
        }
        
        if (!container) {
          throw new Error('Card container not found');
        }

        // Clear any existing content (in case of re-initialization)
        container.innerHTML = '';

        // Load Square Web Payments SDK if not already loaded
        if (!window.Square) {
          const script = document.createElement('script');
          // Use production or sandbox SDK based on environment
          script.src = environment === 'production'
            ? 'https://web.squarecdn.com/v1/square.js'
            : 'https://sandbox.web.squarecdn.com/v1/square.js';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        // Initialize Square Payments
        const payments = window.Square.payments(applicationId, locationId);
        setPayments(payments);

        // Create card payment method
        const card = await payments.card({
          style: {
            '.input-container': {
              borderColor: '#E0E0E0',
              borderRadius: '8px',
            },
            '.input-container.is-focus': {
              borderColor: '#4A90E2',
            },
            '.input-container.is-error': {
              borderColor: '#E74C3C',
            },
            '.message-text': {
              color: '#E74C3C',
            },
            '.message-icon': {
              color: '#E74C3C',
            },
          },
        });

        // Attach card to container
        await card.attach('#card-container');
        cardRef.current = card;
        setCard(card);
        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize Square Payments:', error);
        setIsInitializing(false);
        initializingRef.current = false;
        onPaymentError('Failed to initialize payment form');
      }
    };

    initializeSquare();

    // Cleanup on unmount
    return () => {
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        cardRef.current = null;
      }
      initializingRef.current = false;
    };
  }, [applicationId, locationId, environment, onPaymentError]);

  const handlePayment = async () => {
    if (!card || !payments) {
      onPaymentError('Payment form not initialized');
      return;
    }

    setIsLoading(true);

    try {
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Send the payment token to our backend
        const response = await fetch('/api/payment/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentToken: result.token,
            amount: amount,
            currency: currency,
            planType,
            billingCycle,
          }),
        });

        const paymentResult = await response.json();

        if (paymentResult.success) {
          onPaymentSuccess(paymentResult);
        } else {
          onPaymentError(paymentResult.error || 'Payment failed');
        }
      } else {
        onPaymentError('Card tokenization failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onPaymentError('Payment processing failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Information
        </h3>
        
        {/* Square Card Input - always rendered so Square can attach to it */}
        <div id="card-container" className="mb-4 min-h-[50px]">
          {/* Square will inject the card form here */}
        </div>
        {isInitializing && (
          <div className="flex items-center justify-center p-2 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Loading payment form...</span>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Amount:</span>
            <span className="text-lg font-semibold text-gray-900">
              ${(amount / 100).toFixed(2)} {currency}
            </span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isLoading || isInitializing || !card}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Secure payment powered by Square</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
}
