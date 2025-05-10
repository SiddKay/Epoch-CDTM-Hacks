import MarkdownTable from "./MarkdownTable";

// SAMPLE DATA: Vaccine Card for Grandma
const vaccineCardMarkdown = `
| Vaccine Name      | Date Administered | Dose      | Administered At      | Next Due Date |
|-------------------|-------------------|-----------|----------------------|---------------|
| Influenza         | 2023-10-15        | 1st       | Community Clinic     | 2024-10-01    |
| Pneumococcal      | 2020-05-20        | PCV13     | General Hospital     | Lifetime      |
| Shingles (Shingrix)| 2022-03-01        | 1st of 2  | Local Pharmacy       | 2022-05-01    |
| Shingles (Shingrix)| 2022-05-05        | 2nd of 2  | Local Pharmacy       | N/A           |
| Tdap              | 2018-07-10        | Booster   | Primary Care Office  | 2028-07-01    |
`;
// END SAMPLE DATA

const VaccineCardTable = () => {
  return (
    <MarkdownTable 
      markdownContent={vaccineCardMarkdown} 
      title="Vaccine Breakdown"
      // Comment: Using sample markdown data for vaccine card
    />
  );
};

export default VaccineCardTable; 