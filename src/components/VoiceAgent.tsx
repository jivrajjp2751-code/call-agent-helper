import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Loader2, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VoiceAgent = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast({
        title: "Connected",
        description: "AI agent is now listening. Start speaking!",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
      toast({
        title: "Call Ended",
        description: "The conversation has ended.",
      });
    },
    onMessage: (message) => {
      console.log("Message:", message);
    },
    onError: (error) => {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the AI agent. Please try again.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error) {
        throw new Error(error.message || "Failed to get conversation token");
      }

      if (!data?.token) {
        throw new Error("No token received from server");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        variant: "destructive",
        title: "Failed to Start Call",
        description: error instanceof Error ? error.message : "Please check your microphone permissions.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="start"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Button
              onClick={startConversation}
              disabled={isConnecting}
              size="lg"
              className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            >
              {isConnecting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Speaking indicator */}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg"
              animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <motion.div
                className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-primary'}`}
                animate={isSpeaking ? { opacity: [1, 0.5, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
              <span className="text-sm font-medium text-foreground">
                {isSpeaking ? "AI Speaking..." : "Listening..."}
              </span>
              {!isSpeaking && <Mic className="w-4 h-4 text-primary animate-pulse" />}
            </motion.div>

            {/* End call button */}
            <Button
              onClick={stopConversation}
              size="lg"
              variant="destructive"
              className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceAgent;
