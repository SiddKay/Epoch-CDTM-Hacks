
import { useContext, useState } from "react";
import Header from "@/components/Header";
import PatientInfoCard from "@/components/PatientInfoCard";
import MedicationTable from "@/components/MedicationTable";
import VaccinationTable from "@/components/VaccinationTable";
import ConditionsTable from "@/components/ConditionsTable";
import VitalSignsChart from "@/components/VitalSignsChart";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Printer, Mic, MicOff, Download, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import VisitsBarChart from "@/components/VisitsBarChart";
import VaccinationPieChart from "@/components/VaccinationPieChart";
import GlucoseTrendChart from "@/components/GlucoseTrendChart";
import MedicalReportsSection from "@/components/MedicalReportsSection";

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
          <Tabs defaultValue="vitals" className="w-full">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
              <TabsTrigger value="charts">Health Charts</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="reports">Medical Reports</TabsTrigger>
            </TabsList>
            
            {/* Vitals Tab */}
            <TabsContent value="vitals" className="space-y-6 pt-4">
              <VitalSignsChart />
              <GlucoseTrendChart />
            </TabsContent>
            
            {/* Charts Tab */}
            <TabsContent value="charts" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VaccinationPieChart />
                <VisitsBarChart />
              </div>
            </TabsContent>
            
            {/* Medications Tab */}
            <TabsContent value="medications" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MedicationTable />
                <VaccinationTable />
              </div>
              <ConditionsTable />
            </TabsContent>
            
            {/* Reports Tab */}
            <TabsContent value="reports" className="pt-4">
              <MedicalReportsSection />
            </TabsContent>
          </Tabs>
          
          {/* Eligibility information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Program Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-green-500/10 rounded-md">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">
                    Hypertension Disease Management Program
                  </span>
                </div>
                
                <div className="flex items-center p-3 bg-amber-500/10 rounded-md">
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium">
                      Diabetes Management Program
                    </span>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      Missing: Latest HbA1c measurement
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-blue-500/10 rounded-md">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">
                    Primary Care Program
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
