
import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, CalendarDays, Clipboard, Users } from "lucide-react";

const PatientInfoCard = () => {
  const { extractedData, language } = useContext(HealthcareContext);
  const { personalInfo } = extractedData;

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

  return (
    <Card>
      <CardHeader className="bg-healthcare-light pb-2">
        <CardTitle className="text-lg font-medium text-healthcare-dark">
          {language === "en" ? "Patient Information" : "Patienteninformation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="flex items-center space-x-3">
          <div className="bg-healthcare-primary/10 p-2 rounded-full">
            <User className="h-5 w-5 text-healthcare-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Name" : "Name"}
            </p>
            <p className="font-medium">
              {personalInfo.name || "-"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-healthcare-secondary/10 p-2 rounded-full">
            <CalendarDays className="h-5 w-5 text-healthcare-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Date of Birth / Age" : "Geburtsdatum / Alter"}
            </p>
            <p className="font-medium">
              {formatDate(personalInfo.dateOfBirth)} {personalInfo.dateOfBirth && `(${calculateAge(personalInfo.dateOfBirth)})`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-healthcare-accent/10 p-2 rounded-full">
            <Users className="h-5 w-5 text-healthcare-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Gender" : "Geschlecht"}
            </p>
            <p className="font-medium">
              {personalInfo.gender || "-"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-healthcare-warning/10 p-2 rounded-full">
            <Clipboard className="h-5 w-5 text-healthcare-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Insurance Number" : "Versicherungsnummer"}
            </p>
            <p className="font-medium">
              {personalInfo.insuranceNumber || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
