// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { loginAPI, signupAPI } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

 
  useEffect(() => {
    if (!token) {
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
  setIsLoading(true);
  setError(null);

  try {
    const data = await loginAPI(email, password);

    // 1) Get token
    const newToken = data.token || data.access_token;
    if (!newToken) {
      throw new Error("No token in login response");
    }

    // 2) Extract user info
    const userPayload = data.user || data;
    const userId = userPayload.user_id || userPayload.id;
    const username = userPayload.username;
    const emailFromApi = userPayload.email || email;

    // 3) Store token
    localStorage.setItem("token", newToken);
    if (userId) {
      localStorage.setItem("userId", String(userId));
    }

    const userObj = userId
      ? { id: userId, username, email: emailFromApi }
      : null;

    if (userObj) {
      localStorage.setItem("user", JSON.stringify(userObj));
    }

    // 4) Update React
    setToken(newToken);
    setUser(userObj);

    return true;
  } catch (err) {
    console.error("login error:", err);
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      "Login failed";
    setError(msg);
    return false;
  } finally {
    setIsLoading(false);
  }
};


  const signup = async (form) => {
    setIsLoading(true);
    setError(null);
    try {
     
      await signupAPI(form);
      
      const ok = await login(form.email, form.password);
      return ok;
    } catch (err) {
      console.error("signup error:", err);
      setError(err?.response?.data?.error || "Signup failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    token,
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
