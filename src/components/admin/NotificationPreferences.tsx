import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Preferences {
  email_role_changes: boolean;
  email_access_grants: boolean;
  email_access_removals: boolean;
  email_bulk_actions: boolean;
}

const defaultPreferences: Preferences = {
  email_role_changes: true,
  email_access_grants: true,
  email_access_removals: true,
  email_bulk_actions: true,
};

const NotificationPreferences = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("admin_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const prefs = {
          email_role_changes: data.email_role_changes,
          email_access_grants: data.email_access_grants,
          email_access_removals: data.email_access_removals,
          email_bulk_actions: data.email_bulk_actions,
        };
        setPreferences(prefs);
        setOriginalPrefs(prefs);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof Preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalPrefs));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("admin_notification_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        }, { onConflict: "user_id" });

      if (error) throw error;

      setOriginalPrefs(preferences);
      setHasChanges(false);

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Email Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which admin actions you want to receive email notifications for.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="role_changes">Role Changes</Label>
              <p className="text-sm text-muted-foreground">
                When another admin changes a user's role
              </p>
            </div>
            <Switch
              id="role_changes"
              checked={preferences.email_role_changes}
              onCheckedChange={() => handleToggle("email_role_changes")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="access_grants">Access Grants</Label>
              <p className="text-sm text-muted-foreground">
                When another admin grants access to a new user
              </p>
            </div>
            <Switch
              id="access_grants"
              checked={preferences.email_access_grants}
              onCheckedChange={() => handleToggle("email_access_grants")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="access_removals">Access Removals</Label>
              <p className="text-sm text-muted-foreground">
                When another admin removes a user's access
              </p>
            </div>
            <Switch
              id="access_removals"
              checked={preferences.email_access_removals}
              onCheckedChange={() => handleToggle("email_access_removals")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bulk_actions">Bulk Actions</Label>
              <p className="text-sm text-muted-foreground">
                When another admin performs bulk role changes or removals
              </p>
            </div>
            <Switch
              id="bulk_actions"
              checked={preferences.email_bulk_actions}
              onCheckedChange={() => handleToggle("email_bulk_actions")}
            />
          </div>
        </div>

        <Button onClick={savePreferences} disabled={isSaving || !hasChanges}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
