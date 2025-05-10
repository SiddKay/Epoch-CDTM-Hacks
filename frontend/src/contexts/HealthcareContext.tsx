
import { createContext, Dispatch, SetStateAction } from "react";

// Define the document interface
export interface MedicalDocument {
  id: string;
  type: string;
  file: File | string;
  previewUrl: string;
  uploadDate: Date;
  extractedText?: string;
  file_path?: string;
  file_type?: string;
  file_name?: string;
}

// Define interfaces for medical reports
export interface MedicalReport {
  id: string;
  title: string;
  date: string;
  type: string;
  doctor?: string;
  content: string;
  sourceDocumentId: string;
}

// Define interface for patient visits
export interface PatientVisit {
  id: string;
  date: Date;
  doctor: string;
  reason: string;
  notes: string;
}

// Define the extracted data interface
export interface ExtractedData {
  medications: Medication[];
  vaccinations: Vaccination[];
  vitalSigns: VitalSign[];
  conditions: Condition[];
  personalInfo: PersonalInfo;
  previousReports: MedicalReport[];
  visits: PatientVisit[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
  endDate?: Date;
  sourceDocumentId: string;
}

export interface Vaccination {
  name: string;
  date: Date;
  expiryDate?: Date;
  sourceDocumentId: string;
}

export interface VitalSign {
  type: string;
  value: number;
  unit: string;
  date: Date;
  sourceDocumentId: string;
}

export interface Condition {
  name: string;
  diagnosisDate?: Date;
  status: string;
  sourceDocumentId: string;
}

export interface PersonalInfo {
  name?: string;
  dateOfBirth?: Date;
  gender?: string;
  insuranceNumber?: string;
}

// Define the context interface
export interface HealthcareContextType {
  documents: MedicalDocument[];
  setDocuments: Dispatch<SetStateAction<MedicalDocument[]>>;
  extractedData: ExtractedData;
  setExtractedData: Dispatch<SetStateAction<ExtractedData>>;
  language: "en";
  setLanguage?: Dispatch<SetStateAction<"en">>;
  user?: any; // Add user to the context
}

// Create the context
export const HealthcareContext = createContext<HealthcareContextType>({
  documents: [],
  setDocuments: () => {},
  extractedData: {
    medications: [],
    vaccinations: [],
    vitalSigns: [],
    conditions: [],
    personalInfo: {},
    previousReports: [],
    visits: [],
  },
  language: "en",
  setExtractedData: () => {},
  user: null,
});
