import { useQuery } from "@tanstack/react-query";
import { Phone, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Call, Booking } from "@shared/schema";

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  testId,
}: {
  title: string;
  value: string;
  icon: any;
  trend?: string;
  testId: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums" data-testid={testId}>
          {value}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: calls = [], isLoading: callsLoading } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter((b) => b.date === today);
  const activeCalls = calls.filter((c) => c.status === "in-progress").length;
  const completedCalls = calls.filter((c) => c.status === "completed").length;

  const avgDuration = completedCalls > 0
    ? Math.round(
        calls
          .filter((c) => c.duration)
          .reduce((acc, c) => acc + (c.duration || 0), 0) / completedCalls
      )
    : 0;

  const recentCalls = calls.slice(0, 5);

  if (callsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your Tennis Club AI Receptionist
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Calls"
          value={activeCalls.toString()}
          icon={Phone}
          testId="stat-active-calls"
        />
        <StatCard
          title="Today's Bookings"
          value={todayBookings.length.toString()}
          icon={Calendar}
          testId="stat-todays-bookings"
        />
        <StatCard
          title="Total Calls"
          value={calls.length.toString()}
          icon={Phone}
          trend={`${completedCalls} completed`}
          testId="stat-total-calls"
        />
        <StatCard
          title="Avg. Duration"
          value={`${avgDuration}s`}
          icon={Clock}
          testId="stat-avg-duration"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No calls yet. Waiting for incoming calls...
              </p>
            ) : (
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between gap-4"
                    data-testid={`call-${call.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium truncate">
                        {call.fromNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(call.startTime).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        call.status === "completed"
                          ? "default"
                          : call.status === "in-progress"
                          ? "secondary"
                          : "outline"
                      }
                      data-testid={`status-${call.id}`}
                    >
                      {call.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Court Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No bookings for today
              </p>
            ) : (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between gap-4"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {booking.memberName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Court {booking.courtNumber} • {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <Badge variant="default" data-testid={`booking-status-${booking.id}`}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
