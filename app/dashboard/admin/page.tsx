"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  DollarSign,
  Eye,
  BarChart3,
  FileText,
  MessageSquare,
  User as UserIcon,
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  Award,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const adminStats = useQuery(api.events.getAdminStats);
  const allEvents = useQuery(api.events.getAllEventsForAdmin);
  const reviewEvent = useMutation(api.events.reviewEvent);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(cents / 100);

  const metrics = useMemo(() => {
    if (!adminStats) return null;

    const approvalRate =
      adminStats.totalEvents > 0
        ? Math.round((adminStats.approvedEvents / adminStats.totalEvents) * 100)
        : 0;

    const pendingRate =
      adminStats.totalEvents > 0
        ? Math.round((adminStats.pendingEvents / adminStats.totalEvents) * 100)
        : 0;

    return {
      ...adminStats,
      approvalRate,
      pendingRate,
    };
  }, [adminStats]);

  const filteredEvents = useMemo(() => {
    if (!allEvents) return [];

    return allEvents.filter((event) => {
      const matchesSearch =
        searchTerm === "" ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || event.approvalStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allEvents, searchTerm, statusFilter]);

  const handleReviewEvent = async (
    eventId: any,
    action: "approve" | "reject"
  ) => {
    setIsReviewing(true);
    try {
      await reviewEvent({
        eventId,
        action,
        notes: reviewNotes.trim() || undefined,
      });
      setSelectedEvent(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Failed to review event:", error);
    } finally {
      setIsReviewing(false);
    }
  };

  if (!adminStats || !metrics) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Last updated {format(lastUpdated, "MMM d, h:mm a")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastUpdated(new Date())}
              className="w-fit"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 mb-8">
          <StatCard
            label="Total Events"
            value={metrics.totalEvents}
            icon={Calendar}
            trend="+12%"
            trendUp
          />
          <StatCard
            label="Pending Review"
            value={metrics.pendingEvents}
            icon={Clock}
            highlight={metrics.pendingEvents > 0}
          />
          <StatCard
            label="Approval Rate"
            value={`${metrics.approvalRate}%`}
            icon={CheckCircle}
            trend="+5%"
            trendUp
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={DollarSign}
            trend="+18%"
            trendUp
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Platform Health */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <ProgressMetric
                  label="Approval Rate"
                  value={metrics.approvalRate}
                  color="emerald"
                />
                <ProgressMetric
                  label="Pending"
                  value={metrics.pendingRate}
                  color="amber"
                  warning={metrics.pendingRate > 20}
                />
                <ProgressMetric
                  label="Published"
                  value={Math.round(
                    (metrics.publishedEvents / metrics.totalEvents) * 100
                  )}
                  color="blue"
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  System Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Operational
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UserStat
                label="Total Users"
                value={metrics.totalUsers}
                icon={Users}
              />
              <UserStat
                label="Organizers"
                value={metrics.organizers}
                icon={Award}
              />
              <UserStat
                label="Attendees"
                value={metrics.attendees}
                icon={UserIcon}
              />
              <UserStat label="Admins" value={metrics.admins} icon={Shield} />
            </CardContent>
          </Card>
        </div>

        {/* Events Management */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-medium">
                Event Management
              </CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <Tabs defaultValue="pending" className="w-full">
              <div className="border-b px-4 sm:px-0 sm:border-0">
                <TabsList className="w-full justify-start gap-4 h-12 bg-transparent p-0">
                  <TabsTrigger
                    value="pending"
                    className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:border-white dark:data-[state=active]:text-white"
                  >
                    Pending
                    {adminStats.pendingEvents > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-5 px-1.5 text-xs"
                      >
                        {adminStats.pendingEvents}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:border-white dark:data-[state=active]:text-white"
                  >
                    Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:border-white dark:data-[state=active]:text-white"
                  >
                    Rejected
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:border-white dark:data-[state=active]:text-white"
                  >
                    All
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-0 sm:pt-6">
                <TabsContent value="pending" className="m-0">
                  <EventList
                    events={filteredEvents.filter(
                      (e) => e.approvalStatus === "pending"
                    )}
                    onReview={setSelectedEvent}
                    showActions
                    emptyMessage="No pending events"
                  />
                </TabsContent>
                <TabsContent value="approved" className="m-0">
                  <EventList
                    events={filteredEvents.filter(
                      (e) => e.approvalStatus === "approved"
                    )}
                    emptyMessage="No approved events"
                  />
                </TabsContent>
                <TabsContent value="rejected" className="m-0">
                  <EventList
                    events={filteredEvents.filter(
                      (e) => e.approvalStatus === "rejected"
                    )}
                    emptyMessage="No rejected events"
                  />
                </TabsContent>
                <TabsContent value="all" className="m-0">
                  <EventList
                    events={filteredEvents}
                    onReview={setSelectedEvent}
                    showActions
                    showStatus
                    emptyMessage="No events found"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Event</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedEvent.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Organizer
                      </span>
                      <p className="font-medium">{selectedEvent.organizer?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date</span>
                      <p className="font-medium">
                        {format(new Date(selectedEvent.startDate), "PPP")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Category
                      </span>
                      <p className="font-medium">{selectedEvent.category?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Location
                      </span>
                      <p className="font-medium">{selectedEvent.locationName}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Description
                    </span>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {selectedEvent.description}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Review Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleReviewEvent(selectedEvent._id, "reject")}
                    disabled={isReviewing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleReviewEvent(selectedEvent._id, "approve")}
                    disabled={isReviewing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Components

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "ring-2 ring-amber-500 ring-offset-2" : ""}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Icon className="h-5 w-5 text-gray-400" />
          {trend && (
            <span
              className={`text-xs font-medium ${
                trendUp ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressMetric({
  label,
  value,
  color,
  warning,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber" | "blue";
  warning?: boolean;
}) {
  const colors = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span
          className={`font-medium ${
            warning ? "text-amber-600" : "text-gray-900 dark:text-white"
          }`}
        >
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-2 rounded-full ${colors[color]} transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function UserStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function EventList({
  events,
  onReview,
  showActions,
  showStatus,
  emptyMessage,
}: {
  events: any[];
  onReview?: (event: any) => void;
  showActions?: boolean;
  showStatus?: boolean;
  emptyMessage: string;
}) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {events.map((event) => (
        <div
          key={event._id}
          className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
              <AvatarImage src={event.imageUrl} />
              <AvatarFallback className="rounded-lg bg-gray-100 dark:bg-gray-800">
                <Calendar className="h-5 w-5 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {event.title}
                </h4>
                {showStatus && (
                  <StatusBadge status={event.approvalStatus} />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5" />
                  {event.organizer?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(event.startDate), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1 hidden sm:flex">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.locationName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            {showActions && event.approvalStatus === "pending" && (
              <Button
                size="sm"
                onClick={() => onReview?.(event)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Review
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`/events/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { label, className } = config[status as keyof typeof config] || config.pending;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}