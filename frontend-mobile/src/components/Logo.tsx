import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <img 
        src="/ovita_logo.png" 
        alt="Ovita Logo" 
        className="h-20 w-auto" 
      />
    </div>
  );
};

export default Logo;
