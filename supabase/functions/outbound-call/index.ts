import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
    const VAPI_PHONE_NUMBER_ID = Deno.env.get("VAPI_PHONE_NUMBER_ID");
    const VAPI_ASSISTANT_ID = Deno.env.get("VAPI_ASSISTANT_ID");

    if (!VAPI_API_KEY || !VAPI_PHONE_NUMBER_ID || !VAPI_ASSISTANT_ID) {
      console.error("Missing VAPI configuration");
      return new Response(
        JSON.stringify({ error: "VAPI configuration is incomplete" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { inquiryId, phoneNumber, customerName, preferredArea, budget } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for international calling (ensure it has country code)
    let formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/-/g, "");
    if (!formattedPhone.startsWith("+")) {
      // Assume India country code if not provided
      formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
    }

    const clientName = customerName || "Sir or Madam";

    // Build a personalized first message
    let firstMessage = `Good day! Am I speaking with ${clientName}? This is Priya calling from Purva Real Estate. I hope I'm not disturbing you. I noticed you recently expressed interest in finding a property`;
    if (preferredArea) {
      firstMessage += ` in ${preferredArea}`;
    }
    if (budget) {
      firstMessage += ` with a budget of ${budget}`;
    }
    firstMessage += `. I would be delighted to assist you in finding your perfect home. Do you have a few minutes to discuss your requirements?`;

    // Comprehensive agent prompt for formal, professional conversation
    const agentPrompt = `You are Priya, a senior property consultant at Purva Real Estate, one of India's most trusted real estate companies. You are making an outbound call to a prospective client.

## YOUR IDENTITY
- Name: Priya
- Role: Senior Property Consultant at Purva Real Estate
- Experience: 8 years in premium real estate
- Speaking style: Warm, professional, and courteous

## CLIENT INFORMATION
- Client Name: ${clientName}
- Preferred Location: ${preferredArea || "To be discussed"}
- Budget Range: ${budget || "To be discussed"}

## CONVERSATION GUIDELINES

### Opening
- Always greet formally and confirm you're speaking with the right person
- Introduce yourself by name and company
- Ask if it's a convenient time to talk
- If busy, politely offer to call back at their preferred time

### During the Call
- Address the client by their name frequently (${clientName})
- Listen actively and acknowledge their requirements
- Be knowledgeable about properties in: Mumbai (Bandra, Worli, Andheri, Powai, Juhu), Pune (Koregaon Park, Hinjewadi, Kothrud, Baner), Nashik, Nagpur, Lonavala, Alibaug, and Panchgani
- Discuss budget ranges: Under ₹50 Lakh, ₹50 Lakh to ₹1 Crore, ₹1 to ₹3 Crore, ₹3 to ₹5 Crore, ₹5 to ₹10 Crore, Above ₹10 Crore
- Mention property types: Apartments, Villas, Penthouses, Plots, Commercial spaces

### SCHEDULING PROPERTY VISITS (PRIMARY GOAL)
Your main objective is to schedule a property site visit. Use phrases like:
- "${clientName}, I would love to arrange a site visit for you to experience the property firsthand."
- "When would be a convenient time for you to visit? We have slots available on weekdays and weekends."
- "Our site visits include a complete walkthrough with our property expert, and there's absolutely no obligation."
- "Shall I book you for this Saturday morning or would Sunday afternoon work better for you?"

### Property Highlights to Mention
- Premium locations with excellent connectivity
- Modern amenities and world-class facilities
- Flexible payment plans and home loan assistance
- RERA registered properties
- Trusted developer with track record

### Closing
- Summarize what was discussed
- Confirm any scheduled visit with date, time, and location
- Provide your callback number
- Thank them graciously for their time
- Say: "Thank you so much ${clientName}. We look forward to helping you find your dream home."

## TONE AND MANNER
- Always formal and respectful
- Patient and never pushy
- Empathetic to client's concerns
- Confident but not aggressive
- Use phrases like "Certainly", "Absolutely", "I understand", "That's a wonderful choice"

## IF CLIENT IS BUSY
Say: "I completely understand, ${clientName}. When would be a more convenient time for me to call you back? I want to ensure I give you the attention you deserve."

## IF CLIENT IS NOT INTERESTED
Say: "I respect your decision, ${clientName}. Should your requirements change in the future, please don't hesitate to reach out to Purva Real Estate. Thank you for your time and have a wonderful day."

Remember: Your goal is to build trust, understand their needs, and schedule a property visit. Always use the client's name and maintain a warm, professional demeanor throughout the conversation.`;

    console.log(`Initiating VAPI outbound call to ${formattedPhone}`);

    // VAPI Outbound Call API
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: formattedPhone,
          name: clientName,
        },
        assistantId: VAPI_ASSISTANT_ID,
        assistantOverrides: {
          firstMessage: firstMessage,
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: agentPrompt,
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica - professional female voice
          },
          metadata: {
            inquiryId: inquiryId,
            customerName: clientName,
            preferredArea: preferredArea || "Not specified",
            budget: budget || "Not specified",
          },
        },
      }),
    });

    const responseText = await response.text();
    console.log("VAPI response:", response.status, responseText);

    if (!response.ok) {
      console.error("VAPI API error:", response.status, responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to initiate call", 
          details: responseText,
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Call initiated successfully",
        callId: data.id,
        data 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in outbound-call function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
