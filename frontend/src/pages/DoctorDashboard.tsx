import { useContext, useState } from "react";
import Header from "@/components/Header";
import PatientInfoCard from "@/components/PatientInfoCard";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Printer, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import DoctorDocumentList from "@/components/DoctorDocumentList";

// ADDED: New components for tab content
import HealthReportsTable from "@/components/HealthReportsTable";
import VaccineCardTable from "@/components/VaccineCardTable";
import MedicalHistoryDisplay from "@/components/MedicalHistoryDisplay";

const DoctorDashboard = () => {
  const { extractedData } = useContext(HealthcareContext);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Handle PDF export (mock functionality)
  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality would be implemented here.",
    });
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };
  
  // Handle voice recording (simulated)
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      
      // Simulated voice input – real-time audio capture and AI transcription to be implemented later
      toast({
        title: "Recording Started",
        description: "Voice notes will be transcribed automatically.",
      });
      
      // Simulate recording for demonstration
      const recordingInterval = setInterval(() => {
        setRecordingTime(prevTime => {
          if (prevTime >= 30) { // Auto stop after 30 seconds
            clearInterval(recordingInterval);
            setIsRecording(false);
            
            toast({
              title: "Recording Saved",
              description: "Voice note has been saved and transcribed.",
            });
            
            return 0;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else {
      setIsRecording(false);
      setRecordingTime(0);
      
      toast({
        title: "Recording Stopped",
        description: "Voice note has been saved and will be transcribed.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header type="doctor" />
      
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-healthcare-dark">
            Patient Summary
          </h1>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            
            <Button 
              variant={isRecording ? "destructive" : "outline"}
              onClick={handleToggleRecording}
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Recording ({recordingTime}s)
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Voice Note
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Patient info section */}
          <PatientInfoCard />
          
          {/* Tabs for different chart types and data */}
          <Tabs defaultValue="health-reports" className="w-full">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="health-reports">Health Reports</TabsTrigger>
              <TabsTrigger value="vaccine-card">Vaccine Card</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
              <TabsTrigger value="pdf-image-view">Pdf/Image View</TabsTrigger>
            </TabsList>
            
            {/* Health Reports Tab (formerly Vitals Tab) */}
            <TabsContent value="health-reports" className="space-y-6 pt-4">
              <HealthReportsTable />
            </TabsContent>
            
            {/* Vaccine Card Tab */}
            <TabsContent value="vaccine-card" className="pt-4">
              <VaccineCardTable />
            </TabsContent>

            {/* Medical History Tab */}
            <TabsContent value="medical-history" className="space-y-6 pt-4">
              <MedicalHistoryDisplay />
            </TabsContent>

            {/* Pdf/Image View Tab */}
            <TabsContent value="pdf-image-view" className="pt-4">
              <DoctorDocumentList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
