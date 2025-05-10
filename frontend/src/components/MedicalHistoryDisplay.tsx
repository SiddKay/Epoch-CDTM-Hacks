import MarkdownTable from "./MarkdownTable";

// SAMPLE DATA: Medical History for Grandma
const significantIllnessesMarkdown = `
| Condition         | Diagnosed Date | Status      | Notes                                  |
|-------------------|----------------|-------------|----------------------------------------|
| Hypertension      | 2010-06-15     | Controlled  | Managed with medication (Lisinopril)   |
| Osteoarthritis    | 2015-02-01     | Chronic     | Affects knees, manages with exercise   |
| Appendectomy      | 1985-11-20     | Resolved    | Surgical removal, no complications     |
`;

const previousVisitsMarkdown = `
| Date       | Reason for Visit      | Doctor          | Location             | Summary Notes                            |
|------------|-----------------------|-----------------|----------------------|------------------------------------------|
| 2024-05-15 | Annual Check-up       | Dr. Smith       | General Hospital     | Routine exam, blood tests ordered.       |
| 2024-01-10 | Knee pain follow-up   | Dr. Placeholder | Ortho Clinic         | Discussed pain management options.     |
| 2023-10-15 | Flu Shot              | Nurse Practitioner| Community Clinic     | Received annual influenza vaccine.       |
`;
// END SAMPLE DATA

const MedicalHistoryDisplay = () => {
  return (
    <div className="space-y-6">
      <MarkdownTable 
        markdownContent={significantIllnessesMarkdown} 
        // title removed, handled by dropdown
      />
      <MarkdownTable 
        markdownContent={previousVisitsMarkdown} 
        // title removed, handled by dropdown
      />
    </div>
  );
};

export default MedicalHistoryDisplay; 