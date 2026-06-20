import { useBlocker } from "react-router-dom";

const useNavBlocker = (when: boolean, allowedPathPrefix: string) => {
  return useBlocker(
    ({ nextLocation }) => when && !nextLocation.pathname.startsWith(allowedPathPrefix)
  );
};

export default useNavBlocker;
