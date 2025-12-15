"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const router = useRouter();

<<<<<<< HEAD
  
  useEffect(() => {
=======
  useEffect(() => {
    // Check for token in cookies
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const storedToken = Cookies.get("token");
    const storedRole = Cookies.get("role");
    const storedUserId = Cookies.get("userId");

    if (storedToken && storedRole && storedUserId) {
      setToken(storedToken);
      setUser({
        id: storedUserId,
        role: storedRole
      });
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    
<<<<<<< HEAD
=======
    // Store in cookies
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    Cookies.set("token", authToken, { path: "/", secure: false, sameSite: "strict" });
    Cookies.set("role", userData.role, { path: "/", secure: false, sameSite: "strict" });
    Cookies.set("userId", userData.id, { path: "/", secure: false, sameSite: "strict" });

<<<<<<< HEAD
=======
    // Redirect based on role
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    switch (userData.role) {
      case "Super Admin":
        router.push("/superadmin");
        break;
      case "Admin":
        router.push("/admin");
        break;
      case "Student":
        router.push("/student");
        break;
      default:
        router.push("/");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
<<<<<<< HEAD
=======
    // Remove from cookies
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    Cookies.remove("token", { path: "/" });
    Cookies.remove("role", { path: "/" });
    Cookies.remove("userId", { path: "/" });
    
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
