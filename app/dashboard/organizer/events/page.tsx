"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Edit,
  MoreVertical,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventsPage() {
  const events = useQuery(api.events.getOrganizerEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEvents = events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "published" && event.isPublished) ||
                         (statusFilter === "draft" && !event.isPublished) ||
                         (statusFilter === "upcoming" && event.startDate > Date.now()) ||
                         (statusFilter === "past" && event.startDate <= Date.now());

    return matchesSearch && matchesStatus;
  }) || [];

  if (!events) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your events
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/organizer/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || statusFilter !== "all" ? "No events found" : "No events yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first event to get started"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button asChild>
                <Link href="/dashboard/organizer/events/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.startDate);
  const isUpcoming = event.startDate > Date.now();
  const isPublished = event.isPublished;

  const totalTickets = event.stats?.totalCapacity || 0;
  const soldTickets = event.stats?.totalTicketsSold || 0;
  const revenue = event.stats?.totalRevenue || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 line-clamp-2">
              {event.title}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant={isPublished ? "default" : "secondary"} className="text-xs">
                {isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge variant={isUpcoming ? "default" : "secondary"} className="text-xs">
                {isUpcoming ? "Upcoming" : "Past"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/dashboard/organizer/events/${event._id}/manage`} className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </DropdownMenuItem>
              {isPublished && (
                <DropdownMenuItem>
                  <Link href={`/events/${event.slug}`} className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    View Event
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Location */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(startDate, "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.locationName}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{soldTickets}</div>
            <div className="text-xs text-muted-foreground">Sold</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              ETB {(revenue / 100).toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Filled</div>
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" variant="outline" asChild>
          <Link href={`/dashboard/organizer/events/${event._id}/manage`}>
            Manage Event
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}