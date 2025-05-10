import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Anamnese: sample data
// Befund: sample data
// Prozedur: sample data
// Diagnose: sample data
// Zusammenfassung: sample data
const patientReportMarkdown = `
## Anamnese
Mr. Kern reported chest pain during a hike a few weeks ago. The pain occurred with exertion and was described as a sharp pressure feeling in the left chest. He has a history of arterial hypertension and elevated cholesterol levels.

---

## Befund
Normal systolic LV function (EF 56%). No regional wall motion abnormalities. Normal-sized atrium. Slight mitral valve calcification. No pericardial effusion. Minimal calcification in distal RCA (Agatston Score < 25th percentile).

---

## Prozedur
Color duplex sonography of carotid arteries and CT-coronary angiography performed. Exercise stress test with early termination due to elevated blood pressure (232 mmHg).

---

## Diagnose
- Atypische Angina pectoris
- Arterielle Hypertonie
- Hypercholesterinämie
- Belastungsinduziertes Asthma (suspected)

---

## Zusammenfassung
Cardiological assessment for suspected CHD. Echocardiography and carotid ultrasound showed largely normal findings with some slight abnormalities. Recommended CSE-I therapy for LDL reduction and additional testing for Lipoprotein(a). Also recommended: lung function testing due to exercise-induced dyspnea.
`;

const PatientReportSection = () => (
  <Card>
    <CardContent className="pt-4 prose dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{patientReportMarkdown}</ReactMarkdown>
    </CardContent>
  </Card>
);

export default PatientReportSection; 