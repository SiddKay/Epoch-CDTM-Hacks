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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header type="patient" />
      <main className="flex-1 container max-w-7xl mx-auto py-10 px-4 md:px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-heading mb-3 sm:mb-4">
            Welcome, Grandma!
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload and manage your medical documents
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex flex-col items-center space-y-6">
            <DocumentUploader /> 
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
              <Button 
                onClick={handleGenerateReport} 
                className="whitespace-nowrap bg-blue-action text-white rounded-lg shadow-md hover:bg-sky-400 transition-colors duration-200 px-6 py-3 text-base font-medium"
              >
                <Check className="mr-2 h-5 w-5" />
                Done - Generate Report
              </Button>
              <VoiceAssistant />
            </div>
          </div>
          
          <div className="flex flex-col h-full">
            <h2 className="text-3xl font-bold text-blue-heading mb-6">Uploaded Documents</h2>
            <div className="bg-card rounded-lg shadow-md flex-grow flex flex-col p-1 min-h-0">
              <div className="overflow-y-auto max-h-[calc(100vh-28rem)] space-y-3 p-4 md:p-5 custom-scrollbar">
                <DocumentList />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientUpload;
