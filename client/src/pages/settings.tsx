import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClubSettingsSchema, type ClubSettings, type InsertClubSettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<ClubSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<InsertClubSettings>({
    resolver: zodResolver(insertClubSettingsSchema),
    values: settings || {
      name: "Tennis Club",
      phoneNumber: "",
      openTime: "06:00",
      closeTime: "22:00",
      totalCourts: 4,
      forwardingNumber: "",
      forwardingEnabled: false,
      aiInstructions: "",
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: InsertClubSettings) => {
      return await apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Your club settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClubSettings) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your club information and AI receptionist
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Club Information</CardTitle>
            <CardDescription>
              Basic details about your tennis club
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  data-testid="input-club-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...form.register("phoneNumber")}
                  placeholder="+1234567890"
                  data-testid="input-phone-number"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="openTime">Opening Time</Label>
                <Input
                  id="openTime"
                  type="time"
                  {...form.register("openTime")}
                  data-testid="input-open-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime">Closing Time</Label>
                <Input
                  id="closeTime"
                  type="time"
                  {...form.register("closeTime")}
                  data-testid="input-close-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCourts">Number of Courts</Label>
                <Input
                  id="totalCourts"
                  type="number"
                  min="1"
                  {...form.register("totalCourts", { valueAsNumber: true })}
                  data-testid="input-total-courts"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Forwarding</CardTitle>
            <CardDescription>
              Forward important calls to a staff member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="forwardingEnabled">Enable Call Forwarding</Label>
                <p className="text-sm text-muted-foreground">
                  AI can transfer complex requests to this number
                </p>
              </div>
              <Switch
                id="forwardingEnabled"
                checked={form.watch("forwardingEnabled")}
                onCheckedChange={(checked) =>
                  form.setValue("forwardingEnabled", checked)
                }
                data-testid="switch-forwarding"
              />
            </div>
            {form.watch("forwardingEnabled") && (
              <div className="space-y-2">
                <Label htmlFor="forwardingNumber">Forwarding Number</Label>
                <Input
                  id="forwardingNumber"
                  type="tel"
                  {...form.register("forwardingNumber")}
                  placeholder="+1234567890"
                  data-testid="input-forwarding-number"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Instructions</CardTitle>
            <CardDescription>
              Custom instructions for the AI receptionist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="aiInstructions">System Prompt</Label>
              <Textarea
                id="aiInstructions"
                {...form.register("aiInstructions")}
                rows={8}
                placeholder="You are a helpful AI receptionist for a tennis club. Be professional, friendly, and assist members with bookings and inquiries..."
                data-testid="textarea-ai-instructions"
              />
              <p className="text-xs text-muted-foreground">
                Provide specific instructions for how the AI should handle calls
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSettings.isPending}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
