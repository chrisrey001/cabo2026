import { useState, useMemo } from "react";

export function useVoterIdentity() {
  const voterId = useMemo(() => {
    let id = localStorage.getItem("cabo26:voter_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("cabo26:voter_id", id);
    }
    return id;
  }, []);

  const [voterName, setVoterNameState] = useState(
    () => localStorage.getItem("cabo26:voter_name") || ""
  );

  const setVoterName = (name) => {
    localStorage.setItem("cabo26:voter_name", name);
    setVoterNameState(name);
  };

  return { voterId, voterName, setVoterName, hasName: voterName.length > 0 };
}
