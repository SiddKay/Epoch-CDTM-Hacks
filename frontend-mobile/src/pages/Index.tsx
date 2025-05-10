import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import Logo from '@/components/Logo';
import AppointmentNotice from '@/components/AppointmentNotice';
import NavigationFooter from '@/components/NavigationFooter';

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container px-4">
      <div className="page-header">
        <Logo />
      </div>

      <div className="pt-6 pb-16">
        <h1 className="text-3xl font-bold mb-2">Welcome</h1>
        <p className="text-muted-foreground mb-8">
          Upload and manage your medical documents
        </p>

        <AppointmentNotice />

        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate('/upload')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/reports')}
          >
            <FileText className="mr-2 h-4 w-4" />
            View My Reports
          </Button>
        </div>
      </div>

      <NavigationFooter />
    </div>
  );
};

export default Index;
