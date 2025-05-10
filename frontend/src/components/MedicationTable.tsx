
import { useContext, useState } from "react";
import { HealthcareContext, Medication } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MedicationTable = () => {
  const { extractedData, documents, language } = useContext(HealthcareContext);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  // Format date according to language preference
  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return date.toLocaleDateString(language === "en" ? "en-US" : "de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Find source document for a medication
  const getSourceDocument = (sourceId: string) => {
    return documents.find(doc => doc.id === sourceId);
  };

  return (
    <Card>
      <CardHeader className="bg-healthcare-primary/10 pb-2">
        <CardTitle className="text-lg font-medium text-healthcare-primary">
          {language === "en" ? "Medications" : "Medikamente"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{language === "en" ? "Medication" : "Medikament"}</TableHead>
              <TableHead>{language === "en" ? "Dosage" : "Dosierung"}</TableHead>
              <TableHead>{language === "en" ? "Frequency" : "Häufigkeit"}</TableHead>
              <TableHead>{language === "en" ? "Start Date" : "Startdatum"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extractedData.medications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  {language === "en" ? "No medications found" : "Keine Medikamente gefunden"}
                </TableCell>
              </TableRow>
            ) : (
              extractedData.medications.map((med, index) => {
                const sourceDoc = getSourceDocument(med.sourceDocumentId);
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedMedication(med)}
                        >
                          <TableCell className="font-medium">{med.name}</TableCell>
                          <TableCell>{med.dosage || "-"}</TableCell>
                          <TableCell>{med.frequency || "-"}</TableCell>
                          <TableCell>{formatDate(med.startDate)}</TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{language === "en" ? "Source: " : "Quelle: "}
                          {sourceDoc ? (sourceDoc.file instanceof File ? sourceDoc.file.name : "Document") : "Unknown"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MedicationTable;
