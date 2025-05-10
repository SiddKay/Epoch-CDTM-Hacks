
import { useContext, useState } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Sample data for medical reports
const sampleReports = [
  {
    id: "report1",
    title: "Annual Physical Examination",
    date: "2023-04-15",
    type: "physical",
    doctor: "Dr. Sarah Johnson",
    preview: "Patient appears healthy and well. Blood pressure: 120/80 mmHg. Heart rate: 72 BPM.",
    sourceDocumentId: "sample_doc_1"
  },
  {
    id: "report2",
    title: "Blood Test Results",
    date: "2023-03-22",
    type: "lab",
    doctor: "Lab Corp",
    preview: "Cholesterol: 185 mg/dL. Glucose: 95 mg/dL. All values within normal range.",
    sourceDocumentId: "sample_doc_2"
  },
  {
    id: "report3",
    title: "Cardiology Consultation",
    date: "2023-02-10",
    type: "specialist",
    doctor: "Dr. Robert Chen, Cardiologist",
    preview: "Patient has mild hypertension. No signs of cardiac abnormalities.",
    sourceDocumentId: "sample_doc_3"
  },
  {
    id: "report4",
    title: "X-Ray Report - Chest",
    date: "2023-01-05",
    type: "imaging",
    doctor: "Regional Medical Imaging",
    preview: "No abnormalities detected in chest. Lungs appear clear.",
    sourceDocumentId: "sample_doc_4"
  }
];

const MedicalReportsSection = () => {
  const { extractedData } = useContext(HealthcareContext);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  
  // Use sample data for demonstration
  // In reality, this would come from extractedData.previousReports
  const reports = sampleReports;
  
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportOpen(true);
  };
  
  const handleDownload = (report) => {
    toast({
      title: "Download Started",
      description: `Downloading ${report.title}...`,
    });
    
    // This would actually download the file in a real implementation
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${report.title} has been downloaded.`,
      });
    }, 1500);
  };
  
  // Group reports by type
  const reportTypes = {
    all: reports,
    lab: reports.filter(r => r.type === 'lab'),
    specialist: reports.filter(r => r.type === 'specialist'),
    imaging: reports.filter(r => r.type === 'imaging'),
    physical: reports.filter(r => r.type === 'physical')
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Medical Reports & Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="lab">Lab Results</TabsTrigger>
              <TabsTrigger value="specialist">Specialist</TabsTrigger>
              <TabsTrigger value="imaging">Imaging</TabsTrigger>
              <TabsTrigger value="physical">Physicals</TabsTrigger>
            </TabsList>
            
            {Object.entries(reportTypes).map(([type, typeReports]) => (
              <TabsContent key={type} value={type} className="pt-4">
                {typeReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {type} reports available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typeReports.map((report) => (
                      <div 
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-md mr-4">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{report.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{new Date(report.date).toLocaleDateString()}</span>
                              <span>{report.doctor}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Report preview dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        {selectedReport && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedReport.title}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                <div>Date: {new Date(selectedReport.date).toLocaleDateString()}</div>
                <div>Provider: {selectedReport.doctor}</div>
              </div>
              
              {/* This would be an iframe or embedded PDF viewer in a real implementation */}
              <div className="border rounded-md p-6 h-96 bg-accent/5 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-4">{selectedReport.preview}</p>
                  <p className="text-sm text-muted-foreground">
                    This is a simulated PDF preview. In a real implementation, the actual document would be displayed here.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload(selectedReport)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default MedicalReportsSection;
