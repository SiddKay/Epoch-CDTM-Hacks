
import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ProgressBar from './ProgressBar';

// Mock data for document upload sequence
const DOCUMENT_TYPES = ["Insurance Card", "Doctor's Letter", "Lab Report"];

interface DocumentUploaderProps {
  onComplete: () => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentDocumentType = DOCUMENT_TYPES[currentStep - 1];

  // Simulate API call to upload the file
  const uploadFileToAPI = async (file: File, documentType: string): Promise<{ success: boolean, msg: string }> => {
    console.log(`Sending ${documentType} to API endpoint...`);
    
    // TODO: Replace this with actual API endpoint integration
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    // For testing purposes: Make "Doctor's Letter" always fail
    if (documentType === "Doctor's Letter") {
      console.error(`API upload failed for: ${documentType}`);
      return { 
        success: false, 
        msg: `Upload failed for ${documentType}. Please try again.` 
      };
    }
    
    // For other document types: Simulate random success/failure (70% success rate)
    const isSuccess = Math.random() < 0.7;
    
    if (isSuccess) {
      console.log(`API upload successful for: ${documentType}`);
      return { 
        success: true, 
        msg: `${documentType} uploaded successfully!` 
      };
    } else {
      console.error(`API upload failed for: ${documentType}`);
      return { 
        success: false, 
        msg: `Upload failed for ${documentType}. Please try again.` 
      };
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setSelectedFile(file);
    setIsUploading(true);
    setError(null);

    try {
      // Process the uploaded file
      const response = await uploadFileToAPI(file, currentDocumentType);
      
      // Display notification with the message
      toast({
        variant: response.success ? "default" : "destructive",
        title: response.success ? "Upload successful" : "Upload failed",
        description: response.msg,
      });
      
      if (response.success) {
        // Progress to next document if successful
        if (currentStep < DOCUMENT_TYPES.length) {
          setCurrentStep(prev => prev + 1);
        } else {
          // All documents uploaded
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      } else {
        // If failed, set error and allow retry
        setError(response.msg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonText = () => {
    if (isUploading) {
      return `Uploading ${selectedFile?.name || '...'}`;
    }
    
    if (error) {
      return `Try again: Upload ${currentDocumentType}`;
    }
    
    if (currentStep > DOCUMENT_TYPES.length) {
      return "All Done!";
    }
    
    return `Upload ${currentDocumentType}`;
  };

  return (
    <div className="w-full">
      <ProgressBar currentStep={currentStep} totalSteps={DOCUMENT_TYPES.length} />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png"
        className="hidden"
      />
      
      <Button 
        variant={error ? "destructive" : "default"}
        size="lg"
        className="w-full relative"
        onClick={handleButtonClick}
        disabled={isUploading || currentStep > DOCUMENT_TYPES.length}
      >
        {isUploading ? (
          <span className="animate-pulse-opacity flex items-center gap-2">
            Uploading {selectedFile?.name && <span className="truncate max-w-[200px]">{selectedFile.name}</span>}
            <span className="inline-flex">
              <span className="animate-bounce mx-0.5 h-1.5 w-1.5 rounded-full bg-current"></span>
              <span className="animate-bounce animation-delay-200 mx-0.5 h-1.5 w-1.5 rounded-full bg-current"></span>
              <span className="animate-bounce animation-delay-400 mx-0.5 h-1.5 w-1.5 rounded-full bg-current"></span>
            </span>
          </span>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {getButtonText()}
          </>
        )}
      </Button>
    </div>
  );
};

export default DocumentUploader;
