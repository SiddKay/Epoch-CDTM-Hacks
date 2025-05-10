import MarkdownTable from "./MarkdownTable";

// SAMPLE DATA: Health Reports for Grandma
const healthReportsMarkdown = `
| Measurement sadswd     | Value              | Unit    | Date       | Notes                           |
|-------------------|--------------------|---------|------------|---------------------------------|
| Blood Pressure    | 130/85             | mmHg    | 2024-07-28 | Slightly elevated             |
| Heart Rate        | 72                 | bpm     | 2024-07-28 | Normal resting rate           |
| Body Temperature  | 36.8               | °C      | 2024-07-28 | Normal                        |
| Respiratory Rate  | 16                 | br/min  | 2024-07-28 | Normal                        |
| Oxygen Saturation | 97                 | %       | 2024-07-28 | Good saturation               |
| Weight            | 68                 | kg      | 2024-07-20 | Stable                        |
| Height            | 160                | cm      | 2023-01-10 | Baseline measurement          |
| Blood Glucose     | 95                 | mg/dL   | 2024-07-28 | Fasting, normal range         |
| Cholesterol (Total)| 210                | mg/dL   | 2024-05-15 | Borderline high, recommend diet |
| HDL Cholesterol   | 55                 | mg/dL   | 2024-05-15 | Good                          |
| LDL Cholesterol   | 135                | mg/dL   | 2024-05-15 | Slightly high                 |
`;
// END SAMPLE DATA

const HealthReportsTable = () => {
  return (
    <MarkdownTable 
      markdownContent={healthReportsMarkdown}
      title="Health Measurements"
      // Comment: Using sample markdown data for health reports
    />
  );
};

export default HealthReportsTable; 