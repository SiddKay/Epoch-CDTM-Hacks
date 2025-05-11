import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const AppointmentNotice: React.FC = () => {
  return (
    <Card className="mb-6 bg-blue-action/15 border-blue-action/20">
      <div className="p-4 flex items-start gap-3">
        <div className="rounded-full bg-blue-action/20 p-2">
          <CalendarClock className="w-5 h-5 text-blue-action" />
        </div>
        <div>
          <h2 className="font-medium text-foreground mb-1">Upcoming Appointment</h2>
          <p className="text-muted-foreground text-sm">You have an appointment scheduled soon! To help your doctor prepare, please upload your relevant medical documents.</p>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentNotice;
