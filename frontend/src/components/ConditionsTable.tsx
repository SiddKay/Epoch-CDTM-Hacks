
import { useContext } from "react";
import { HealthcareContext, Condition } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ConditionsTable = () => {
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

  // Find source document for a condition
  const getSourceDocument = (sourceId: string) => {
    return documents.find(doc => doc.id === sourceId);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch(status.toLowerCase()) {
      case "active":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "remission":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Translate status
  const translateStatus = (status: string) => {
    if (language === "en") return status;
    
    switch(status.toLowerCase()) {
      case "active":
        return "Aktiv";
      case "resolved":
        return "Gelöst";
      case "remission":
        return "Remission";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader className="bg-healthcare-danger/10 pb-2">
        <CardTitle className="text-lg font-medium text-healthcare-danger">
          {language === "en" ? "Medical Conditions" : "Diagnosen"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{language === "en" ? "Condition" : "Diagnose"}</TableHead>
              <TableHead>{language === "en" ? "Diagnosis Date" : "Diagnosedatum"}</TableHead>
              <TableHead>{language === "en" ? "Status" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extractedData.conditions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                  {language === "en" ? "No conditions found" : "Keine Diagnosen gefunden"}
                </TableCell>
              </TableRow>
            ) : (
              extractedData.conditions.map((condition, index) => {
                const sourceDoc = getSourceDocument(condition.sourceDocumentId);
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{condition.name}</TableCell>
                          <TableCell>{formatDate(condition.diagnosisDate)}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeColor(condition.status)}`}>
                              {translateStatus(condition.status)}
                            </span>
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

export default ConditionsTable;
