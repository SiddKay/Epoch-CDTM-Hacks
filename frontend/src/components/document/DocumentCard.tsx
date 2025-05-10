
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
  const iconColorClass = getFileIconColor(file.file_type);

  return (
    <Card className="p-3 flex justify-between items-center card-hover">
      <div className="flex items-center space-x-3">
        <div className="bg-accent/10 rounded-lg p-2">
          <FileText className={`h-5 w-5 ${iconColorClass}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium">
              {file.file_name}
            </h4>
            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
              {fileTypeDisplay}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(file.upload_date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short'
            })}
          </p>
        </div>
      </div>
      <div className="flex space-x-1">
        <Button variant="ghost" size="icon" onClick={() => onPreview(file)}>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(file.id)}>
          <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </Card>
  );
};
