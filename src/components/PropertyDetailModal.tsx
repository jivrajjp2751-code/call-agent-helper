import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Bed, Bath, Square, Calendar, Phone, Heart, Share2, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import VirtualTourViewer from "./VirtualTourViewer";

interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  featured: boolean;
  primary_image_url: string | null;
  virtual_tour_url?: string | null;
  description?: string | null;
}

interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetailModal = ({ property, isOpen, onClose }: PropertyDetailModalProps) => {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  useEffect(() => {
    if (property && isOpen) {
      fetchPropertyImages();
      setCurrentImageIndex(0);
    }
  }, [property, isOpen]);

  const fetchPropertyImages = async () => {
    if (!property) return;
    
    const { data, error } = await supabase
      .from("property_images")
      .select("*")
      .eq("property_id", property.id)
      .order("display_order");

    if (!error && data) {
      setImages(data);
    }
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const scrollToContact = () => {
    onClose();
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  if (!property) return null;

  const displayImages = images.length > 0 
    ? images 
    : property.primary_image_url 
      ? [{ id: '1', property_id: property.id, image_url: property.primary_image_url, is_primary: true, display_order: 0 }]
      : [];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-10 lg:inset-16 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-bold">{property.title}</h2>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1 text-primary" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsLiked(!isLiked)}
                    className="hover:bg-primary/10"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid lg:grid-cols-2 gap-6 p-6">
                  {/* Image Gallery */}
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/50">
                      {displayImages.length > 0 ? (
                        <>
                          <img
                            src={displayImages[currentImageIndex]?.image_url}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                          {displayImages.length > 1 && (
                            <>
                              <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {displayImages.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                      idx === currentImageIndex ? "bg-primary" : "bg-background/50"
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                          {property.featured && (
                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                              Featured
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground">No images available</span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {displayImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {displayImages.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                              idx === currentImageIndex ? "border-primary" : "border-transparent"
                            }`}
                          >
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Virtual Tour Button */}
                    {property.virtual_tour_url && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setShowVirtualTour(true)}
                      >
                        <Video className="w-5 h-5" />
                        Take Virtual Tour
                      </Button>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    {/* Price */}
                    <div>
                      <span className="text-3xl md:text-4xl font-bold gradient-text">{property.price}</span>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="glass-card p-4 text-center">
                        <Bed className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <span className="text-lg font-semibold">{property.beds}</span>
                        <p className="text-xs text-muted-foreground">Bedrooms</p>
                      </div>
                      <div className="glass-card p-4 text-center">
                        <Bath className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <span className="text-lg font-semibold">{property.baths}</span>
                        <p className="text-xs text-muted-foreground">Bathrooms</p>
                      </div>
                      <div className="glass-card p-4 text-center">
                        <Square className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <span className="text-lg font-semibold">{property.sqft}</span>
                        <p className="text-xs text-muted-foreground">Sq. Ft.</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-3">About This Property</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {property.description || `Experience luxury living at its finest in this stunning ${property.beds}-bedroom property 
                        located in the prestigious ${property.location} area. This beautifully designed home 
                        features ${property.baths} modern bathrooms and spans an impressive ${property.sqft} square feet 
                        of thoughtfully planned living space. Perfect for those seeking an upscale lifestyle 
                        with proximity to premium amenities, fine dining, and world-class entertainment.`}
                      </p>
                    </div>

                    {/* Highlights */}
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-3">Property Highlights</h3>
                      <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Premium Location
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Modern Architecture
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          24/7 Security
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Parking Available
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Smart Home Ready
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Garden/Balcony
                        </li>
                        {property.virtual_tour_url && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Virtual Tour Available
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1" onClick={scrollToContact}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Viewing
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={scrollToContact}>
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Agent
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Virtual Tour Viewer */}
      <VirtualTourViewer
        tourUrl={property?.virtual_tour_url || null}
        propertyTitle={property?.title || ""}
        isOpen={showVirtualTour}
        onClose={() => setShowVirtualTour(false)}
      />
    </>
  );
};

export default PropertyDetailModal;
