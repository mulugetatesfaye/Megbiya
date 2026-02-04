"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Eye,
  Settings,
  Users,
  Ticket,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Edit,
  Share2,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function EventManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const event = useQuery(api.events.getEventForManagement, { eventId: eventId as any });
  const eventStats = useQuery(api.events.getOrganizerStats);
  const attendees = useQuery(api.events.getEventAttendees, { eventId: eventId as any });

  // Loading state
  if (event === undefined) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  // Not found or not authorized
  if (event === null) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button onClick={() => router.push("/dashboard/organizer")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isPublished = event.isPublished;
  const startDate = new Date(event.startDate);
  const isUpcoming = event.startDate > Date.now();

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge variant={isUpcoming ? "default" : "secondary"}>
                {isUpcoming ? "Upcoming" : "Past"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Event
          </Button>
          {isPublished && (
            <Button asChild>
              <Link href={`/events/${event.slug}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Event
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">
                  {event.ticketTypes.reduce((sum, tt) => sum + tt.totalQuantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sold</p>
                <p className="text-2xl font-bold">
                  {event.ticketTypes.reduce((sum, tt) => sum + tt.soldQuantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  ETB {event.ticketTypes.reduce((sum, tt) => sum + (tt.price * tt.soldQuantity), 0) / 100}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{event.availableTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {format(startDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {format(startDate, "h:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{event.locationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right max-w-48 truncate">
                      {event.address}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isPublished && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your event is pending admin approval. Once approved, it will be published automatically.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Event created</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Event scheduled for publication</p>
                    <p className="text-sm text-muted-foreground">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium">Awaiting ticket type setup</p>
                    <p className="text-sm text-muted-foreground">30 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ticket Types ({event.ticketTypes.length})
                </CardTitle>
                <Button size="sm" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/tickets/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ticket Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {event.ticketTypes.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No ticket types yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create ticket types to start selling tickets for your event.
                  </p>
                  <Button onClick={() => router.push(`/dashboard/organizer/events/${eventId}/tickets/new`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ticket Type
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.ticketTypes.map((ticketType) => (
                    <Card key={ticketType._id} className="border-2">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{ticketType.name}</h3>
                              {!ticketType.isVisible && (
                                <Badge variant="secondary">Hidden</Badge>
                              )}
                            </div>
                            {ticketType.description && (
                              <p className="text-sm text-muted-foreground">{ticketType.description}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Price</p>
                                <p className="text-lg font-semibold">
                                  {ticketType.price === 0 
                                    ? "Free" 
                                    : `${(ticketType.price / 100).toLocaleString()} ${ticketType.currency}`}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Quantity</p>
                                <p className="text-lg font-semibold">{ticketType.totalQuantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Sold</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {ticketType.soldQuantity}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Available</p>
                                <p className="text-lg font-semibold">
                                  {ticketType.totalQuantity - ticketType.soldQuantity}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                              <span>Min: {ticketType.minPerOrder}</span>
                              <span>•</span>
                              <span>Max: {ticketType.maxPerOrder}</span>
                              <span>•</span>
                              <span>
                                Sales: {format(new Date(ticketType.saleStart), "MMM d")} - {format(new Date(ticketType.saleEnd), "MMM d")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendees ({attendees?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendees === undefined ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading attendees...</p>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No attendees yet</h3>
                  <p className="text-muted-foreground">
                    Attendees will appear here once tickets are sold.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendees.map((attendee) => (
                    <Card key={attendee.user._id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">
                                {attendee.user.firstName} {attendee.user.lastName}
                              </h3>
                              <Badge variant="outline">
                                {attendee.ticketCount} {attendee.ticketCount === 1 ? "ticket" : "tickets"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {attendee.user.email}
                            </p>
                            <div className="space-y-1">
                              {attendee.tickets.map((ticket: any) => (
                                <div key={ticket._id} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {ticket.ticketType?.name || "Unknown"} - {ticket.ticketNumber}
                                  </span>
                                  <Badge 
                                    variant={
                                      ticket.status === "checked_in" 
                                        ? "default" 
                                        : ticket.status === "valid" 
                                        ? "secondary" 
                                        : "destructive"
                                    }
                                  >
                                    {ticket.status === "checked_in" 
                                      ? "Checked In" 
                                      : ticket.status === "valid" 
                                      ? "Valid" 
                                      : "Voided"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-muted-foreground">Total Paid</p>
                            <p className="text-lg font-semibold">
                              ETB {(attendee.totalPaid / 100).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Event Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Event settings will be available once ticket types are configured.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" disabled>
                  Configure Capacity
                </Button>
                <Button variant="outline" disabled>
                  Set Age Restrictions
                </Button>
                <Button variant="outline" disabled>
                  Add Custom Fields
                </Button>
                <Button variant="outline" disabled>
                  Setup Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}