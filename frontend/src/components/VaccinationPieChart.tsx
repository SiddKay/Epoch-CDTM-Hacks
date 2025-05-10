
import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const VaccinationPieChart = () => {
  const { extractedData } = useContext(HealthcareContext);

  // Sample data - replace with real data after OCR processing
  const sampleData = [
    { name: 'COVID-19', value: 2, color: '#0ea5e9' },
    { name: 'Influenza', value: 1, color: '#8b5cf6' },
    { name: 'Hepatitis B', value: 1, color: '#22c55e' },
    { name: 'Tetanus', value: 1, color: '#ef4444' },
    { name: 'Pneumonia', value: 1, color: '#f59e0b' }
  ];

  const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b', '#ec4899'];

  const config = {
    covid: { label: 'COVID-19', color: '#0ea5e9' },
    influenza: { label: 'Influenza', color: '#8b5cf6' },
    hepatitis: { label: 'Hepatitis B', color: '#22c55e' },
    tetanus: { label: 'Tetanus', color: '#ef4444' },
    pneumonia: { label: 'Pneumonia', color: '#f59e0b' },
    other: { label: 'Other', color: '#ec4899' },
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Vaccination Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[320px] flex justify-center">
        <ChartContainer config={config} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sampleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={(entry) => entry.name}
              >
                {sampleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(value, name) => [`${value} doses`, name]} />
                }
              />
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default VaccinationPieChart;
