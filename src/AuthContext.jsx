import React, { createContext, useContext } from "react";
import data from "./demoData.json";

// Demo build: no login. The visitor is always the seeded admin account.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{ user: data.me, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
