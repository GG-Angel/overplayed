import Button from "./ui/Button";
import { useLocation } from "react-router-dom";
import Avatar from "./Avatar";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AvatarDropdown from "./AvatarDropdown";
import useAuth from "@/hooks/useAuth";
import useClickOutside from "@/hooks/useClickOutside";

const AvatarControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, redirectToLogin } = useAuth();
  const location = useLocation();

  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  if (!user)
    return (
      <Button variant="secondary" onClick={() => redirectToLogin(location.pathname)}>
        Log in
      </Button>
    );

  return (
    <div ref={containerRef} className="inline-flex relative">
      <Avatar user={user} onClick={() => setIsOpen((prev) => !prev)} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full right-0 mt-2 z-50 w-64"
          >
            <AvatarDropdown />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarControl;
