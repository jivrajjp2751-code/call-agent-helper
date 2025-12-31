import { motion } from "framer-motion";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

const properties = [
  {
    id: 1,
    title: "Sea-View Luxury Apartment",
    location: "Bandra West, Mumbai",
    price: "₹8.5 Cr",
    beds: 4,
    baths: 4,
    sqft: "2,800",
    image: property1,
    featured: true,
  },
  {
    id: 2,
    title: "Premium Penthouse",
    location: "Worli, Mumbai",
    price: "₹12 Cr",
    beds: 5,
    baths: 5,
    sqft: "4,500",
    image: property2,
    featured: true,
  },
  {
    id: 3,
    title: "Garden Villa",
    location: "Koregaon Park, Pune",
    price: "₹6.5 Cr",
    beds: 5,
    baths: 4,
    sqft: "5,200",
    image: property3,
    featured: false,
  },
  {
    id: 4,
    title: "Modern 3BHK Flat",
    location: "Hinjewadi, Pune",
    price: "₹1.8 Cr",
    beds: 3,
    baths: 3,
    sqft: "1,850",
    image: property4,
    featured: false,
  },
  {
    id: 5,
    title: "Heritage Bungalow",
    location: "Panchgani, Maharashtra",
    price: "₹4.2 Cr",
    beds: 4,
    baths: 3,
    sqft: "3,500",
    image: property5,
    featured: true,
  },
  {
    id: 6,
    title: "Beachfront Apartment",
    location: "Alibaug, Maharashtra",
    price: "₹3.5 Cr",
    beds: 3,
    baths: 2,
    sqft: "2,200",
    image: property6,
    featured: false,
  },
];

const areas = ["All Areas", "Mumbai", "Pune", "Nashik", "Nagpur", "Lonavala", "Alibaug"];

const PropertyCard = ({ property, index }: { property: typeof properties[0]; index: number }) => {
  const [isLiked, setIsLiked] = useState(false);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card-hover overflow-hidden group"
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        
        {/* Featured Badge */}
        {property.featured && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            Featured
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-background/70"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isLiked ? "fill-primary text-primary" : "text-foreground"
            }`}
          />
        </button>

        {/* Price Tag */}
        <div className="absolute bottom-4 left-4">
          <span className="text-2xl font-bold gradient-text">{property.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {property.title}
        </h3>
        
        <div className="flex items-center text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 mr-1 text-primary" />
          <span className="text-sm">{property.location}</span>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="w-4 h-4" />
            <span>{property.sqft} sqft</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={scrollToContact}>
          Request Info
        </Button>
      </div>
    </motion.div>
  );
};

const PropertiesSection = () => {
  const [selectedArea, setSelectedArea] = useState("All Areas");

  const filteredProperties = selectedArea === "All Areas"
    ? properties
    : properties.filter((p) => {
        if (selectedArea === "Mumbai") return p.location.includes("Mumbai") || p.location.includes("Bandra") || p.location.includes("Worli");
        if (selectedArea === "Pune") return p.location.includes("Pune") || p.location.includes("Koregaon") || p.location.includes("Hinjewadi");
        return p.location.toLowerCase().includes(selectedArea.toLowerCase());
      });

  return (
    <section id="properties" className="py-24 bg-secondary/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Featured <span className="gradient-text">Properties</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Explore our handpicked selection of premium properties in your preferred area
          </p>

          {/* Area Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedArea === area
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProperties.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertiesSection;
