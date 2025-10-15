import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, type Booking, type InsertBooking } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Bookings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const totalCourts = settings?.totalCourts || 4;

  const form = useForm<InsertBooking>({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      courtNumber: 1,
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      memberName: "",
      memberPhone: "",
    },
  });

  const createBooking = useMutation({
    mutationFn: async (data: InsertBooking) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking created",
        description: "Court booking has been successfully created",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/bookings/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking cancelled",
        description: "The booking has been cancelled",
      });
    },
  });

  const onSubmit = (data: InsertBooking) => {
    createBooking.mutate(data);
  };

  const groupedByDate = bookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = [];
    }
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Court Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage tennis court reservations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-booking">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-new-booking">
            <DialogHeader>
              <DialogTitle>Create Court Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                    data-testid="input-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courtNumber">Court Number</Label>
                  <Select
                    value={form.watch("courtNumber")?.toString()}
                    onValueChange={(value) =>
                      form.setValue("courtNumber", parseInt(value))
                    }
                  >
                    <SelectTrigger data-testid="select-court">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: totalCourts }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Court {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...form.register("startTime")}
                    data-testid="input-start-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...form.register("endTime")}
                    data-testid="input-end-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberName">Member Name</Label>
                <Input
                  id="memberName"
                  {...form.register("memberName")}
                  data-testid="input-member-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberPhone">Phone Number</Label>
                <Input
                  id="memberPhone"
                  type="tel"
                  {...form.register("memberPhone")}
                  data-testid="input-member-phone"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createBooking.isPending}
                data-testid="button-submit-booking"
              >
                {createBooking.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">No Bookings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new booking to get started
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedByDate[date].map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50"
                      data-testid={`booking-item-${booking.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{booking.memberName}</p>
                          <Badge variant="outline" data-testid={`court-badge-${booking.id}`}>
                            Court {booking.courtNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.startTime} - {booking.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {booking.memberPhone}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelBooking.mutate(booking.id)}
                        data-testid={`button-cancel-${booking.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
