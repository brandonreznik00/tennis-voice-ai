import { useQuery } from "@tanstack/react-query";
import { History, Phone, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Call } from "@shared/schema";
import { useState } from "react";

export default function CallHistory() {
  const [search, setSearch] = useState("");
  
  const { data: calls = [], isLoading } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });

  const filteredCalls = calls
    .filter((call) => 
      call.fromNumber.includes(search) || 
      (call.notes && call.notes.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    
    const variants: Record<string, string> = {
      booking_made: "default",
      information_given: "secondary",
      forwarded: "outline",
      voicemail: "outline",
    };

    return (
      <Badge variant={variants[outcome] as any || "outline"}>
        {outcome.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading call history...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Call History</h1>
        <p className="text-muted-foreground mt-1">
          View and search all past calls
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-calls"
          />
        </div>
      </div>

      {filteredCalls.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {search ? "No calls found" : "No Call History"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? "Try adjusting your search"
                    : "Call history will appear here once you receive calls"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id} data-testid={`call-row-${call.id}`}>
                    <TableCell className="font-mono font-medium" data-testid={`call-from-${call.id}`}>
                      {call.fromNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(call.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell className="tabular-nums" data-testid={`call-duration-${call.id}`}>
                      {formatDuration(call.duration)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(call.status)} data-testid={`call-status-${call.id}`}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`call-outcome-${call.id}`}>
                      {getOutcomeBadge(call.outcome)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {call.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
