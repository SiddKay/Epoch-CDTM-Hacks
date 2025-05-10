
import { useContext, useState } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const GlucoseTrendChart = () => {
  const { extractedData } = useContext(HealthcareContext);
  
  // Sample data - replace with real data after OCR processing
  const data = [
    { date: 'Mon', glucose: 95, ecg: 72 },
    { date: 'Tue', glucose: 102, ecg: 75 },
    { date: 'Wed', glucose: 110, ecg: 78 },
    { date: 'Thu', glucose: 105, ecg: 76 },
    { date: 'Fri', glucose: 98, ecg: 74 },
    { date: 'Sat', glucose: 120, ecg: 80 },
    { date: 'Sun', glucose: 115, ecg: 78 },
  ];

  const config = {
    glucose: { label: 'Glucose', color: '#f59e0b' },
    ecg: { label: 'Heart Rate', color: '#ef4444' },
  };

  // Render different colored regions based on glucose values
  const renderGlucoseBackground = () => {
    // Define the height of the chart and y-axis domain
    const height = 320;
    const min = 70;
    const max = 140;
    const range = max - min;
    
    // Calculate position of colored bands
    const normalTop = ((140 - min) / range) * height;
    const normalHeight = ((140 - 70) / range) * height;
    const highTop = 0;
    const highHeight = ((140 - 126) / range) * height;
    const lowTop = ((70 - min) / range) * height;
    const lowHeight = ((126 - 70) / range) * height;
    
    return (
      <g className="glucose-reference">
        {/* High band */}
        <rect x={60} y={highTop} width="85%" height={highHeight} fill="#ef444420" />
        
        {/* Normal band */}
        <rect x={60} y={normalTop - normalHeight} width="85%" height={normalHeight} fill="#22c55e20" />
        
        {/* Low band */}
        <rect x={60} y={lowTop} width="85%" height={lowHeight} fill="#f59e0b20" />
      </g>
    );
  };

  return (
    <Card className="h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Glucose & ECG Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[320px]">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              {renderGlucoseBackground()}
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickMargin={10}
                domain={[70, 140]}
                label={{ 
                  value: 'mg/dL', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'var(--foreground)', fontSize: 12, opacity: 0.7 }
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickMargin={10}
                domain={[60, 100]}
                label={{ 
                  value: 'BPM', 
                  angle: -90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fill: 'var(--foreground)', fontSize: 12, opacity: 0.7 }
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => {
                      if (name === 'glucose') return [`${value} mg/dL`, 'Glucose'];
                      if (name === 'ecg') return [`${value} BPM`, 'Heart Rate'];
                      return [value, name];
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="glucose"
                stroke="#f59e0b"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 4 }}
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="ecg"
                stroke="#ef4444"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 4 }}
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default GlucoseTrendChart;
