
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import NavigationFooter from '@/components/NavigationFooter';

// Mock data for reports
const MOCK_REPORTS = [
  { id: '1', name: 'Lab Results - Annual Checkup', date: '2023-05-15', type: 'pdf', doctor: 'Dr. Johnson' },
  { id: '2', name: 'Cardiology Consult Notes', date: '2023-03-02', type: 'pdf', doctor: 'Dr. Smith' },
  { id: '3', name: 'Vaccination Certificate', date: '2022-11-10', type: 'image', doctor: 'Dr. Williams' },
];

const ReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const report = MOCK_REPORTS.find(r => r.id === id);
  
  if (!report) {
    return (
      <div className="app-container p-4 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-2">Report Not Found</h1>
        <p className="text-muted-foreground mb-4">The requested report could not be found.</p>
        <Button onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <Logo />
      </div>
      
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">{report.name}</h1>
        <p className="text-muted-foreground mb-4">Issued on {report.date} by {report.doctor}</p>
        
        {/* Document preview placeholder */}
        <div className="bg-secondary/30 rounded-lg p-4 mb-4 h-80 flex items-center justify-center">
          {report.type === 'image' ? (
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-muted-foreground mt-2">Image Preview</p>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-muted-foreground mt-2">PDF Preview</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="flex-1">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      <NavigationFooter />
    </div>
  );
};

export default ReportDetail;
