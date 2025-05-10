
import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// SAMPLE DATA for Doctor Dashboard (remains the source of truth)
const samplePatientDataMarkdown = `
| Field             | Value              |
|-------------------|--------------------|
| Name              | Grandma            |
| Date of Birth     | 1955-07-15        |
| Gender            | Female            |
| Insurance Number  | INS-GRDMA-19550715 |
`;

const PatientInfoCard = () => {
  const { language } = useContext(HealthcareContext);

  return (
    <Card className="bg-[#1A1F2C] border-0 shadow-lg">
      <CardHeader className="bg-muted pb-2">
        <CardTitle className="text-[#8b5cf6] text-xl">
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
