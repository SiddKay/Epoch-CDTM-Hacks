import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, XCircle } from "lucide-react";
import { GrandmaFile, getFileTypeDisplay, getFileIconColor } from "./utils";

interface DocumentCardProps {
  file: GrandmaFile;
  onPreview: (file: GrandmaFile) => void;
  onDelete: (id: string) => void;
}

export const DocumentCard = ({ file, onPreview, onDelete }: DocumentCardProps) => {
  const fileTypeDisplay = getFileTypeDisplay(file.file_type);
  const iconColorClass = getFileIconColor(file.file_type) || 'text-blue-action';

  return (
    <Card className="p-4 flex justify-between items-center bg-background border border-border rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-blue-action/20 transition-shadow duration-150">
      <div className="flex items-center space-x-4">
        <div className="bg-blue-action/10 rounded-lg p-2.5">
          <FileText className={`h-6 w-6 ${iconColorClass}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <h4 className="font-semibold text-foreground text-base">
              {file.file_name}
            </h4>
            <Badge variant="outline" className="border-blue-action/30 text-blue-action/80 text-xs px-1.5 py-0.5">
              {fileTypeDisplay}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(file.upload_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, {new Date(file.upload_date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short'
            })}
          </p>
        </div>
      </div>
      <div className="flex space-x-1.5">
        <Button variant="ghost" size="icon" onClick={() => onPreview(file)} title="Preview file">
          <Eye className="h-5 w-5 text-blue-action/70 hover:text-blue-action transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(file.id)} title="Delete file">
          <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
        </Button>
      </div>
    </Card>
  );
};
