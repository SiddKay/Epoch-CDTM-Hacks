import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentCard } from "./document/DocumentCard"; // Assuming DocumentCard is in a 'document' subfolder
import { DocumentPreview } from "./document/DocumentPreview"; // Assuming DocumentPreview is in a 'document' subfolder
import { GrandmaFile } from "./document/utils"; // Assuming GrandmaFile is in a 'document' subfolder

const DoctorDocumentList = () => {
  const [files, setFiles] = useState<GrandmaFile[]>([]);
  const [previewFile, setPreviewFile] = useState<GrandmaFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      // Fetch files from the 'grandma_files' table
      const { data, error } = await supabase
        .from('grandma_files')
        .select('*')
        .order('upload_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching files:', error);
        toast({
          title: "Error",
          description: "Failed to load patient documents.", // Slightly different message for doctor context
          variant: "destructive",
        });
      } else if (data) {
        setFiles(data as unknown as GrandmaFile[]);
      }
    } catch (e) {
      console.error('Unexpected error fetching files:', e);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    
    const handleRefresh = () => fetchFiles();
    window.addEventListener('refreshDocuments', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshDocuments', handleRefresh);
    };
  }, []);

  const handleDelete = async (id: string) => {
    // For the doctor's dashboard, we might reconsider if doctors can delete files.
    // For now, implementing the same delete functionality as Patient's DocumentList.
    // A confirmation dialog would be a good addition here in a real app.
    toast({
        title: "Confirm Deletion",
        description: "Are you sure you want to delete this file? This action might be restricted for doctors.",
        // TODO: Implement actual confirmation and potentially role-based access for deletion
    });
    console.warn("File deletion initiated by doctor. In a real app, confirm and check permissions.");

    try {
      const fileToDelete = files.find(file => file.id === id);
      if (!fileToDelete) return;
      
      const { error: storageError } = await supabase
        .storage
        .from('medical_documents') // Assuming this is the correct bucket name
        .remove([fileToDelete.file_path]);
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Not necessarily a fatal error for the DB record deletion, but should be logged
      }
      
      const { error: dbError } = await supabase
        .from('grandma_files')
        .delete()
        .eq('id', id);
        
      if (dbError) {
        console.error('Error deleting file record:', dbError);
        toast({
          title: "Error",
          description: "Failed to delete file record.",
          variant: "destructive",
        });
        return;
      }
      
      setFiles(files.filter(file => file.id !== id));
      toast({
        title: "File Deleted",
        description: "File has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file.",
        variant: "destructive",
      });
    }
  };
  
  const handlePreview = (file: GrandmaFile) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground p-4">Loading documents...</div>;
  }

  if (files.length === 0) {
    return <div className="text-center text-muted-foreground p-4">No documents uploaded for this patient.</div>;
  }

  return (
    <div className="space-y-3">
      {/* Comment: Displaying list of documents fetched from 'grandma_files' table */}
      {files.map((file) => (
        <DocumentCard 
          key={file.id}
          file={file}
          onPreview={handlePreview}
          onDelete={handleDelete} // Doctors can delete for now, consider permissions
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

export default DoctorDocumentList; 