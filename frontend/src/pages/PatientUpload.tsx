
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import Header from "@/components/Header";
import VoiceAssistant from "@/components/VoiceAssistant";

const PatientUpload = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header type="patient" />
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, Grandma!
          </h1>
          <p className="text-muted-foreground">
            Upload and manage your medical documents
          </p>
        </div>
        
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Document Uploader */}
          <div className="space-y-6">
            <DocumentUploader />
            
            <div className="mt-8">
              <VoiceAssistant />
            </div>
          </div>
          
          {/* Right column: Document List */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
            <DocumentList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientUpload;
