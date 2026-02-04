"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  Plus,
  Users,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Eye,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";

function StatsCards({ stats }: { stats: any }) {
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(cents / 100);

  const cards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      description: `${stats.publishedEvents} published`,
      color: "text-blue-600",
    },
    {
      title: "Tickets Sold",
      value: stats.totalTicketsSold.toLocaleString(),
      icon: Users,
      description: `${stats.totalCheckedIn} checked in`,
      color: "text-green-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: "Total earnings",
      color: "text-emerald-600",
    },
    {
      title: "Check-in Rate",
      value: stats.totalTicketsSold > 0
        ? `${Math.round((stats.totalCheckedIn / stats.totalTicketsSold) * 100)}%`
        : "0%",
      icon: CheckCircle,
      description: `${stats.totalCheckedIn}/${stats.totalTicketsSold} tickets`,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(cents / 100);

  // Use useState and useEffect to avoid hydration mismatch
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [isPublished] = useState(event.isPublished);

  useEffect(() => {
    setIsUpcoming(event.startDate > Date.now());
  }, [event.startDate]);

  return (
    <Card className="hover:shadow-md transition-shadow" suppressHydrationWarning>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold truncate">{event.title}</h3>
              <div className="flex gap-1">
                {isPublished ? (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Draft
                  </Badge>
                )}
                {isUpcoming ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    Upcoming
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Past
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(event.startDate), "MMM d, yyyy 'at' h:mm a")}
              </div>
              <div>{event.locationName}</div>
            </div>
          </div>

          <div className="text-right ml-4">
            <div className="text-lg font-semibold">
              {formatCurrency(event.stats.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {event.stats.totalTicketsSold}/{event.stats.totalCapacity} sold
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{event.stats.totalTicketsSold} tickets sold</span>
            <span>{event.stats.totalCheckedIn} checked in</span>
          </div>

          <div className="flex gap-2">
            <Link href={`/dashboard/organizer/events/${event._id}/manage`}>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
            {isPublished && (
              <Link href={`/events/${event.slug}`}>
                <Button variant="outline" size="sm">
                  View Event
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OrganizerDashboard() {
  const stats = useQuery(api.events.getOrganizerStats);
  const events = useQuery(api.events.getOrganizerEvents);

  const recentEvents = events?.slice(0, 5) || [];

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your events and track performance
          </p>
        </div>

        <Link href="/dashboard/organizer/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats ? (
        <StatsCards stats={stats} />
      ) : (
        <StatsSkeleton />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Events</h2>
            <Link href="/dashboard/organizer/events">
              <Button variant="ghost" size="sm">
                View All
                <TrendingUp className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {events ? (
            <div className="space-y-4">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No events yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first event to get started
                    </p>
                    <Link href="/dashboard/organizer/events/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <EventsSkeleton />
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>

          <div className="space-y-3">
            <Link href="/dashboard/organizer/events/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
            </Link>

            <Link href="/dashboard/organizer/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>

            <Link href="/dashboard/organizer/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </Link>
          </div>

          {/* Tips */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Publish events early to maximize attendance</p>
              <p>• Set clear ticket prices and availability</p>
              <p>• Engage with attendees through updates</p>
              <p>• Monitor check-ins and resolve issues promptly</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
