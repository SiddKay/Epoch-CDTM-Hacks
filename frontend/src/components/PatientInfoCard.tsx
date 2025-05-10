import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { User, CalendarDays, Clipboard, Users } from "lucide-react"; // REMOVED: Icons are not used in Markdown rendering
import ReactMarkdown from 'react-markdown'; // ADDED
import remarkGfm from 'remark-gfm'; // ADDED

// SAMPLE DATA for Doctor Dashboard (remains the source of truth)
const samplePatientDataMarkdown = `
| Field             | Value              |
|-------------------|--------------------|
| Name              | Grandma            |
| Date of Birth     | 1955-07-15        |
| Gender            | Female            |
| Insurance Number  | INS-GRDMA-19550715 |
`;
// END SAMPLE DATA

const PatientInfoCard = () => {
  const { language } = useContext(HealthcareContext);

  return (
    <Card>
      <CardHeader className="bg-muted pb-2">
        <CardTitle className="text-lg font-medium text-healthcare-dark">
          {language === "en" ? "Patient Information" : "Patienteninformation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {samplePatientDataMarkdown}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
