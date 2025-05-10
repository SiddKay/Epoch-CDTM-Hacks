import { useContext } from "react";
import { HealthcareContext } from "@/contexts/HealthcareContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { translations } from "@/utils/translations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";

const Header = ({ type }: { type: "patient" | "doctor" }) => {
  const { language, user } = useContext(HealthcareContext);
  const t = translations[language];

  // Get user's initials for the avatar fallback
  const getInitials = () => {
    if (user?.user_metadata) {
      const firstName = user.user_metadata.first_name || '';
      const lastName = user.user_metadata.last_name || '';
      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      }
      if (firstName) return firstName.charAt(0).toUpperCase();
      if (lastName) return lastName.charAt(0).toUpperCase();
    }
    return 'U'; // Default fallback initial
  };

  return (
    <header className="w-full border-b border-border/40 sticky top-0 z-50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="container max-w-7xl mx-auto flex items-center justify-between h-24 px-4 md:px-6">
        <div className="relative flex items-center space-x-3">
          {/* Glow effect div - positioned behind the logo */}
          <div className="absolute inset-0 -m-4 blur-2xl opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-logo-purple via-logo-purple/40 to-transparent rounded-full"></div>
          
          <Link to={type === "patient" ? "/" : "/doctor"} className="relative z-10"> {/* Ensure Link is above glow */}
            <img src="/ovita_logo.png" alt="Ovita Logo" className="h-16 md:h-20 w-auto transition-all duration-300 ease-in-out" />
          </Link>
        </div>
        
        <div className="flex items-center space-x-4 md:space-x-6">
          {type === "patient" ? (
            <Link to="/doctor">
              <Button className="bg-blue-heading border-blue-heading text-white rounded-lg shadow-md hover:bg-blue-heading/80 transition-all duration-200 px-5 py-2.5 text-sm md:text-base font-medium">
                {t.viewDoctorDashboard}
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button className="bg-blue-heading border-blue-heading text-white rounded-lg shadow-md hover:bg-blue-heading/80 transition-all duration-200 px-5 py-2.5 text-sm md:text-base font-medium">
                {t.backToPatient}
              </Button>
            </Link>
          )}
          
          <Avatar className="h-10 w-10 md:h-12 md:h-12 border-2 border-border hover:border-blue-action/50 transition-colors duration-200">
            <AvatarImage src="/grandma_avatar.png" alt="User Avatar" />
            <AvatarFallback className="bg-blue-action/20 text-blue-action font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
