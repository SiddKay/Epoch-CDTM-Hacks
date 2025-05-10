
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentCard } from "./document/DocumentCard";
import { DocumentPreview } from "./document/DocumentPreview";
import { GrandmaFile } from "./document/utils";

const DocumentList = () => {
  const [files, setFiles] = useState<GrandmaFile[]>([]);
  const [previewFile, setPreviewFile] = useState<GrandmaFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch files from Supabase on component mount
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching files from database");
      
      // Use explicit select to get all records from our newly created table
      const { data, error } = await supabase
        .from('grandma_files')
        .select('*')
        .order('upload_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching files:', error);
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive",
        });
      } else if (data) {
        console.log("Files fetched successfully:", data);
        // Cast the data to the expected type
        setFiles(data as unknown as GrandmaFile[]);
      }
    } catch (e) {
      console.error('Unexpected error fetching files:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    
    // Listen for the refreshDocuments event to refresh the list
    const handleRefresh = () => fetchFiles();
    window.addEventListener('refreshDocuments', handleRefresh);
    
    // Cleanup
    return () => {
      window.removeEventListener('refreshDocuments', handleRefresh);
    };
  }, []);

  // Delete a file
  const handleDelete = async (id: string) => {
    try {
      // Find the file to get its path
      const fileToDelete = files.find(file => file.id === id);
      
      if (!fileToDelete) return;
      
      console.log("Deleting file:", fileToDelete);
      
      // First delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('medical_documents')
        .remove([fileToDelete.file_path]);
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
      
      // Then delete metadata from database
      const { error: dbError } = await supabase
        .from('grandma_files')
        .delete()
        .eq('id', id);
        
      if (dbError) {
        console.error('Error deleting file record:', dbError);
        toast({
          title: "Error",
          description: "Failed to delete file record",
          variant: "destructive",
        });
        return;
      }
      
      // Update UI
      setFiles(files.filter(file => file.id !== id));
      
      toast({
        title: "File Deleted",
        description: "File has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };
  
  // Preview a file
  const handlePreview = (file: GrandmaFile) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Loading files...
      </div>
    );
  }

  // Show empty state
  if (files.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <DocumentCard 
          key={file.id}
          file={file}
          onPreview={handlePreview}
          onDelete={handleDelete}
        />
      ))}
      
      <DocumentPreview 
        file={previewFile} 
        isOpen={previewOpen} 
        onOpenChange={setPreviewOpen} 
      />
    </div>
  );
};

export default DocumentList;
