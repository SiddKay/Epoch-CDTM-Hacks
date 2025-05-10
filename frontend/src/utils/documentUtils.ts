
import { MedicalDocument, ExtractedData, Medication, Vaccination, VitalSign, Condition } from "../contexts/HealthcareContext";

// Function to process uploaded documents
export const processDocument = async (file: File): Promise<MedicalDocument> => {
  // Create a unique ID for the document
  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a preview URL
  const previewUrl = URL.createObjectURL(file);
  
  // Detect document type based on file name or content
  const documentType = detectDocumentType(file.name);

  // Create the document object
  const document: MedicalDocument = {
    id,
    type: documentType,
    file,
    previewUrl,
    uploadDate: new Date(),
  };

  return document;
};

// Function to detect document type based on filename
const detectDocumentType = (filename: string): string => {
  filename = filename.toLowerCase();
  
  if (filename.includes("vacci") || filename.includes("immun")) {
    return "vaccination";
  } else if (filename.includes("lab") || filename.includes("test")) {
    return "labResult";
  } else if (filename.includes("med") || filename.includes("prescription")) {
    return "medication";
  } else if (filename.includes("insur")) {
    return "insurance";
  } else if (filename.includes("letter") || filename.includes("report")) {
    return "letter";
  }
  
  return "unknown";
};

// Mock OCR extraction for demonstration purposes
export const extractTextFromDocument = async (document: MedicalDocument): Promise<string> => {
  // In a real implementation, this would use an OCR service
  // For now, we'll return mock data based on document type
  
  switch(document.type) {
    case "vaccination":
      return "Patient: John Doe\nVaccination: COVID-19 (Pfizer)\nDate: 2022-03-15\nExpiry: 2023-03-15";
    case "labResult":
      return "Patient: John Doe\nTest: Complete Blood Count\nDate: 2022-05-20\nHemoglobin: 14.2 g/dL\nWhite Blood Cells: 7.5 x10^9/L\nPlatelets: 250 x10^9/L";
    case "medication":
      return "Patient: John Doe\nMedication: Lisinopril\nDosage: 10mg\nFrequency: Once daily\nStart: 2022-01-10";
    case "insurance":
      return "Patient: John Doe\nInsurance: HealthPlus\nNumber: ABC123456789\nValid until: 2023-12-31";
    case "letter":
      return "Dear Dr. Smith,\n\nPatient John Doe has been diagnosed with hypertension on 2022-01-10. Regular monitoring of blood pressure is recommended.\n\nBest regards,\nDr. Johnson";
    default:
      return "Could not extract text from document.";
  }
};

// Process extracted text into structured data
export const processExtractedText = (document: MedicalDocument, text: string, existingData: ExtractedData): ExtractedData => {
  const newData = { ...existingData };
  
  // Process based on document type
  switch(document.type) {
    case "vaccination":
      const vaccine = extractVaccinationData(text, document.id);
      if (vaccine) {
        newData.vaccinations = [...newData.vaccinations, vaccine];
      }
      break;
    case "medication":
      const medication = extractMedicationData(text, document.id);
      if (medication) {
        newData.medications = [...newData.medications, medication];
      }
      break;
    case "labResult":
      const vitalSigns = extractVitalSignsData(text, document.id);
      if (vitalSigns.length) {
        newData.vitalSigns = [...newData.vitalSigns, ...vitalSigns];
      }
      break;
    case "letter":
      const conditions = extractConditionsData(text, document.id);
      if (conditions.length) {
        newData.conditions = [...newData.conditions, ...conditions];
      }
      
      // Add to previous reports
      if (!newData.previousReports) {
        newData.previousReports = [];
      }
      
      newData.previousReports.push({
        id: document.id,
        title: "Doctor's Letter",
        date: new Date().toISOString().split('T')[0],
        content: text,
        type: "letter",
        sourceDocumentId: document.id
      });
      break;
    case "insurance":
      // Extract insurance info
      const nameMatch = text.match(/Patient: (.+)/);
      const insuranceNumberMatch = text.match(/Number: (.+)/);
      
      if (nameMatch && nameMatch[1]) {
        newData.personalInfo = {
          ...newData.personalInfo,
          name: nameMatch[1]
        };
      }
      
      if (insuranceNumberMatch && insuranceNumberMatch[1]) {
        newData.personalInfo = {
          ...newData.personalInfo,
          insuranceNumber: insuranceNumberMatch[1]
        };
      }
      break;
  }
  
  return newData;
};

// Helper functions to extract structured data from text
const extractVaccinationData = (text: string, documentId: string): Vaccination | null => {
  const nameMatch = text.match(/Vaccination: (.+)/);
  const dateMatch = text.match(/Date: (.+)/);
  
  if (nameMatch && dateMatch) {
    return {
      name: nameMatch[1],
      date: new Date(dateMatch[1]),
      expiryDate: text.includes('Expiry') ? new Date(text.match(/Expiry: (.+)/)?.[1] || '') : undefined,
      sourceDocumentId: documentId
    };
  }
  
  return null;
};

const extractMedicationData = (text: string, documentId: string): Medication | null => {
  const nameMatch = text.match(/Medication: (.+)/);
  const dosageMatch = text.match(/Dosage: (.+)/);
  const frequencyMatch = text.match(/Frequency: (.+)/);
  
  if (nameMatch) {
    return {
      name: nameMatch[1],
      dosage: dosageMatch ? dosageMatch[1] : '',
      frequency: frequencyMatch ? frequencyMatch[1] : '',
      startDate: text.includes('Start') ? new Date(text.match(/Start: (.+)/)?.[1] || '') : undefined,
      sourceDocumentId: documentId
    };
  }
  
  return null;
};

const extractVitalSignsData = (text: string, documentId: string): VitalSign[] => {
  const vitalSigns: VitalSign[] = [];
  const dateMatch = text.match(/Date: (.+)/);
  const date = dateMatch ? new Date(dateMatch[1]) : new Date();
  
  // Extract hemoglobin
  const hemoglobinMatch = text.match(/Hemoglobin: (\d+\.?\d*) (\w+\/?\w*)/);
  if (hemoglobinMatch) {
    vitalSigns.push({
      type: 'Hemoglobin',
      value: parseFloat(hemoglobinMatch[1]),
      unit: hemoglobinMatch[2],
      date,
      sourceDocumentId: documentId
    });
  }
  
  // Extract WBC
  const wbcMatch = text.match(/White Blood Cells: (\d+\.?\d*) (\w+\/?\w*)/);
  if (wbcMatch) {
    vitalSigns.push({
      type: 'White Blood Cells',
      value: parseFloat(wbcMatch[1]),
      unit: wbcMatch[2],
      date,
      sourceDocumentId: documentId
    });
  }
  
  // Extract platelets
  const plateletsMatch = text.match(/Platelets: (\d+\.?\d*) (\w+\/?\w*)/);
  if (plateletsMatch) {
    vitalSigns.push({
      type: 'Platelets',
      value: parseFloat(plateletsMatch[1]),
      unit: plateletsMatch[2],
      date,
      sourceDocumentId: documentId
    });
  }
  
  return vitalSigns;
};

const extractConditionsData = (text: string, documentId: string): Condition[] => {
  const conditions: Condition[] = [];
  const diagnosisMatch = text.match(/diagnosed with (.+?) on (.+?)\./);
  
  if (diagnosisMatch) {
    conditions.push({
      name: diagnosisMatch[1],
      diagnosisDate: new Date(diagnosisMatch[2]),
      status: 'Active',
      sourceDocumentId: documentId
    });
  }
  
  return conditions;
};

// Generate sample patient data for demonstration
export const generateSampleData = (): ExtractedData => {
  // Sample data - replace with real data after OCR processing
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  
  // Create dates for the last 7 days for glucose readings
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();
  
  // Create dates for the last 6 months for visits
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();
  
  return {
    medications: [
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: new Date(2022, 0, 10),
        sourceDocumentId: "sample_med_1"
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: new Date(2021, 5, 15),
        sourceDocumentId: "sample_med_2"
      },
      {
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily at bedtime",
        startDate: new Date(2021, 8, 22),
        sourceDocumentId: "sample_med_3"
      }
    ],
    vaccinations: [
      {
        name: "COVID-19 (Pfizer)",
        date: new Date(2022, 2, 15),
        expiryDate: new Date(2023, 2, 15),
        sourceDocumentId: "sample_vac_1"
      },
      {
        name: "Influenza",
        date: new Date(2021, 9, 5),
        sourceDocumentId: "sample_vac_2"
      },
      {
        name: "Tetanus",
        date: new Date(2018, 4, 12),
        expiryDate: new Date(2028, 4, 12),
        sourceDocumentId: "sample_vac_3"
      },
      {
        name: "Pneumonia",
        date: new Date(2020, 7, 23),
        sourceDocumentId: "sample_vac_4"
      },
      {
        name: "Hepatitis B",
        date: new Date(2015, 3, 8),
        sourceDocumentId: "sample_vac_5"
      }
    ],
    vitalSigns: [
      // Blood pressure readings
      {
        type: "Blood Pressure",
        value: 140,
        unit: "mmHg",
        date: today,
        sourceDocumentId: "sample_vs_1"
      },
      {
        type: "Blood Pressure",
        value: 145,
        unit: "mmHg",
        date: lastMonth,
        sourceDocumentId: "sample_vs_2"
      },
      {
        type: "Blood Pressure",
        value: 138,
        unit: "mmHg",
        date: new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000),
        sourceDocumentId: "sample_vs_3"
      },
      {
        type: "Blood Pressure",
        value: 142,
        unit: "mmHg",
        date: new Date(lastMonth.getTime() - 60 * 24 * 60 * 60 * 1000),
        sourceDocumentId: "sample_vs_4"
      },
      
      // Daily glucose readings for the last 7 days
      ...last7Days.map((date, index) => ({
        type: "Blood Glucose",
        value: 100 + Math.floor(Math.random() * 30), // Random between 100-130
        unit: "mg/dL",
        date: new Date(date),
        sourceDocumentId: `sample_glucose_${index}`
      })),
      
      // ECG readings
      ...last7Days.map((date, index) => ({
        type: "Heart Rate",
        value: 70 + Math.floor(Math.random() * 15), // Random between 70-85
        unit: "BPM",
        date: new Date(date),
        sourceDocumentId: `sample_ecg_${index}`
      })),
    ],
    conditions: [
      {
        name: "Hypertension",
        diagnosisDate: new Date(2022, 0, 10),
        status: "Active",
        sourceDocumentId: "sample_cond_1"
      },
      {
        name: "Type 2 Diabetes",
        diagnosisDate: new Date(2021, 5, 15),
        status: "Active",
        sourceDocumentId: "sample_cond_2"
      },
      {
        name: "Hyperlipidemia",
        diagnosisDate: new Date(2021, 8, 22),
        status: "Active",
        sourceDocumentId: "sample_cond_3"
      }
    ],
    personalInfo: {
      name: "John Doe",
      dateOfBirth: new Date(1975, 5, 15),
      gender: "Male",
      insuranceNumber: "ABC123456789"
    },
    visits: last6Months.map((date, index) => ({
      id: `visit_${index}`,
      date: new Date(date),
      doctor: "Dr. Sarah Johnson",
      reason: index % 2 === 0 ? "Regular checkup" : "Follow-up",
      notes: "Patient reported feeling well."
    })),
    previousReports: [
      {
        id: "report1",
        title: "Annual Physical Examination",
        date: "2023-04-15",
        type: "physical",
        doctor: "Dr. Sarah Johnson",
        content: "Patient appears healthy and well. Blood pressure: 120/80 mmHg. Heart rate: 72 BPM.",
        sourceDocumentId: "sample_doc_1"
      },
      {
        id: "report2",
        title: "Blood Test Results",
        date: "2023-03-22",
        type: "lab",
        doctor: "Lab Corp",
        content: "Cholesterol: 185 mg/dL. Glucose: 95 mg/dL. All values within normal range.",
        sourceDocumentId: "sample_doc_2"
      },
      {
        id: "report3",
        title: "Cardiology Consultation",
        date: "2023-02-10",
        type: "specialist",
        doctor: "Dr. Robert Chen, Cardiologist",
        content: "Patient has mild hypertension. No signs of cardiac abnormalities.",
        sourceDocumentId: "sample_doc_3"
      },
      {
        id: "report4",
        title: "X-Ray Report - Chest",
        date: "2023-01-05",
        type: "imaging",
        doctor: "Regional Medical Imaging",
        content: "No abnormalities detected in chest. Lungs appear clear.",
        sourceDocumentId: "sample_doc_4"
      }
    ]
  };
};
