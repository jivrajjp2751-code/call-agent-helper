import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotifyRequest {
  action: "role_change" | "access_granted" | "access_removed" | "bulk_access_removed" | "bulk_role_change";
  performedBy: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  adminEmails: string[];
}

const getActionSubject = (action: string): string => {
  switch (action) {
    case "role_change":
      return "User Role Changed";
    case "access_granted":
      return "New User Access Granted";
    case "access_removed":
      return "User Access Removed";
    case "bulk_access_removed":
      return "Multiple Users Access Removed";
    case "bulk_role_change":
      return "Multiple Users Roles Changed";
    default:
      return "Admin Action Notification";
  }
};

const getActionDescription = (action: string, targetEmail?: string, details?: Record<string, unknown>): string => {
  switch (action) {
    case "role_change":
      return `The role for <strong>${targetEmail || "a user"}</strong> has been changed from <strong>${details?.old_role || "unknown"}</strong> to <strong>${details?.new_role || "unknown"}</strong>.`;
    case "access_granted":
      return `Access has been granted to <strong>${targetEmail || "a user"}</strong> with the role of <strong>${details?.role || "unknown"}</strong>.`;
    case "access_removed":
      return `Access has been removed for <strong>${targetEmail || "a user"}</strong>. Their previous role was <strong>${details?.previous_role || "unknown"}</strong>.`;
    case "bulk_access_removed":
      const removedEmails = (details?.emails as string[]) || [];
      return `Access has been removed for <strong>${details?.count || 0}</strong> user(s): ${removedEmails.join(", ") || "unknown users"}.`;
    case "bulk_role_change":
      const changedEmails = (details?.emails as string[]) || [];
      return `The role has been changed to <strong>${details?.new_role || "unknown"}</strong> for <strong>${details?.count || 0}</strong> user(s): ${changedEmails.join(", ") || "unknown users"}.`;
    default:
      return "An admin action has occurred.";
  }
};

const getPlainDescription = (action: string, targetEmail?: string, details?: Record<string, unknown>): string => {
  switch (action) {
    case "role_change":
      return `Role changed from ${details?.old_role || "unknown"} to ${details?.new_role || "unknown"}`;
    case "access_granted":
      return `Access granted with role: ${details?.role || "unknown"}`;
    case "access_removed":
      return `Access removed (was: ${details?.previous_role || "unknown"})`;
    case "bulk_access_removed":
      return `${details?.count || 0} user(s) access removed`;
    case "bulk_role_change":
      return `${details?.count || 0} user(s) role changed to ${details?.new_role || "unknown"}`;
    default:
      return "Admin action performed";
  }
};

const getPreferenceKey = (action: string): string => {
  switch (action) {
    case "role_change":
      return "email_role_changes";
    case "access_granted":
      return "email_access_grants";
    case "access_removed":
      return "email_access_removals";
    case "bulk_access_removed":
    case "bulk_role_change":
      return "email_bulk_actions";
    default:
      return "";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, performedBy, targetEmail, details, adminEmails }: AdminNotifyRequest = await req.json();

    if (!adminEmails || adminEmails.length === 0) {
      console.log("No admin emails to notify");
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const subject = `[Purva Admin] ${getActionSubject(action)}`;
    const description = getActionDescription(action, targetEmail, details);
    const plainDescription = getPlainDescription(action, targetEmail, details);
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .action-badge { display: inline-block; background: #d4af37; color: #1a1a2e; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
            .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d4af37; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🔔 Admin Notification</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Purva Real Estate Dashboard</p>
            </div>
            <div class="content">
              <span class="action-badge">${getActionSubject(action)}</span>
              <div class="details">
                <p style="margin: 0;">${description}</p>
              </div>
              <p><strong>Performed by:</strong> ${performedBy}</p>
              <p><strong>Time:</strong> ${timestamp}</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Purva Admin Dashboard.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Fetch admin user_ids by email for preferences and in-app notifications
    const { data: adminProfiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("user_id, email")
      .eq("role", "admin")
      .in("email", adminEmails);

    if (profilesError) {
      console.error("Failed to fetch admin profiles:", profilesError);
    }

    const adminUserMap = new Map(
      (adminProfiles || []).map((p) => [p.email, p.user_id])
    );

    // Fetch preferences for all admins
    const adminUserIds = Array.from(adminUserMap.values());
    const { data: preferencesData, error: prefsError } = await serviceClient
      .from("admin_notification_preferences")
      .select("*")
      .in("user_id", adminUserIds);

    if (prefsError) {
      console.error("Failed to fetch preferences:", prefsError);
    }

    const preferencesMap = new Map(
      (preferencesData || []).map((p) => [p.user_id, p])
    );

    const preferenceKey = getPreferenceKey(action);

    // Create in-app notifications for all admins
    const inAppNotifications = adminUserIds.map((userId) => ({
      user_id: userId,
      action,
      title: getActionSubject(action),
      message: `${plainDescription} by ${performedBy}`,
      target_email: targetEmail || null,
    }));

    if (inAppNotifications.length > 0) {
      const { error: insertError } = await serviceClient
        .from("admin_notifications")
        .insert(inAppNotifications);

      if (insertError) {
        console.error("Failed to insert in-app notifications:", insertError);
      }
    }

    // Filter emails based on preferences
    const emailsToSend = adminEmails.filter((email) => {
      const userId = adminUserMap.get(email);
      if (!userId) return true; // Default to sending if no mapping
      
      const prefs = preferencesMap.get(userId);
      if (!prefs) return true; // Default to sending if no preferences set
      
      return prefs[preferenceKey as keyof typeof prefs] !== false;
    });

    if (emailsToSend.length === 0) {
      console.log("No admins opted in for this notification type");
      return new Response(
        JSON.stringify({ message: "All admins opted out", inAppSent: inAppNotifications.length }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send emails only to admins who have opted in
    const emailPromises = emailsToSend.map((email) =>
      resend.emails.send({
        from: "Purva Admin <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Notifications sent: ${successful} emails successful, ${failed} failed, ${inAppNotifications.length} in-app`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent", 
        emailsSent: successful, 
        emailsFailed: failed,
        inAppSent: inAppNotifications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in admin-notify function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
