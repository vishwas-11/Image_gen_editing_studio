"use client";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/index";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onFilterToggle: () => void;
  hasActiveFilters: boolean;
}

export function SearchBar({ value, onChange, onFilterToggle, hasActiveFilters }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-studio-subtle" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by prompt or tags..."
          className="pl-9"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-subtle hover:text-white"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <Button
        type="button"
        variant={hasActiveFilters ? "default" : "outline"}
        size="icon"
        onClick={onFilterToggle}
        title="Filters"
      >
        <Filter size={14} />
      </Button>
    </div>
  );
}

export default SearchBar;
