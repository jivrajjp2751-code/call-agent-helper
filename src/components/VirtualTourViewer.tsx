import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Maximize2, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualTourViewerProps {
  tourUrl: string | null;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const VirtualTourViewer = ({ tourUrl, propertyTitle, isOpen, onClose }: VirtualTourViewerProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotation, setRotation] = useState(0);

  if (!tourUrl) return null;

  const isVideo = tourUrl.includes("youtube") || tourUrl.includes("vimeo") || tourUrl.endsWith(".mp4");
  const isYoutube = tourUrl.includes("youtube") || tourUrl.includes("youtu.be");
  const isVimeo = tourUrl.includes("vimeo");

  const getEmbedUrl = () => {
    if (isYoutube) {
      const videoId = tourUrl.includes("youtu.be") 
        ? tourUrl.split("/").pop() 
        : new URLSearchParams(new URL(tourUrl).search).get("v");
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1`;
    }
    if (isVimeo) {
      const videoId = tourUrl.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1`;
    }
    return tourUrl;
  };

  const handleRotate = () => {
    setRotation((prev) => prev + 90);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Virtual Tour</h2>
                  <p className="text-sm text-muted-foreground">{propertyTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isVideo && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:bg-primary/10"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                      className="hover:bg-primary/10"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(tourUrl, '_blank')}
                  className="hover:bg-primary/10"
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-black overflow-hidden">
              {isVideo ? (
                <iframe
                  src={getEmbedUrl()}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <motion.img
                    src={tourUrl}
                    alt={`Virtual tour of ${propertyTitle}`}
                    className="max-w-full max-h-full object-contain"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}

              {/* 360 Overlay hint */}
              {!isVideo && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/70 backdrop-blur-sm text-sm text-foreground">
                  🔄 Drag to look around • Use controls to rotate
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground text-center">
                Experience this property from the comfort of your home. Schedule an in-person viewing for the full experience.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VirtualTourViewer;
