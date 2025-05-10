import React, { useState, useRef } from 'react';
import { Upload, SkipForward, CheckCircle, ArrowRight } from 'lucide-react'; // Added ArrowRight for clarity if preferred over SkipForward for "Next"
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ProgressBar from './ProgressBar';

// Document upload sequence
const DOCUMENT_TYPES = [
  'Insurance Card',
  "Doctor's Letter",
  'Vaccination Card',
  'Lab Report',
  'Anything else?', // User's original naming
];

interface DocumentUploaderProps {
  onComplete: () => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // selectedFile now tracks the individual file being processed in a batch for UI feedback
  const [currentUploadingFile, setCurrentUploadingFile] = useState<File | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentDocumentType = DOCUMENT_TYPES[currentStep - 1];
  const isLastStep = currentStep === DOCUMENT_TYPES.length;

  // API call logic remains the same
  const uploadFileToAPI = async (
    file: File,
    documentType: string
  ): Promise<{ accepted: boolean; error: string }> => {
    console.log(`Sending ${documentType} (${file.name}) to API endpoint...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', documentType);
      const apiBaseUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:8000'
          : 'https://epoch-cdtm-hacks-186667666313.europe-west3.run.app';
      const response = await fetch(`${apiBaseUrl}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.accepted) {
        return {
          accepted: true,
          error: `${documentType} '${file.name}' uploaded successfully!`,
        };
      } else {
        return {
          accepted: false,
          error:
            result.error ||
            `Upload failed for ${documentType} '${file.name}'. Please try again.`,
        };
      }
    } catch (error) {
      console.error(`API upload error for ${file.name}:`, error);
      return {
        accepted: false,
        error:
          error instanceof Error
            ? error.message
            : `Upload failed for ${documentType} '${file.name}'. Please try again.`,
      };
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null); // Clear previous errors for this step on new attempt

    let filesProcessedSuccessfully = 0;
    let lastErrorMessage = '';

    for (const file of Array.from(files)) {
      setCurrentUploadingFile(file); // Set current file for UI feedback
      try {
        const response = await uploadFileToAPI(file, currentDocumentType);
        toast({
          variant: response.accepted ? 'default' : 'destructive',
          title: response.accepted
            ? `Uploaded: ${file.name}`
            : `Failed: ${file.name}`,
          description: response.error,
        });
        if (response.accepted) {
          filesProcessedSuccessfully++;
        } else {
          lastErrorMessage = response.error; // Keep track of the last error message
        }
      } catch (uploadError) {
        const errorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : 'An unknown error occurred';
        lastErrorMessage = errorMessage;
        toast({
          variant: 'destructive',
          title: `Upload error: ${file.name}`,
          description: errorMessage,
        });
      }
    }

    setCurrentUploadingFile(null); // Clear after batch
    setIsUploading(false);

    if (filesProcessedSuccessfully === files.length && files.length > 0) {
      toast({
        title: `${currentDocumentType} Files Processed`,
        description: `${filesProcessedSuccessfully} file(s) uploaded successfully. You can upload more or proceed to the next step.`,
      });
    } else if (files.length > 0) {
      setError(
        lastErrorMessage ||
          'Some files failed to upload. Please check notifications.'
      );
      toast({
        variant: 'destructive', // Changed from default to destructive as some files failed
        title: 'File Uploads Attempted',
        description: `Processed ${files.length} file(s) for ${currentDocumentType}. ${filesProcessedSuccessfully} succeeded. Some may have failed. You can try again or proceed.`,
      });
    }

    // Reset file input to allow re-selection of the same file(s)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // The component stays on the current step. User explicitly clicks "Next" or "Finish".
  };

  const handleNextOrFinishStep = () => {
    if (isUploading) return; // Prevent action during an active upload

    setError(null); // Clear any errors from the current step when moving on

    if (isLastStep) {
      toast({
        title: 'Finalizing Document Uploads',
        description: 'All document steps processed.',
      });
      setTimeout(() => {
        onComplete();
      }, 1000); // Delay for user to see toast
    } else {
      const nextStepNumber = currentStep + 1;
      if (nextStepNumber <= DOCUMENT_TYPES.length) {
        toast({
          title: 'Moving to Next Step',
          description: `Now uploading for ${
            DOCUMENT_TYPES[nextStepNumber - 1]
          }.`,
        });
        setCurrentStep(nextStepNumber);
      }
    }
  };

  const handleUploadButtonClick = () => {
    if (currentStep > DOCUMENT_TYPES.length) return; // Already completed
    fileInputRef.current?.click();
  };

  const getUploadButtonText = () => {
    if (error) {
      return `Retry Upload: ${currentDocumentType}`;
    }
    if (currentStep > DOCUMENT_TYPES.length) {
      return 'All Documents Processed!';
    }
    return `Upload ${currentDocumentType} Files`;
  };

  const getNextButtonIcon = () => {
    return isLastStep ? (
      <CheckCircle className="mr-2 h-4 w-4" />
    ) : (
      <SkipForward className="mr-2 h-4 w-4" />
    );
    // Or use ArrowRight for "Next":
    // return isLastStep ? <CheckCircle className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />;
  };

  const getNextButtonText = () => {
    if (isLastStep) {
      return 'Finish Uploading';
    }
    const nextDocumentType = DOCUMENT_TYPES[currentStep]; // currentStep is 1-based index
    return `Next: ${nextDocumentType || 'Step'}`;
  };

  return (
    <div className="w-full">
      <ProgressBar
        currentStep={currentStep}
        totalSteps={DOCUMENT_TYPES.length}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        multiple // Always allow multiple files
      />

      <Button
        variant={error ? 'destructive' : 'default'}
        size="lg"
        className="w-full relative mt-4" // Added margin for spacing
        onClick={handleUploadButtonClick}
        disabled={isUploading || currentStep > DOCUMENT_TYPES.length}
      >
        {isUploading ? (
          <span className="animate-pulse-opacity flex items-center gap-2">
            Uploading{' '}
            {currentUploadingFile ? (
              <span className="truncate max-w-[180px]">
                {currentUploadingFile.name}
              </span>
            ) : (
              'files...'
            )}
            <span className="inline-flex ml-1">
              <span className="animate-bounce mx-0.5 h-1.5 w-1.5 rounded-full bg-current"></span>
              <span className="animate-bounce animation-delay-200 mx-0.5 h-1.5 w-1.5 rounded-full bg-current"></span>
              <span className="animate-bounce animation-delay-400 mx-0.5 h-1.5 w-1.5 rounded-full bg-current"></span>
            </span>
          </span>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {getUploadButtonText()}
          </>
        )}
      </Button>

      {/* Next Step / Finish Button */}
      {currentStep <= DOCUMENT_TYPES.length && (
        <Button
          variant="outline"
          size="lg"
          className="w-full mt-2"
          onClick={handleNextOrFinishStep}
          disabled={isUploading} // Disable if any upload batch is in progress
        >
          {getNextButtonIcon()}
          {getNextButtonText()}
        </Button>
      )}
    </div>
  );
};

export default DocumentUploader;
