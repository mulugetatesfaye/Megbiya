"use client";

import { Id } from "@/convex/_generated/dataModel";
import { CategoryType } from "@/types";
import { Button } from "@/components/ui/button";

interface EventFiltersProps {
  categories: CategoryType[];
  selectedCategory: Id<"categories"> | null;
  onCategoryChange: (categoryId: Id<"categories"> | null) => void;
}

export function EventFilters({
  categories,
  selectedCategory,
  onCategoryChange,
}: EventFiltersProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 pb-4">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className="flex-shrink-0"
        >
          All Events
        </Button>
        {categories.map((category) => (
          <Button
            key={category._id}
            variant={selectedCategory === category._id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category._id)}
            className="flex-shrink-0"
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
