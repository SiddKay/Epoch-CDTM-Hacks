
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Upload, FileText } from 'lucide-react';

const NavigationFooter: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `flex flex-col items-center px-4 py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
        }
        end
      >
        <Home size={20} />
        <span className="text-xs mt-1">Home</span>
      </NavLink>
      <NavLink 
        to="/upload" 
        className={({ isActive }) => 
          `flex flex-col items-center px-4 py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
        }
      >
        <Upload size={20} />
        <span className="text-xs mt-1">Upload</span>
      </NavLink>
      <NavLink 
        to="/reports" 
        className={({ isActive }) => 
          `flex flex-col items-center px-4 py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
        }
      >
        <FileText size={20} />
        <span className="text-xs mt-1">Reports</span>
      </NavLink>
    </div>
  );
};

export default NavigationFooter;
