
import { SortField, SortOrder } from "./DocumentListSorter";

export interface GrandmaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  preview_url?: string;
}

// Sort files based on provided sort settings
export const sortDocuments = (
  files: GrandmaFile[],
  sortBy: SortField,
  sortOrder: SortOrder
): GrandmaFile[] => {
  return [...files].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a.file_name.toLowerCase();
      const nameB = b.file_name.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortBy === "type") {
      const typeA = a.file_type.toLowerCase();
      const typeB = b.file_type.toLowerCase();
      return sortOrder === "asc" ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
    } else {
      // Sort by date
      const dateA = new Date(a.upload_date).getTime();
      const dateB = new Date(b.upload_date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });
};

// Get file type for display
export const getFileTypeDisplay = (fileType: string): string => {
  if (fileType.includes("image/")) return "Image";
  if (fileType.includes("application/pdf")) return "PDF";
  if (fileType.includes("text/")) return "Text";
  if (fileType.includes("video/")) return "Video";
  if (fileType.includes("audio/")) return "Audio";
  return "Document";
};

// Get icon color based on file type
export const getFileIconColor = (fileType: string): string => {
  if (fileType.includes("image/")) return "text-blue-500";
  if (fileType.includes("application/pdf")) return "text-red-500";
  if (fileType.includes("text/")) return "text-green-500";
  if (fileType.includes("video/")) return "text-purple-500";
  if (fileType.includes("audio/")) return "text-yellow-500";
  return "text-gray-500";
};
