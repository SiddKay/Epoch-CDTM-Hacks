
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

const DocumentUploader = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle file upload from file picker
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Filter for only JPG and PNG files
    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a JPG or PNG file.`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      processFiles(validFiles);
    }
  };
  
  // Process files
  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Create a unique file path
        const fileId = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `${fileId}.${fileExt}`;
        
        console.log("Uploading file with path:", filePath);
        
        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('uploads')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (storageError) {
          console.error('Error uploading file to storage:', storageError);
          toast({
            title: "Upload Error",
            description: `Failed to store file: ${file.name}`,
            variant: "destructive",
          });
          continue;
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('uploads')
          .getPublicUrl(filePath);
          
        const publicUrl = publicUrlData.publicUrl;
        
        // Save file metadata to grandma_files table
        const { error: dbError } = await supabase
          .from('grandma_files')
          .insert({
            file_name: file.name,
            file_type: file.type,
            file_path: filePath,
            file_size: file.size,
            preview_url: publicUrl
          });
        
        if (dbError) {
          console.error('Error saving file metadata:', dbError);
          toast({
            title: "Metadata Error",
            description: `Failed to save file metadata: ${file.name}`,
            variant: "destructive",
          });
          continue;
        }
        
        // Dispatch an event to refresh the documents list
        window.dispatchEvent(new Event('refreshDocuments'));
        
        toast({
          title: "Document Uploaded",
          description: file.name,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Error",
          description: `Failed to process file: ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  };

  // Handle drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // Filter for only JPG and PNG files
    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a JPG or PNG file.`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      processFiles(validFiles);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card 
        className={`border-2 border-dashed p-6 text-center ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Upload your documents</h3>
            <p className="text-sm text-muted-foreground mt-1">Supports: JPG, PNG only</p>
          </div>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".jpg,.jpeg,.png" 
            multiple 
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
          
          <Button 
            disabled={isProcessing}
            onClick={() => document.getElementById('file-upload')?.click()}
            className="relative"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Processing file...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Document</span>
              </div>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DocumentUploader;
