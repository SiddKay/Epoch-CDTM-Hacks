
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';
import ReportItem, { ReportType } from '@/components/ReportItem';
import NavigationFooter from '@/components/NavigationFooter';

// Mock data for reports
const MOCK_REPORTS: ReportType[] = [
  { id: '1', name: 'Lab Results - Annual Checkup', date: '2023-05-15', type: 'pdf' },
  { id: '2', name: 'Cardiology Consult Notes', date: '2023-03-02', type: 'pdf' },
  { id: '3', name: 'Vaccination Certificate', date: '2022-11-10', type: 'image' },
];

const ViewReports: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="page-header">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <Logo />
      </div>
      
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">My Reports</h1>
        
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-10"
          />
        </div>
        
        <div className="border rounded-lg border-border overflow-hidden">
          {MOCK_REPORTS.map((report) => (
            <ReportItem key={report.id} report={report} />
          ))}
        </div>
      </div>
      
      <NavigationFooter />
    </div>
  );
};

export default ViewReports;
