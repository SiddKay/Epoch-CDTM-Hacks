import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import DocumentUploader from '@/components/DocumentUploader';
import NavigationFooter from '@/components/NavigationFooter';
import GlobalVoiceAgent from '@/components/GlobalVoiceAgent';

const UploadDocuments: React.FC = () => {
  const navigate = useNavigate();
  const [uploadCompleted, setUploadCompleted] = useState(false);

  const handleComplete = () => {
    setUploadCompleted(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };
  return (
    <div className="app-container">
      <div className="page-header">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="ml-4">
          <Logo />
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-140px)] max-h-[calc(100vh-140px)] overflow-hidden">
        <div className="flex-1 relative min-h-0">
          {/* Centered div with mic button */}
          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
            <GlobalVoiceAgent />
          </div>

          {/* Success overlay - shown when all uploads are complete */}
          {uploadCompleted && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center flex-col">
              <div className="text-primary w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-medium">Upload Complete</h2>
              <p className="text-muted-foreground">Redirecting to home...</p>
            </div>
          )}
        </div>

        {/* Bottom section with upload controls */}
        <div className="p-4 bg-background">
          <DocumentUploader onComplete={handleComplete} />
        </div>
      </div>

      <NavigationFooter />
    </div>
  );
};
export default UploadDocuments;
