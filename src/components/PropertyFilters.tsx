import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface PropertyFilters {
  search: string;
  priceMin: number;
  priceMax: number;
  bedsMin: number;
  bedsMax: number;
  sqftMin: number;
  sqftMax: number;
  location: string;
}

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  locations: string[];
}

const PropertyFiltersComponent = ({ filters, onFiltersChange, locations }: PropertyFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      priceMin: 0,
      priceMax: 50,
      bedsMin: 1,
      bedsMax: 10,
      sqftMin: 0,
      sqftMax: 10000,
      location: "all",
    });
  };

  const hasActiveFilters = 
    filters.search !== "" ||
    filters.priceMin > 0 ||
    filters.priceMax < 50 ||
    filters.bedsMin > 1 ||
    filters.bedsMax < 10 ||
    filters.sqftMin > 0 ||
    filters.sqftMax < 10000 ||
    filters.location !== "all";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by property name or location..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Button
          variant={isExpanded ? "default" : "outline"}
          size="lg"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-2 h-2 rounded-full bg-primary-foreground" />
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Price Range (in Cr)</label>
              <div className="px-2">
                <Slider
                  value={[filters.priceMin, filters.priceMax]}
                  onValueChange={([min, max]) => {
                    updateFilter("priceMin", min);
                    updateFilter("priceMax", max);
                  }}
                  max={50}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>₹{filters.priceMin} Cr</span>
                  <span>₹{filters.priceMax} Cr</span>
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Bedrooms</label>
              <div className="px-2">
                <Slider
                  value={[filters.bedsMin, filters.bedsMax]}
                  onValueChange={([min, max]) => {
                    updateFilter("bedsMin", min);
                    updateFilter("bedsMax", max);
                  }}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{filters.bedsMin} bed</span>
                  <span>{filters.bedsMax}+ beds</span>
                </div>
              </div>
            </div>

            {/* Square Footage */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Square Footage</label>
              <div className="px-2">
                <Slider
                  value={[filters.sqftMin, filters.sqftMax]}
                  onValueChange={([min, max]) => {
                    updateFilter("sqftMin", min);
                    updateFilter("sqftMax", max);
                  }}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{filters.sqftMin} sqft</span>
                  <span>{filters.sqftMax}+ sqft</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={filters.location}
                onValueChange={(value) => updateFilter("location", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-6 gap-3">
            {hasActiveFilters && (
              <Button variant="ghost" onClick={resetFilters} className="gap-2">
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
            <Button onClick={() => setIsExpanded(false)}>
              Apply Filters
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PropertyFiltersComponent;
