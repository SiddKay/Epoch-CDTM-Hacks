
import { useContext } from "react";
import { HealthcareContext, Vaccination } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X } from "lucide-react";

const VaccinationTable = () => {
  const { extractedData, documents, language } = useContext(HealthcareContext);

  // Format date according to language preference
  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return date.toLocaleDateString(language === "en" ? "en-US" : "de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Check if a vaccination is currently valid
  const isVaccinationValid = (vaccination: Vaccination): boolean => {
    if (!vaccination.expiryDate) return true; // No expiry date means always valid
    const today = new Date();
    return today <= vaccination.expiryDate;
  };

  // Find source document for a vaccination
  const getSourceDocument = (sourceId: string) => {
    return documents.find(doc => doc.id === sourceId);
  };

  return (
    <Card>
      <CardHeader className="bg-healthcare-secondary/10 pb-2">
        <CardTitle className="text-lg font-medium text-healthcare-secondary">
          {language === "en" ? "Vaccinations" : "Impfungen"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{language === "en" ? "Vaccination" : "Impfung"}</TableHead>
              <TableHead>{language === "en" ? "Date" : "Datum"}</TableHead>
              <TableHead>{language === "en" ? "Expiry" : "Ablaufdatum"}</TableHead>
              <TableHead>{language === "en" ? "Status" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extractedData.vaccinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  {language === "en" ? "No vaccinations found" : "Keine Impfungen gefunden"}
                </TableCell>
              </TableRow>
            ) : (
              extractedData.vaccinations.map((vacc, index) => {
                const valid = isVaccinationValid(vacc);
                const sourceDoc = getSourceDocument(vacc.sourceDocumentId);
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{vacc.name}</TableCell>
                          <TableCell>{formatDate(vacc.date)}</TableCell>
                          <TableCell>{formatDate(vacc.expiryDate)}</TableCell>
                          <TableCell>
                            {valid ? (
                              <div className="flex items-center">
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                                  <Check className="w-3 h-3 mr-1" />
                                  {language === "en" ? "Valid" : "Gültig"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                                  <X className="w-3 h-3 mr-1" />
                                  {language === "en" ? "Expired" : "Abgelaufen"}
                                </span>
                              </div>
                            )}
                          </TableCell>
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

export default VaccinationTable;
