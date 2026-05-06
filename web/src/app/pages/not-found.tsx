import { useState } from "react";
import { Link } from "react-router-dom";

const kaomojis = ["(¬`‸´¬)", "(๑•̀ᗝ•́)૭", 'C(ò_ó")9', "(≖_≖ )", "(ᗜ _ ᗜ)"];

export const NotFound = () => {
  const [kaomoji] = useState(() => kaomojis[Math.floor(Math.random() * kaomojis.length)]);

  return (
    <div className="h-svh flex flex-col gap-2 justify-center text-center text-muted">
      <p className="text-4xl font-medium">{kaomoji}</p>
      <p>This page does not exist!</p>
      <Link to="/" className="mt-4 text-accent underline font-medium">
        Return to Home
      </Link>
    </div>
  );
};
