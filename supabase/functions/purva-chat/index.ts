import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, action, viewingData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle scheduling action
    if (action === "schedule_viewing" && viewingData) {
      const { data, error } = await supabase
        .from("customer_inquiries")
        .insert({
          name: viewingData.name,
          email: viewingData.email,
          phone: viewingData.phone,
          message: `Property Viewing Request: ${viewingData.propertyTitle}`,
          appointment_date: viewingData.date,
          preferred_time: viewingData.time,
          preferred_area: viewingData.location,
        });

      if (error) {
        console.error("Error scheduling viewing:", error);
        return new Response(
          JSON.stringify({ error: "Failed to schedule viewing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: `Great! Your viewing for ${viewingData.propertyTitle} has been scheduled for ${viewingData.date} at ${viewingData.time}. Our team will contact you at ${viewingData.phone} to confirm.`,
          scheduled: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    // Fetch properties from database for context
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (propError) {
      console.error("Error fetching properties:", propError);
    }

    const propertyContext = properties && properties.length > 0
      ? `\n\nAVAILABLE PROPERTIES IN OUR DATABASE:\n${properties.map((p, i) => 
          `${i + 1}. "${p.title}" - Location: ${p.location}, Price: ${p.price}, Beds: ${p.beds}, Baths: ${p.baths}, Sqft: ${p.sqft}, Featured: ${p.featured ? 'Yes' : 'No'}`
        ).join('\n')}`
      : '\n\nNo properties currently available in the database.';

    const SYSTEM_PROMPT = `You are Purva, a friendly and knowledgeable real estate assistant for a luxury property company. Your role is to help potential buyers and renters with:

1. Property inquiries - answering questions about available properties, their features, locations, and pricing
2. Scheduling viewings - helping users schedule property visits. When a user wants to schedule a viewing, guide them through providing their name, email, phone, preferred date and time.
3. General real estate advice - providing guidance on buying, renting, and investment opportunities
4. Area information - sharing details about neighborhoods, amenities, and local attractions

${propertyContext}

SCHEDULING VIEWINGS:
When a user wants to schedule a viewing, ask them for:
- Their name
- Email address
- Phone number
- Preferred date
- Preferred time
- Which property they want to view

Once you have all details, confirm them and let the user know you'll process their request.

FORMAT YOUR RESPONSES:
- When listing properties, format them nicely with key details
- Use emojis sparingly for friendliness 🏠
- Keep responses concise but informative
- If asked about a specific property, provide detailed information from the database
- Always be enthusiastic about helping find the perfect property!

Be warm, professional, and helpful. If asked about specific properties you have data on, provide accurate details from the database.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const error = await response.text();
      console.error("AI Gateway error:", error);
      throw new Error("Failed to get response from AI");
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    return new Response(
      JSON.stringify({ message: assistantMessage, properties }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
