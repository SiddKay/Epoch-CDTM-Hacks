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
    <Card className="bg-card border-border shadow-lg rounded-lg">
      <CardHeader className="p-6 border-b border-border">
        <CardTitle className="text-blue-heading text-3xl font-semibold">
          {language === "en" ? "Patient Information" : "Patienteninformation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 prose prose-xl max-w-none 
                          prose-table:w-full 
                          prose-thead:hidden 
                          prose-th:text-blue-heading prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:text-left 
                          prose-td:py-3 prose-td:px-4 
                          prose-tr:border-b prose-tr:border-border 
                          prose-tr:last:border-b-0 
                          [&_tbody_td:first-child]:text-muted-foreground [&_tbody_td:first-child]:font-normal 
                          [&_tbody_td:nth-child(2)]:text-foreground [&_tbody_td:nth-child(2)]:font-semibold">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {samplePatientDataMarkdown}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
