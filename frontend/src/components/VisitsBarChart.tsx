
import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const VisitsBarChart = () => {
  const { extractedData } = useContext(HealthcareContext);

  // Sample data - replace with real data after OCR processing
  const data = [
    { month: 'Jan', visits: 2, color: '#0ea5e9' },
    { month: 'Feb', visits: 1, color: '#0ea5e9' },
    { month: 'Mar', visits: 3, color: '#0ea5e9' },
    { month: 'Apr', visits: 2, color: '#0ea5e9' },
    { month: 'May', visits: 0, color: '#0ea5e9' },
    { month: 'Jun', visits: 1, color: '#0ea5e9' },
  ];

  const config = {
    visits: { label: 'Visits', color: '#0ea5e9' },
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Patient Visits (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[320px]">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={10} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickMargin={10}
                domain={[0, 'dataMax + 1']}
                allowDecimals={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => [`${value} visits`, 'Visits']} />}
              />
              <Bar
                dataKey="visits"
                name="Visits"
                fill="var(--healthcare-primary)"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default VisitsBarChart;
