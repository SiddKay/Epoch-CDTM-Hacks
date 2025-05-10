import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarkdownTableProps {
  markdownContent: string;
  title?: string;
  className?: string;
}

const MarkdownTable: React.FC<MarkdownTableProps> = ({ markdownContent, title, className }) => {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="prose dark:prose-invert max-w-none pt-3">
        {/* Added max-w-none to allow table to use available width */}
        {/* Added dark:prose-invert for better dark mode table visibility */}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdownContent}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default MarkdownTable; 