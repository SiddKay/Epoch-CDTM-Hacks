import { useContext, useState, useEffect } from "react";
import Header from "@/components/Header";
import PatientInfoCard from "@/components/PatientInfoCard";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Mic, MicOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";

interface ReportSection {
  id: string; // Unique ID for key prop, can be index or a generated ID
  title: string; // Clean title for button display
  rawTitle: string; // Title as it appears in markdown (e.g., with **)
  content: string;
}

const DoctorDashboard = () => {
  const { language } = useContext(HealthcareContext);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [reportMainTitle, setReportMainTitle] = useState<string | null>(null);
  const [reportSectionsArray, setReportSectionsArray] = useState<ReportSection[]>([]);
  const [referencesSection, setReferencesSection] = useState<ReportSection | null>(null);
  const [reportSectionOpenStates, setReportSectionOpenStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAndParseReport = async () => {
      try {
        const { data, error } = await supabase
          .from('grandma_reports') // Ensure this table name is correct
          .select('text')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching report from Supabase:", error);
          toast({ title: "Error Loading Report", description: error.message, variant: "destructive" });
          return;
        }

        if (data && (data as any).text) {
          const rawMarkdown = (data as any).text as string;
          let mainTitle = "Comprehensive Medical Report";
          let contentToParse = rawMarkdown;

          const firstLineEnd = rawMarkdown.indexOf('\n');
          if (firstLineEnd !== -1) {
            const firstLine = rawMarkdown.substring(0, firstLineEnd).trim();
            if (firstLine.startsWith('# ')) {
              mainTitle = firstLine.substring(2).trim();
              contentToParse = rawMarkdown.substring(firstLineEnd + 1).trim();
            }
          }
          setReportMainTitle(mainTitle);

          const parts = contentToParse.split(/\n(?=## )/);
          const parsedSections: ReportSection[] = [];
          let tempReferencesSection: ReportSection | null = null;
          const initialOpenStates: Record<string, boolean> = {};

          parts.forEach((part, index) => {
            const trimmedPart = part.trim();
            if (!trimmedPart) return;

            const titleEndIndex = trimmedPart.indexOf('\n');
            let rawSectionTitle = ''; // Title as it appears in MD, e.g. ## **Title**
            let sectionContent = '';

            if (trimmedPart.startsWith('## ')) {
              if (titleEndIndex !== -1) {
                rawSectionTitle = trimmedPart.substring(3, titleEndIndex).trim(); 
                sectionContent = trimmedPart.substring(titleEndIndex + 1).trim();
              } else {
                rawSectionTitle = trimmedPart.substring(3).trim(); 
              }
            } else { 
              // Handles content before the first ## if any (should be rare after H1 stripping)
              // Or if a section doesn't start with ## but is part of the split (unlikely with current regex)
              if (titleEndIndex !== -1) {
                rawSectionTitle = trimmedPart.substring(0, titleEndIndex).trim();
                sectionContent = trimmedPart.substring(titleEndIndex + 1).trim();
              } else {
                rawSectionTitle = trimmedPart;
              } 
            }
            
            // Clean title for display (remove markdown bolding)
            const displayTitle = rawSectionTitle.replace(/\*\*/g, '');
            const sectionId = `section-${index}`;

            const currentSection: ReportSection = {
              id: sectionId,
              title: displayTitle,
              rawTitle: rawSectionTitle, // Keep original for potential later use if needed
              content: sectionContent
            };

            // Identify and separate the references section (case-insensitive check)
            if (displayTitle.toLowerCase().includes('referenzen') || displayTitle.toLowerCase().includes('references')) {
              tempReferencesSection = currentSection;
            } else {
              parsedSections.push(currentSection);
            }
            initialOpenStates[sectionId] = false; // All sections collapsed by default
          });
          
          setReportSectionsArray(parsedSections);
          if (tempReferencesSection) {
            setReferencesSection(tempReferencesSection);
            initialOpenStates[tempReferencesSection.id] = false; // Ensure references also start collapsed
          }
          setReportSectionOpenStates(initialOpenStates);

        } else if (data) {
          // Report data received, but 'text' field is missing or null
        }
      } catch (err) {
        console.error("Unexpected error processing report:", err);
        toast({ title: "Error", description: "Could not process patient report.", variant: "destructive" });
      }
    };

    fetchAndParseReport();
  }, []);

  const toggleReportSection = (sectionId: string) => {
    setReportSectionOpenStates(prevStates => ({
      ...prevStates,
      [sectionId]: !prevStates[sectionId]
    }));
  };
  
  const handleExportPDF = () => toast({ title: "PDF Export", description: "PDF export function." });
  const handlePrint = () => window.print();
  const handleToggleRecording = () => { 
    setIsRecording(prev => !prev); 
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white flex flex-col">
      <Header type="doctor" />
      
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-healthcare-primary">Patient Summary</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportPDF} className="text-healthcare-primary border-healthcare-primary hover:bg-healthcare-primary/10"><FileText className="mr-2 h-4 w-4" />Export PDF</Button>
            <Button variant="outline" onClick={handlePrint} className="text-healthcare-primary border-healthcare-primary hover:bg-healthcare-primary/10"><Printer className="mr-2 h-4 w-4" />Print</Button>
            <Button variant={isRecording ? "destructive" : "outline"} onClick={handleToggleRecording} className={isRecording ? "" : "text-healthcare-primary border-healthcare-primary hover:bg-healthcare-primary/10"}>
              {isRecording ? (<><MicOff className="mr-2 h-4 w-4" />Stop Recording ({recordingTime}s)</>) : (<><Mic className="mr-2 h-4 w-4" />Voice Note</>)}
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          <PatientInfoCard />

          {reportMainTitle && (
            <h2 className="text-3xl font-bold text-healthcare-primary mt-8 mb-6">{reportMainTitle}</h2>
          )}
          {reportSectionsArray.map((section) => (
            <div key={section.id} className="space-y-1">
              <button
                className="flex items-center w-full text-left focus:outline-none text-xl font-semibold text-healthcare-primary mb-2 hover:underline"
                onClick={() => toggleReportSection(section.id)}
                aria-expanded={reportSectionOpenStates[section.id]}
              >
                {section.title} {/* Display clean title */}
                {reportSectionOpenStates[section.id] ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
              </button>
              {reportSectionOpenStates[section.id] && section.content && (
                <div className="bg-[#1A1F2C] p-4 rounded-md shadow-lg prose dark:prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {/* Render References section at the bottom if it exists */}
          {referencesSection && (
            <div key={referencesSection.id} className="space-y-1 mt-6 pt-6 border-t border-gray-700">
              <button
                className="flex items-center w-full text-left focus:outline-none text-xl font-semibold text-healthcare-primary mb-2 hover:underline"
                onClick={() => toggleReportSection(referencesSection.id)}
                aria-expanded={reportSectionOpenStates[referencesSection.id]}
              >
                {referencesSection.title} {/* Display clean title */}
                {reportSectionOpenStates[referencesSection.id] ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
              </button>
              {reportSectionOpenStates[referencesSection.id] && referencesSection.content && (
                <div className="bg-[#1A1F2C] p-4 rounded-md shadow-lg prose dark:prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{referencesSection.content}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
