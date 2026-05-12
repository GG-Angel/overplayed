import { useAuth } from "@/hooks/auth";
import Button from "./ui/Button";
import { useLocation } from "react-router-dom";
import Avatar from "./Avatar";
import { useState } from "react";
import AvatarDropdown from "./AvatarDropdown";

const AvatarControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, redirectToLogin } = useAuth();
  const location = useLocation();

  if (!user)
    return (
      <Button variant="secondary" onClick={() => redirectToLogin(location.pathname)}>
        Log in
      </Button>
    );

  return (
    <div className="inline-flex relative">
      <Avatar user={user} onClick={() => setIsOpen((prev) => !prev)} />
      {isOpen && <AvatarDropdown className="absolute top-full right-0 mt-2 z-50 w-64" />}
    </div>
  );
};

export default AvatarControl;
