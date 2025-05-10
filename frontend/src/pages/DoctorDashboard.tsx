import { useContext, useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import PatientInfoCard from "@/components/PatientInfoCard";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Mic, MicOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import DoctorVoiceAssistant from "@/components/DoctorVoiceAssistant";

interface ReportSection {
  id: string; // Unique ID for key prop, can be index or a generated ID
  title: string; // Clean title for button display
  rawTitle: string; // Title as it appears in markdown (e.g., with **)
  content: string;
}

const markdownLinkRenderer = (props: any) => (
  <a href={props.href} target="_blank" rel="noopener noreferrer" {...props}>
    {props.children}
  </a>
);

const DoctorDashboard = () => {
  const { language } = useContext(HealthcareContext);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [reportMainTitle, setReportMainTitle] = useState<string | null>(null);
  const [reportSectionsArray, setReportSectionsArray] = useState<ReportSection[]>([]);
  const [referencesSection, setReferencesSection] = useState<ReportSection | null>(null);
  const [reportSectionOpenStates, setReportSectionOpenStates] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const statusTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAndParseReport = async () => {
      try {
        const { data, error } = await supabase
          .from('grandma_reports' as any)
          .select('text')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code === 'PGRST116') {
          setReportMainTitle("No documents have been uploaded by the patient yet.");
          setReportSectionsArray([]);
          setReferencesSection(null);
          setReportSectionOpenStates({});
          return;
        }

        if (error) {
          toast({ title: "Error Loading Report", description: error.message, variant: "destructive" });
          return;
        }

        if (!data || !(data as any).text) {
          setReportMainTitle("No documents have been uploaded by the patient yet.");
          setReportSectionsArray([]);
          setReferencesSection(null);
          setReportSectionOpenStates({});
          return;
        }

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

      } catch (err) {
        console.error("Unexpected error processing report:", err);
        toast({ title: "Error", description: "Could not process patient report.", variant: "destructive" });
      }
    };

    fetchAndParseReport();
  }, []);

  // Effect for recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isRecording && recordingTime !== 0) {
      setRecordingTime(0); // Reset time when stopped
    }
    return () => clearInterval(interval); // Cleanup interval on unmount or before re-running effect
  }, [isRecording, recordingTime]); // Rerun when isRecording changes

  const toggleReportSection = (sectionId: string) => {
    setReportSectionOpenStates(prevStates => ({
      ...prevStates,
      [sectionId]: !prevStates[sectionId]
    }));
  };
  
  const handleExportPDF = () => toast({ title: "PDF Export", description: "PDF export function." });
  const handlePrint = () => window.print();
  const handleToggleRecording = () => {
    setIsRecording(prev => {
      const next = !prev;
      if (next) {
        setStatusMessage("Recording");
        setShowStatus(true);
        if (statusTimeout.current) clearTimeout(statusTimeout.current);
      } else {
        setStatusMessage("Recording stopped.");
        setShowStatus(true);
        if (statusTimeout.current) clearTimeout(statusTimeout.current);
        statusTimeout.current = setTimeout(() => setShowStatus(false), 1500);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header type="doctor" />
      
      <main className="flex-1 container max-w-7xl mx-auto py-12 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-heading mb-4 sm:mb-0">Patient Summary</h1>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleExportPDF} 
              className="text-blue-action border-blue-action hover:bg-blue-action hover:text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FileText className="mr-2 h-5 w-5" />Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrint} 
              className="text-blue-action border-blue-action hover:bg-blue-action hover:text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Printer className="mr-2 h-5 w-5" />Print
            </Button>
            {/*
            <Button 
              variant={isRecording ? "destructive" : "outline"} 
              onClick={handleToggleRecording} 
              className={`rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${isRecording ? "bg-red-600 hover:bg-red-700 text-white" : "text-blue-action border-blue-action hover:bg-blue-action hover:text-white"}`}
            >
              {isRecording ? (<><MicOff className="mr-2 h-5 w-5" />Stop ({recordingTime}s)</>) : (<><Mic className="mr-2 h-5 w-5" />Voice Note</>)}
            </Button>
            */}
          </div>
        </div>
        
        <div className="space-y-10">
          <PatientInfoCard />

          {reportMainTitle && (
            <div className="border-t border-border pt-10 mt-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-blue-heading mb-8">{reportMainTitle}</h2>
            </div>
          )}
          {reportSectionsArray.map((section) => {
            const isOpen = reportSectionOpenStates[section.id];
            return (
              <div
                key={section.id}
                className={
                  isOpen
                    ? "bg-card rounded-lg shadow-lg transition-all duration-300"
                    : "transition-all duration-300"
                }
              >
                <button
                  className={`flex items-center justify-between w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 ${isOpen ? 'rounded-t-lg bg-card' : ''} ${!isOpen ? 'bg-transparent' : ''} transition-colors duration-150`}
                  onClick={() => toggleReportSection(section.id)}
                  aria-expanded={isOpen}
                >
                  <span className="text-2xl font-semibold text-blue-heading pl-6">{section.title}</span>
                  <ChevronDown 
                    className={`h-6 w-6 text-blue-action transition-transform duration-300 ease-in-out ${isOpen ? 'transform rotate-180' : ''}`} 
                  />
                </button>
                {isOpen && section.content && (
                  <div className="p-6 rounded-b-lg prose dark:prose-invert max-w-none 
                                  prose-headings:text-blue-heading prose-p:text-foreground 
                                  prose-strong:text-foreground prose-li:text-foreground 
                                  prose-a:text-blue-action hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: markdownLinkRenderer }}>{section.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}

          {referencesSection && (() => {
            const isOpen = reportSectionOpenStates[referencesSection.id];
            return (
              <div
                key={referencesSection.id}
                className={
                  isOpen
                    ? "bg-card rounded-lg shadow-lg transition-all duration-300 mt-10 pt-8 border-t border-border"
                    : "transition-all duration-300 mt-10 pt-8 border-t border-border"
                }
              >
                <button
                  className={`flex items-center justify-between w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 ${isOpen ? 'rounded-t-lg bg-card' : ''} ${!isOpen ? 'bg-transparent' : ''} transition-colors duration-150`}
                  onClick={() => toggleReportSection(referencesSection.id)}
                  aria-expanded={isOpen}
                >
                  <span className="text-2xl font-semibold text-blue-heading pl-6">{referencesSection.title}</span>
                  <ChevronDown 
                    className={`h-6 w-6 text-blue-action transition-transform duration-300 ease-in-out ${isOpen ? 'transform rotate-180' : ''}`} 
                  />
                </button>
                {isOpen && referencesSection.content && (
                  <div className="p-6 rounded-b-lg prose dark:prose-invert max-w-none 
                                  prose-headings:text-blue-heading prose-p:text-foreground 
                                  prose-strong:text-foreground prose-li:text-foreground 
                                  prose-a:text-blue-action hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: markdownLinkRenderer }}>{referencesSection.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </main>

      {/* Floating Voice Record Button and Status */}
      <div className="fixed z-50 bottom-8 right-8 flex items-center">
        {/* Status message */}
        <div className={`mr-[40px] transition-opacity duration-700 text-lg font-medium select-none ${showStatus ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
             style={{ minWidth: '100px', color: isRecording ? '#f87171' : '#60a5fa' }}>
          {statusMessage}
        </div>
        <DoctorVoiceAssistant isRecording={isRecording} handleToggleRecording={handleToggleRecording} />
      </div>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 8px rgba(220,38,38,0.25), 0 4px 24px 0 rgba(0,0,0,0.25); }
          50% { box-shadow: 0 0 0 20px rgba(220,38,38,0.15), 0 4px 24px 0 rgba(0,0,0,0.25); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.2s infinite;
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
