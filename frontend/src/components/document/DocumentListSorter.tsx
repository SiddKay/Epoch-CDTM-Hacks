
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export type SortField = "date" | "name" | "type";
export type SortOrder = "asc" | "desc";

interface DocumentListSorterProps {
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}

export const DocumentListSorter = ({ 
  sortBy, 
  sortOrder, 
  onSortChange 
}: DocumentListSorterProps) => {
  const getSortLabel = () => {
    const fieldLabel = sortBy === "date" ? "Date" : sortBy === "name" ? "Name" : "Type";
    const orderLabel = sortOrder === "asc" ? "A-Z" : "Z-A";
    return `Sort by ${fieldLabel} (${orderLabel})`;
  };

  return (
    <div className="flex justify-end mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {getSortLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortChange("date")}>
            Sort by Date
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("name")}>
            Sort by Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("type")}>
            Sort by Type
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
