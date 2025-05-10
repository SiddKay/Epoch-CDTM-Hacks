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
    <header className="w-full border-b border-border/40 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-3">
          <img src="/ovita_logo.png" alt="Ovita Logo" className="h-[3.75rem] w-auto" />
        </div>
        
        <div className="flex items-center space-x-4">
          {type === "patient" ? (
            <Link to="/doctor">
              <Button variant="outline">
                {t.viewDoctorDashboard}
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant="outline">
                {t.backToPatient}
              </Button>
            </Link>
          )}
          
          {/* User Avatar */}
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src="/grandma_avatar.png" alt="User Avatar" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
