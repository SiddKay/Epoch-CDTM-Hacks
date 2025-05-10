
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { GrandmaFile } from "./utils";

interface DocumentPreviewProps {
  file: GrandmaFile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentPreview = ({ file, isOpen, onOpenChange }: DocumentPreviewProps) => {
  if (!file) {
    return null;
  }
  
  const isImage = file.file_type.startsWith('image/');
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{file.file_name}</DialogTitle>
          <DialogDescription>
            Uploaded on {new Date(file.upload_date).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="p-2">
          {file.preview_url ? (
            <div className="flex flex-col items-center">
              <div className="border rounded overflow-hidden mb-4">
                {isImage ? (
                  <img 
                    src={file.preview_url} 
                    alt="File preview" 
                    className="max-w-full h-auto max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="h-64 w-full flex items-center justify-center bg-accent/10">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Preview not available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
