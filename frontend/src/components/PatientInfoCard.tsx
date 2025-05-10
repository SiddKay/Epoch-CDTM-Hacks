import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { User, CalendarDays, Clipboard, Users } from "lucide-react"; // REMOVED: Icons are not used in Markdown rendering
import ReactMarkdown from 'react-markdown'; // ADDED
import remarkGfm from 'remark-gfm'; // ADDED

// SAMPLE DATA for Doctor Dashboard (remains the source of truth)
const samplePatientData = {
  name: "Grandma",
  dateOfBirth: new Date("1955-07-15"),
  gender: "Female",
  insuranceNumber: "INS-GRDMA-19550715",
};
// END SAMPLE DATA

const PatientInfoCard = () => {
  const { language } = useContext(HealthcareContext);
  // const { extractedData } = useContext(HealthcareContext);
  // const { personalInfo } = extractedData;

  // Use sample data instead of context data
  const personalInfo = samplePatientData;

  // Format date according to language preference
  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return date.toLocaleDateString(language === "en" ? "en-US" : "de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: Date) => {
    if (!dateOfBirth) return "-";
    
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Create Markdown string from samplePatientData
  // This data will be rendered as a list. Icons and the original 2x2 grid are simplified.
  const patientInfoMarkdown = `
*   **${language === "en" ? "Name" : "Name"}**: ${personalInfo.name || "-"}
*   **${language === "en" ? "Gender" : "Geschlecht"}**: ${personalInfo.gender || "-"}
*   **${language === "en" ? "Date of Birth / Age" : "Geburtsdatum / Alter"}**: ${formatDate(personalInfo.dateOfBirth)} ${personalInfo.dateOfBirth ? `(${calculateAge(personalInfo.dateOfBirth)})` : ''}
*   **${language === "en" ? "Insurance Number" : "Versicherungsnummer"}**: ${personalInfo.insuranceNumber || "-"}
  `;
  // END COMMENT: Sample data usage

  return (
    <Card>
      <CardHeader className="bg-muted pb-2">
        <CardTitle className="text-lg font-medium text-healthcare-dark">
          {language === "en" ? "Patient Information" : "Patienteninformation"}
        </CardTitle>
      </CardHeader>
      {/* MODIFIED CardContent to use ReactMarkdown for patient details */}
      <CardContent className="pt-4 prose dark:prose-invert max-w-none">
        {/* Comment: Patient details are rendered from a Markdown string. */}
        {/* This simplifies the layout compared to the original version with icons and a 2x2 grid. */}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {patientInfoMarkdown}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
