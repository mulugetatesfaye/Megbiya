"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MapPin,
  Ticket,
  Plus,
  X,
  ImageIcon,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number; // in ETB (will convert to cents)
  quantity: number;
  saleStart: Date;
  saleEnd: Date;
  isVisible: boolean;
  minPerOrder: number;
  maxPerOrder: number;
}

const STEPS = [
  { id: "basic", title: "Basic Info", icon: Info },
  { id: "details", title: "Details", icon: Sparkles },
  { id: "location", title: "Location", icon: MapPin },
  { id: "tickets", title: "Tickets", icon: Ticket },
  { id: "review", title: "Review", icon: CheckCircle2 },
];

const DRAFT_STORAGE_KEY = "event-draft";

export default function CreateEventPage() {
  const router = useRouter();
  const createEvent = useMutation(api.events.createEvent);
  const categories = useQuery(api.categories.getAllCategories);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSaved, setAutoSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    coverImageUrl: "",
    locationName: "",
    address: "",
    startDate: "",
    endDate: "",
    totalCapacity: "",
    tags: "",
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      id: "1",
      name: "General Admission",
      description: "Standard entry ticket",
      price: 0,
      quantity: 100,
      saleStart: new Date(),
      saleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isVisible: true,
      minPerOrder: 1,
      maxPerOrder: 10,
    },
  ]);

  // Auto-save to localStorage
  useEffect(() => {
    const draft = {
      formData,
      ticketTypes,
      currentStep,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setAutoSaved(true);
    const timer = setTimeout(() => setAutoSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [formData, ticketTypes, currentStep]);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData(draft.formData || formData);
        
        // Restore ticket types and convert date strings back to Date objects
        if (draft.ticketTypes && Array.isArray(draft.ticketTypes)) {
          const restoredTicketTypes = draft.ticketTypes.map((tt: any) => ({
            ...tt,
            saleStart: tt.saleStart ? new Date(tt.saleStart) : new Date(),
            saleEnd: tt.saleEnd ? new Date(tt.saleEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }));
          setTicketTypes(restoredTicketTypes);
        }
        
        setCurrentStep(draft.currentStep || 0);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addTicketType = () => {
    const newId = (ticketTypes.length + 1).toString();
    setTicketTypes([
      ...ticketTypes,
      {
        id: newId,
        name: "",
        description: "",
        price: 0,
        quantity: 50,
        saleStart: new Date(),
        saleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isVisible: true,
        minPerOrder: 1,
        maxPerOrder: 5,
      },
    ]);
  };

  const updateTicketType = (id: string, updates: Partial<TicketType>) => {
    setTicketTypes(ticketTypes.map((tt) => (tt.id === id ? { ...tt, ...updates } : tt)));
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((tt) => tt.id !== id));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Basic Info
      if (!formData.title.trim()) newErrors.title = "Event title is required";
      if (!formData.categoryId) newErrors.categoryId = "Category is required";
      if (!formData.coverImageUrl.trim()) newErrors.coverImageUrl = "Cover image is required";
    } else if (step === 1) {
      // Details
      if (!formData.description.trim()) newErrors.description = "Description is required";
      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (!formData.endDate) newErrors.endDate = "End date is required";
      if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    } else if (step === 2) {
      // Location
      if (!formData.locationName.trim()) newErrors.locationName = "Venue name is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
    } else if (step === 3) {
      // Tickets
      ticketTypes.forEach((tt) => {
        if (!tt.name.trim()) newErrors[`ticket-${tt.id}-name`] = "Ticket name is required";
        if (tt.price < 0) newErrors[`ticket-${tt.id}-price`] = "Price cannot be negative";
        if (tt.quantity <= 0) newErrors[`ticket-${tt.id}-quantity`] = "Quantity must be greater than 0";
        if (tt.minPerOrder < 1) newErrors[`ticket-${tt.id}-min`] = "Minimum must be at least 1";
        if (tt.maxPerOrder < tt.minPerOrder) newErrors[`ticket-${tt.id}-max`] = "Maximum must be greater than minimum";
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Parse tags
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

      // Convert ticket types
      const ticketTypesData = ticketTypes.map((tt) => {
        // Handle both Date objects and date strings (from localStorage)
        const saleStart = tt.saleStart instanceof Date 
          ? tt.saleStart.getTime() 
          : new Date(tt.saleStart).getTime();
        const saleEnd = tt.saleEnd instanceof Date 
          ? tt.saleEnd.getTime() 
          : new Date(tt.saleEnd).getTime();
        
        return {
          name: tt.name,
          description: tt.description || undefined,
          price: Math.round(tt.price * 100), // Convert to cents
          currency: "ETB",
          totalQuantity: tt.quantity,
          saleStart,
          saleEnd,
          isVisible: tt.isVisible,
          minPerOrder: tt.minPerOrder,
          maxPerOrder: tt.maxPerOrder,
        };
      });

      if (!formData.categoryId) {
        setErrors({ submit: "Category is required" });
        setIsSubmitting(false);
        return;
      }

      const result = await createEvent({
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim(),
        categoryId: formData.categoryId as any,
        coverImageUrl: formData.coverImageUrl.trim(),
        locationName: formData.locationName.trim(),
        address: formData.address.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        totalCapacity: formData.totalCapacity ? parseInt(formData.totalCapacity) : undefined,
        tags,
        ticketTypes: ticketTypesData,
      });

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      router.push(`/dashboard/organizer/events/${result.eventId}/manage`);
    } catch (error: any) {
      console.error("Failed to create event:", error);
      setErrors({ submit: error.message || "Failed to create event. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
        <p className="text-muted-foreground mt-2">
          Follow the steps below to create your event. Your progress is saved automatically.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          {autoSaved && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Draft saved
            </span>
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-2 -mt-5",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StepIcon className="h-5 w-5" />
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && "Start with the basics - title, category, and cover image"}
            {currentStep === 1 && "Add detailed information about your event"}
            {currentStep === 2 && "Tell attendees where your event will take place"}
            {currentStep === 3 && "Set up ticket types and pricing"}
            {currentStep === 4 && "Review all details before publishing"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="e.g., Summer Music Festival 2024"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                <p className="text-xs text-muted-foreground">
                  Choose a clear, engaging title that captures attention
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.categoryId || undefined}
                  onValueChange={(value) => updateFormData("categoryId", value || "")}
                >
                  <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name || "Unnamed Category"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => updateFormData("shortDescription", e.target.value)}
                  placeholder="A brief summary (max 200 characters)"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.shortDescription.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">
                  Cover Image URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={(e) => updateFormData("coverImageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={errors.coverImageUrl ? "border-destructive" : ""}
                />
                {errors.coverImageUrl && <p className="text-sm text-destructive">{errors.coverImageUrl}</p>}
                {formData.coverImageUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border mt-2">
                    <Image
                      src={formData.coverImageUrl}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                      onError={() => setErrors({ ...errors, coverImageUrl: "Invalid image URL" })}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" />
                  Recommended: 1200x600px, high-quality image
                </p>
              </div>
            </>
          )}

          {/* Step 1: Details */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Full Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Describe your event in detail..."
                  rows={8}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                <p className="text-xs text-muted-foreground">
                  Include what attendees can expect, schedule highlights, and important information
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => updateFormData("startDate", e.target.value)}
                    className={errors.startDate ? "border-destructive" : ""}
                  />
                  {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => updateFormData("endDate", e.target.value)}
                    className={errors.endDate ? "border-destructive" : ""}
                  />
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => updateFormData("tags", e.target.value)}
                  placeholder="music, concert, live, entertainment"
                />
                <p className="text-xs text-muted-foreground">
                  Help attendees find your event with relevant keywords
                </p>
              </div>
            </>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="locationName">
                  Venue Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="locationName"
                  value={formData.locationName}
                  onChange={(e) => updateFormData("locationName", e.target.value)}
                  placeholder="e.g., Addis Ababa Convention Center"
                  className={errors.locationName ? "border-destructive" : ""}
                />
                {errors.locationName && <p className="text-sm text-destructive">{errors.locationName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Full Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Street address, city, country"
                  rows={3}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCapacity">Total Capacity (optional)</Label>
                <Input
                  id="totalCapacity"
                  type="number"
                  value={formData.totalCapacity}
                  onChange={(e) => updateFormData("totalCapacity", e.target.value)}
                  placeholder="e.g., 500"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of attendees allowed at the venue
                </p>
              </div>
            </>
          )}

          {/* Step 3: Tickets */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ticket Types</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up different ticket tiers for your event
                  </p>
                </div>
                <Button type="button" onClick={addTicketType} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </div>

              {ticketTypes.map((ticketType, index) => (
                <Card key={ticketType.id} className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Ticket Type {index + 1}</CardTitle>
                      {ticketTypes.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeTicketType(ticketType.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={ticketType.name}
                          onChange={(e) => updateTicketType(ticketType.id, { name: e.target.value })}
                          placeholder="e.g., VIP, General Admission"
                          className={errors[`ticket-${ticketType.id}-name`] ? "border-destructive" : ""}
                        />
                        {errors[`ticket-${ticketType.id}-name`] && (
                          <p className="text-sm text-destructive">{errors[`ticket-${ticketType.id}-name`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Price (ETB) <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={ticketType.price || ""}
                            onChange={(e) =>
                              updateTicketType(ticketType.id, { price: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className={cn(
                              "pl-9",
                              errors[`ticket-${ticketType.id}-price`] ? "border-destructive" : ""
                            )}
                          />
                        </div>
                        {errors[`ticket-${ticketType.id}-price`] && (
                          <p className="text-sm text-destructive">{errors[`ticket-${ticketType.id}-price`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={ticketType.description}
                        onChange={(e) => updateTicketType(ticketType.id, { description: e.target.value })}
                        placeholder="What's included with this ticket?"
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>
                          Quantity <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={ticketType.quantity}
                          onChange={(e) =>
                            updateTicketType(ticketType.id, { quantity: parseInt(e.target.value) || 0 })
                          }
                          min="1"
                          className={errors[`ticket-${ticketType.id}-quantity`] ? "border-destructive" : ""}
                        />
                        {errors[`ticket-${ticketType.id}-quantity`] && (
                          <p className="text-sm text-destructive">{errors[`ticket-${ticketType.id}-quantity`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Min per Order</Label>
                        <Input
                          type="number"
                          value={ticketType.minPerOrder}
                          onChange={(e) =>
                            updateTicketType(ticketType.id, { minPerOrder: parseInt(e.target.value) || 1 })
                          }
                          min="1"
                          className={errors[`ticket-${ticketType.id}-min`] ? "border-destructive" : ""}
                        />
                        {errors[`ticket-${ticketType.id}-min`] && (
                          <p className="text-sm text-destructive">{errors[`ticket-${ticketType.id}-min`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Max per Order</Label>
                        <Input
                          type="number"
                          value={ticketType.maxPerOrder}
                          onChange={(e) =>
                            updateTicketType(ticketType.id, { maxPerOrder: parseInt(e.target.value) || 1 })
                          }
                          min="1"
                          className={errors[`ticket-${ticketType.id}-max`] ? "border-destructive" : ""}
                        />
                        {errors[`ticket-${ticketType.id}-max`] && (
                          <p className="text-sm text-destructive">{errors[`ticket-${ticketType.id}-max`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`visible-${ticketType.id}`}
                        checked={ticketType.isVisible}
                        onCheckedChange={(checked) =>
                          updateTicketType(ticketType.id, { isVisible: checked as boolean })
                        }
                      />
                      <Label htmlFor={`visible-${ticketType.id}`} className="text-sm font-normal">
                        Make this ticket type visible to attendees
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Event Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-medium w-32">Title:</span>
                      <span>{formData.title || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Category:</span>
                      <span>
                        {categories?.find((c) => c._id === formData.categoryId)?.name || "—"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Description:</span>
                      <span className="line-clamp-2">{formData.description || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Date & Time</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-medium w-32">Start:</span>
                      <span>
                        {formData.startDate
                          ? format(new Date(formData.startDate), "PPpp")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">End:</span>
                      <span>
                        {formData.endDate ? format(new Date(formData.endDate), "PPpp") : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-medium w-32">Venue:</span>
                      <span>{formData.locationName || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-32">Address:</span>
                      <span>{formData.address || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Ticket Types ({ticketTypes.length})</h3>
                  <div className="space-y-2">
                    {ticketTypes.map((tt, idx) => (
                      <div key={tt.id} className="text-sm p-3 bg-muted rounded-lg">
                        <div className="font-medium">{tt.name || `Ticket ${idx + 1}`}</div>
                        <div className="text-muted-foreground">
                          {tt.price === 0 ? "Free" : `${tt.price} ETB`} • {tt.quantity} tickets
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button type="button" onClick={nextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Event
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
