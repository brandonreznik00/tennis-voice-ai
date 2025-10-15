import { useEffect, useState } from "react";
import { Phone, PhoneOff, Forward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LiveCallState } from "@shared/schema";

export default function LiveCalls() {
  const [activeCalls, setActiveCalls] = useState<LiveCallState[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Update durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCalls((prev) =>
        prev.map((call) => ({
          ...call,
          duration: Math.floor((Date.now() - new Date(call.startTime).getTime()) / 1000),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === "call_update") {
        setActiveCalls((prev) => {
          const existing = prev.find((c) => c.callSid === message.call.callSid);
          if (existing) {
            return prev.map((c) =>
              c.callSid === message.call.callSid ? message.call : c
            );
          }
          return [...prev, message.call];
        });
      } else if (message.type === "call_ended") {
        setActiveCalls((prev) =>
          prev.filter((c) => c.callSid !== message.callSid)
        );
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = (callSid: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "end_call", callSid }));
    }
  };

  const handleForwardCall = (callSid: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "forward_call", callSid }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Live Calls</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage active calls in real-time
        </p>
      </div>

      {activeCalls.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Phone className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">No Active Calls</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Waiting for incoming calls to your tennis club
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeCalls.map((call) => (
            <Card key={call.callSid} data-testid={`live-call-${call.callSid}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">
                    {call.status === "ringing" ? "Incoming Call" : "In Progress"}
                  </CardTitle>
                  <Badge
                    variant={call.status === "in-progress" ? "default" : "secondary"}
                    className={call.status === "ringing" ? "animate-pulse" : ""}
                    data-testid={`call-status-${call.callSid}`}
                  >
                    {call.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-mono text-sm font-medium" data-testid={`call-from-${call.callSid}`}>
                      {call.fromNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-2xl font-semibold tabular-nums" data-testid={`call-duration-${call.callSid}`}>
                      {formatDuration(call.duration)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEndCall(call.callSid)}
                    data-testid={`button-end-call-${call.callSid}`}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleForwardCall(call.callSid)}
                    data-testid={`button-forward-${call.callSid}`}
                  >
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
