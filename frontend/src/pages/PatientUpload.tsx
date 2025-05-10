import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import Header from "@/components/Header";
import VoiceAssistant from "@/components/VoiceAssistant";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const PatientUpload = () => {
  const handleGenerateReport = async () => {
    // Placeholder URL - update this with your actual backend endpoint
    const reportGenerationUrl = "/api/trigger-report-generation"; 
    
    toast({ title: "Processing...", description: "Requesting report generation." });

    try {
      const response = await fetch(reportGenerationUrl, {
        method: "POST",
        // Headers and body can be added here if needed by your backend
        // headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ userId: "grandma" }), // Example body
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred." }));
        throw new Error(`Failed to generate report: ${response.status} ${response.statusText}. ${errorData.message}`);
      }

      // Assuming backend responds with JSON
      const result = await response.json();
      
      toast({
        title: "Success!",
        description: result.message || "Report generation process started successfully.",
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

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
            <Button onClick={handleGenerateReport} className="w-full md:w-auto">
              <Check className="mr-2 h-4 w-4" />
              Done - Generate Report
            </Button>
            
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
