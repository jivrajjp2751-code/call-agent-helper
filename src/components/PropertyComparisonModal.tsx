import { motion, AnimatePresence } from "framer-motion";
import { X, Bed, Bath, Square, MapPin, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  description?: string | null;
}

interface PropertyComparisonModalProps {
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveProperty: (id: string) => void;
}

const PropertyComparisonModal = ({ 
  properties, 
  isOpen, 
  onClose,
  onRemoveProperty 
}: PropertyComparisonModalProps) => {
  if (properties.length === 0) return null;

  const parsePrice = (price: string): number => {
    const match = price.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const parseSqft = (sqft: string): number => {
    const match = sqft.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(',', '')) : 0;
  };

  const getMaxPrice = Math.max(...properties.map(p => parsePrice(p.price)));
  const getMaxBeds = Math.max(...properties.map(p => p.beds));
  const getMaxBaths = Math.max(...properties.map(p => p.baths));
  const getMaxSqft = Math.max(...properties.map(p => parseSqft(p.sqft)));

  const scrollToContact = () => {
    onClose();
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold">Compare Properties</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparing {properties.length} properties side by side
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="min-w-max">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-card p-4 text-left font-semibold min-w-[150px]">
                        Feature
                      </th>
                      {properties.map((property) => (
                        <th key={property.id} className="p-4 min-w-[280px]">
                          <div className="relative">
                            <button
                              onClick={() => onRemoveProperty(property.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="aspect-video rounded-lg overflow-hidden bg-secondary/50 mb-3">
                              {property.primary_image_url ? (
                                <img
                                  src={property.primary_image_url}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                  No image
                                </div>
                              )}
                            </div>
                            <h3 className="font-display font-semibold text-lg">{property.title}</h3>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Price */}
                    <tr className="border-t border-border">
                      <td className="sticky left-0 bg-card p-4 font-medium">Price</td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${
                              parsePrice(property.price) === getMaxPrice ? "text-primary" : ""
                            }`}>
                              {property.price}
                            </span>
                            {parsePrice(property.price) === Math.min(...properties.map(p => parsePrice(p.price))) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                                Best Value
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Location */}
                    <tr className="border-t border-border bg-secondary/20">
                      <td className="sticky left-0 bg-secondary/20 p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          Location
                        </div>
                      </td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4 text-muted-foreground">
                          {property.location}
                        </td>
                      ))}
                    </tr>

                    {/* Bedrooms */}
                    <tr className="border-t border-border">
                      <td className="sticky left-0 bg-card p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-primary" />
                          Bedrooms
                        </div>
                      </td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4">
                          <span className={`font-semibold ${
                            property.beds === getMaxBeds ? "text-primary" : ""
                          }`}>
                            {property.beds}
                          </span>
                          {property.beds === getMaxBeds && properties.length > 1 && (
                            <span className="ml-2 text-xs text-primary">Most</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Bathrooms */}
                    <tr className="border-t border-border bg-secondary/20">
                      <td className="sticky left-0 bg-secondary/20 p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Bath className="w-4 h-4 text-primary" />
                          Bathrooms
                        </div>
                      </td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4">
                          <span className={`font-semibold ${
                            property.baths === getMaxBaths ? "text-primary" : ""
                          }`}>
                            {property.baths}
                          </span>
                          {property.baths === getMaxBaths && properties.length > 1 && (
                            <span className="ml-2 text-xs text-primary">Most</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Square Footage */}
                    <tr className="border-t border-border">
                      <td className="sticky left-0 bg-card p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Square className="w-4 h-4 text-primary" />
                          Square Feet
                        </div>
                      </td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4">
                          <span className={`font-semibold ${
                            parseSqft(property.sqft) === getMaxSqft ? "text-primary" : ""
                          }`}>
                            {property.sqft}
                          </span>
                          {parseSqft(property.sqft) === getMaxSqft && properties.length > 1 && (
                            <span className="ml-2 text-xs text-primary">Largest</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Featured */}
                    <tr className="border-t border-border bg-secondary/20">
                      <td className="sticky left-0 bg-secondary/20 p-4 font-medium">Featured</td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4">
                          {property.featured ? (
                            <div className="flex items-center gap-2 text-primary">
                              <Check className="w-5 h-5" />
                              <span>Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Minus className="w-5 h-5" />
                              <span>No</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>


                    {/* Actions */}
                    <tr className="border-t border-border bg-secondary/20">
                      <td className="sticky left-0 bg-secondary/20 p-4 font-medium">Actions</td>
                      {properties.map((property) => (
                        <td key={property.id} className="p-4">
                          <Button onClick={scrollToContact} size="sm" className="w-full">
                            Schedule Viewing
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card/80">
              <p className="text-sm text-muted-foreground text-center">
                Tip: Highlighted values indicate the best option for that feature
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PropertyComparisonModal;
