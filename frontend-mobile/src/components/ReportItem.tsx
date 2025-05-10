
import React from 'react';
import { File, FileText, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ReportType {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface ReportItemProps {
  report: ReportType;
}

const ReportItem: React.FC<ReportItemProps> = ({ report }) => {
  const getIcon = () => {
    switch (report.type) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  return (
    <Link to={`/report/${report.id}`} className="block">
      <div className="flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/30 transition-colors">
        <div className="rounded-md w-10 h-10 bg-secondary flex items-center justify-center text-primary">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">{report.name}</h3>
          <p className="text-muted-foreground text-xs">{report.date}</p>
        </div>
      </div>
    </Link>
  );
};

export default ReportItem;
