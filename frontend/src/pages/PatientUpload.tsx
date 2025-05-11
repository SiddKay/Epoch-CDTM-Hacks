import DocumentList from "@/components/DocumentList";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Custom header without navigation
const CustomHeader = () => {
  return (
    <header className="w-full border-b border-border/40 sticky top-0 z-50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="container max-w-7xl mx-auto flex items-center justify-between h-24 px-4 md:px-6">
        <div className="relative flex items-center space-x-3">
          {/* Glow effect div - positioned behind the logo */}
          <div className="absolute inset-0 -m-4 blur-2xl opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-logo-purple via-logo-purple/40 to-transparent rounded-full"></div>
          
          <div className="relative z-10">
            <img src="/ovita_logo.png" alt="Ovita Logo" className="h-[4.4rem] md:h-[5.5rem] w-auto transition-all duration-300 ease-in-out" />
          </div>
        </div>
        
        <div className="flex items-center">
          <Avatar className="h-11 w-11 md:h-[3.3rem] md:w-[3.3rem] border-2 border-border hover:border-blue-action/50 transition-colors duration-200">
            <AvatarImage src="/doctor.png" alt="Doctor Avatar" />
            <AvatarFallback className="bg-blue-action/20 text-blue-action font-semibold">
              DR
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

const PatientUpload = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const lastCheckTimestamp = useRef<string | null>(null);

  // Function to check for new reports
  const checkForNewReport = async () => {
    try {
      const { data, error } = await supabase
        .from('grandma_reports' as any)
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking for reports:", error);
        return false;
      }

      // If there's no data, no reports exist yet
      if (!data) return false;

      // If this is the first check, just store the timestamp
      if (!lastCheckTimestamp.current) {
        lastCheckTimestamp.current = (data as any).created_at;
        return false;
      }

      // If we found a newer timestamp than our last check, a new report was generated
      if ((data as any).created_at > lastCheckTimestamp.current) {
        return true;
      }

      return false;
    } catch (err) {
      console.error("Unexpected error checking for reports:", err);
      return false;
    }
  };

  // Set up polling for new reports when generation is started
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (isGenerating) {
      // Poll every 2 seconds to check for new reports
      intervalId = window.setInterval(async () => {
        const newReportFound = await checkForNewReport();
        if (newReportFound) {
          setIsGenerating(false);
          toast({ title: "Success!", description: "Report successfully generated." });
          navigate('/doctor');
        }
      }, 2000);
    }

    // Clean up the interval when component unmounts or generation stops
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isGenerating, navigate]);

  // Initial check for the latest report timestamp
  useEffect(() => {
    const getLatestReportTimestamp = async () => {
      try {
        const { data } = await supabase
          .from('grandma_reports' as any)
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          lastCheckTimestamp.current = (data as any).created_at;
        }
      } catch (err) {
        console.error("Error getting latest report timestamp:", err);
      }
    };

    getLatestReportTimestamp();
  }, []);

  const handleGenerateReport = async () => {
    // Don't trigger multiple report generations
    if (isGenerating) return;

    setIsGenerating(true);
    // Placeholder URL - update this with your actual backend endpoint
    const apiBaseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://epoch-cdtm-hacks-186667666313.europe-west3.run.app';
    const reportGenerationUrl = `${apiBaseUrl}/trigger-report-generation`; 
    
    toast({ title: "Processing...", description: "Requesting report generation." });

    try {
      const response = await fetch(reportGenerationUrl, {
        method: "GET",
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
        title: "Request Sent",
        description: "Report generation has started. Please wait...",
      });

    } catch (error) {
      console.error("Error generating report:", error);
      setIsGenerating(false);
      toast({
        title: "Error Generating Report",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <CustomHeader />
      <main className="flex-1 container max-w-7xl mx-auto py-10 px-4 md:px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-heading mb-3 sm:mb-4">
            Welcome Doc!
          </h1>
          <p className="text-lg text-muted-foreground">
            Review your patient's documents and generate a report for a more comprehensive overview
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex flex-col w-full max-w-2xl">
            <h2 className="text-3xl font-bold text-blue-heading mb-6">Grandma's Documents</h2>
            <div className="bg-card rounded-lg shadow-md flex-grow flex flex-col p-1 min-h-0">
              <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-28rem)] space-y-3 p-4 md:p-5 custom-scrollbar">
                <DocumentList />
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating}
                className="whitespace-nowrap bg-[#1a2c59] text-white rounded-lg shadow-md hover:bg-[#162147] transition-colors duration-200 px-8 py-3 text-base font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Done - Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientUpload;
