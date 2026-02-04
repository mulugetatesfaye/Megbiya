"use client";

import { use, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  Loader2,
  CreditCard,
  User,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import type { EventDetail } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

interface CartData {
  eventId: string;
  items: CartItem[];
  total: number;
  currency: string;
}

function formatPrice(cents: number, currency: string = "ETB") {
  if (cents === 0) return "Free";

  const amount = cents / 100;

  if (currency === "ETB") {
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ETB`;
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

export default function CheckoutPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const event = useQuery(api.events.getEventBySlug, {
    slug,
  }) as EventDetail | null | undefined;

  const createFreeOrder = useMutation(api.orders.createFreeOrder);
  const createPaidOrder = useMutation(api.orders.createPaidOrder);
  const completeOrderPayment = useMutation(api.orders.completeOrderPayment);

  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"cart" | "details" | "payment" | "confirming">("cart");

  // Customer details
  const [customerDetails, setCustomerDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "telebirr" | "cbe">("card");

  useEffect(() => {
    // Load cart data from localStorage
    const cart = localStorage.getItem(`cart-${slug}`);
    if (cart) {
      try {
        const parsedCart = JSON.parse(cart);
        setCartData(parsedCart);
      } catch (error) {
        console.error("Failed to parse cart data:", error);
        router.push(`/events/${slug}`);
      }
    } else {
      router.push(`/events/${slug}`);
    }
  }, [slug, router]);

  if (event === undefined || !cartData) {
    return (
      <div className="container max-w-4xl py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-32 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) notFound();

  // Get ticket details for cart items
  const cartItemsWithDetails = cartData.items.map((item) => {
    const ticketType = event.ticketTypes.find((t) => t._id === item.ticketTypeId);
    return ticketType ? { ...item, ticketType } : null;
  }).filter(Boolean);

  const isFreeOrder = cartData.total === 0;

  async function handleFreeOrder() {
    const cart = cartData;
    if (!cart || !cart.items.length) return;
    if (!event) return;

    try {
      setLoading(true);
      setStep("confirming");

      const firstItem = cart.items[0];
      await createFreeOrder({
        eventId: cart.eventId as any,
        ticketTypeId: firstItem.ticketTypeId as any,
        quantity: firstItem.quantity,
      });

      // Clear cart
      localStorage.removeItem(`cart-${slug}`);

      router.push(`/events/${event.slug}/confirmation`);
    } catch (error) {
      console.error("Failed to create free order:", error);
      setStep("cart");
      setLoading(false);
    }
  }

  async function handlePaidOrder() {
    const cart = cartData;
    if (!cart || !cart.items.length) return;
    if (!event) return;

    try {
      setLoading(true);
      setStep("confirming");

      // Create paid order
      const orderResult = await createPaidOrder({
        eventId: cart.eventId as any,
        items: cart.items.map(item => ({
          ticketTypeId: item.ticketTypeId as any,
          quantity: item.quantity,
        })),
      });

      // Simulate payment completion (in real app, this would integrate with payment provider)
      await completeOrderPayment({
        orderId: orderResult.orderId,
        paymentIntentId: `simulated-${Date.now()}`,
        items: cart.items.map(item => ({
          ticketTypeId: item.ticketTypeId as any,
          quantity: item.quantity,
        })),
      });

      // Clear cart
      localStorage.removeItem(`cart-${slug}`);

      router.push(`/events/${event.slug}/confirmation`);
    } catch (error) {
      console.error("Failed to create paid order:", error);
      setStep("cart");
      setLoading(false);
    }
  }

  function handleContinue() {
    if (step === "cart") {
      if (isFreeOrder) {
        handleFreeOrder();
      } else {
        setStep("details");
      }
    } else if (step === "details") {
      setStep("payment");
    } else if (step === "payment") {
      handlePaidOrder();
    }
  }

  function handleBack() {
    if (step === "details") setStep("cart");
    else if (step === "payment") setStep("details");
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/events/${slug}`)}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to event
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="mt-1 text-muted-foreground">
              {step === "cart" && "Review your tickets"}
              {step === "details" && "Enter your details"}
              {step === "payment" && "Complete payment"}
              {step === "confirming" && "Processing your order..."}
            </p>
          </div>

          {/* Progress indicator */}
          {!isFreeOrder && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === "cart" || step === "details" || step === "payment"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                1
              </div>
              <div className="w-4 h-px bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === "details" || step === "payment"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                2
              </div>
              <div className="w-4 h-px bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === "payment"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                3
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* LEFT — ORDER DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          {/* EVENT INFO */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Image
                  src={event.coverImageUrl}
                  alt={event.title}
                  width={120}
                  height={120}
                  className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold mb-2">{event.title}</h2>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.startDate), "EEE, MMM d, yyyy · h:mm a")}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.locationName}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CART ITEMS */}
          {step === "cart" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Your Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItemsWithDetails.map((item) => {
                  if (!item?.ticketType) return null;

                  return (
                    <div key={item.ticketTypeId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.ticketType.name}</p>
                        {item.ticketType.description && (
                          <p className="text-sm text-muted-foreground">{item.ticketType.description}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(item.ticketType.price * item.quantity, item.ticketType.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                    </div>
                  );
                })}

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(cartData.total, cartData.currency)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CUSTOMER DETAILS */}
          {step === "details" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={customerDetails.firstName}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={customerDetails.lastName}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* PAYMENT METHOD */}
          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      Credit/Debit Card
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="telebirr" id="telebirr" />
                    <Label htmlFor="telebirr" className="flex items-center gap-2 cursor-pointer">
                      <Phone className="h-4 w-4" />
                      TeleBirr
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cbe" id="cbe" />
                    <Label htmlFor="cbe" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      CBE Bank
                    </Label>
                  </div>
                </RadioGroup>

                {/* Card details for card payment */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="John Doe" />
                    </div>
                  </div>
                )}

                {/* Mobile number for TeleBirr */}
                {paymentMethod === "telebirr" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input id="mobileNumber" placeholder="+251 9XX XXX XXX" />
                    </div>
                  </div>
                )}

                {/* Account details for CBE */}
                {paymentMethod === "cbe" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" placeholder="1000XXXXXXXX" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PROCESSING */}
          {step === "confirming" && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin mx-auto mb-4">
                  <Loader2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">Processing your order...</h3>
                <p className="text-muted-foreground">Please don't close this window</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT — ORDER SUMMARY */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItemsWithDetails.map((item) => {
                if (!item?.ticketType) return null;

                return (
                  <div key={item.ticketTypeId} className="flex justify-between text-sm">
                    <span>
                      {item.ticketType.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.ticketType.price * item.quantity, item.ticketType.currency)}
                    </span>
                  </div>
                );
              })}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(cartData.total, cartData.currency)}</span>
              </div>

              {/* Action buttons */}
              {step !== "confirming" && (
                <div className="space-y-3 pt-4">
                  {step !== "cart" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      Back
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleContinue}
                    disabled={loading || (step === "details" && (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.email))}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isFreeOrder ? (
                      "Get Tickets"
                    ) : step === "cart" ? (
                      "Continue"
                    ) : step === "details" ? (
                      "Continue to Payment"
                    ) : (
                      `Pay ${formatPrice(cartData.total, cartData.currency)}`
                    )}
                  </Button>
                </div>
              )}

              {/* Trust indicators */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  Secure checkout
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Instant digital delivery
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ticket className="h-4 w-4 text-green-600" />
                  QR code entry
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
