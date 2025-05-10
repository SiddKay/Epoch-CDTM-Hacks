
import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VitalSignsChart = () => {
  const { extractedData, language } = useContext(HealthcareContext);
  const [selectedVital, setSelectedVital] = useState<string>("Blood Pressure");
  
  // Get unique vital sign types
  const vitalTypes = useMemo(() => {
    return [...new Set(extractedData.vitalSigns.map(vs => vs.type))];
  }, [extractedData.vitalSigns]);

  // Format date according to language preference
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === "en" ? "en-US" : "de-DE", {
      day: "numeric",
      month: "short",
    });
  };

  // Filter vital signs by selected type
  const filteredVitals = useMemo(() => {
    return extractedData.vitalSigns
      .filter(vs => vs.type === selectedVital)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(vs => ({
        date: formatDate(vs.date),
        value: vs.value,
        unit: vs.unit,
      }));
  }, [extractedData.vitalSigns, selectedVital, language]);
  
  // Get unit for current selection
  const currentUnit = useMemo(() => {
    if (filteredVitals.length === 0) return "";
    return filteredVitals[0].unit;
  }, [filteredVitals]);

  const getStatusColor = () => {
    if (selectedVital === "Blood Pressure") {
      const latestValue = filteredVitals[filteredVitals.length - 1]?.value;
      if (latestValue >= 140) return "text-healthcare-danger";
      if (latestValue >= 120) return "text-healthcare-warning";
      return "text-healthcare-secondary";
    }
    
    if (selectedVital === "Blood Glucose") {
      const latestValue = filteredVitals[filteredVitals.length - 1]?.value;
      if (latestValue >= 126) return "text-healthcare-danger";
      if (latestValue >= 100) return "text-healthcare-warning";
      return "text-healthcare-secondary";
    }
    
    return "text-healthcare-primary";
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="bg-healthcare-accent/10 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-healthcare-accent">
            {language === "en" ? "Vital Signs" : "Vitalparameter"}
          </CardTitle>
          <Select 
            value={selectedVital}
            onValueChange={setSelectedVital}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === "en" ? "Select vital sign" : "Vitalparameter auswählen"} />
            </SelectTrigger>
            <SelectContent>
              {vitalTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filteredVitals.length > 0 && (
          <div className="flex items-center mt-2">
            <p className="text-sm font-medium mr-2">
              {language === "en" ? "Latest:" : "Aktuell:"}
            </p>
            <p className={`text-xl font-bold ${getStatusColor()}`}>
              {filteredVitals[filteredVitals.length - 1].value} {currentUnit}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 h-[300px]">
        {filteredVitals.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              {language === "en" ? "No data available" : "Keine Daten verfügbar"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredVitals}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickMargin={10}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fontSize: 12 }} 
                tickMargin={10}
                label={{ 
                  value: currentUnit, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12, fill: '#888' }
                }} 
              />
              <Tooltip 
                formatter={(value: number) => [`${value} ${currentUnit}`, selectedVital]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--healthcare-primary)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default VitalSignsChart;
