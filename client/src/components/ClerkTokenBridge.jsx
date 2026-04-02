import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setClerkTokenGetter } from "../lib/clerkToken.js";

export default function ClerkTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}
