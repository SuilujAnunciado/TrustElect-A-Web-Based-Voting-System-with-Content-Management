"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import stiLogo from "../../assets/sti_logo.png";

export default function LoginForm({ onClose }) {
  const API_URL = '';
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const COOLDOWN_SECONDS = 120; 

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); 

  const [useSmsOtp, setUseSmsOtp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsOtp, setSmsOtp] = useState("");
  const [smsDevOtp, setSmsDevOtp] = useState("");
  const [smsResendLoading, setSmsResendLoading] = useState(false);
  const [smsResendMessage, setSmsResendMessage] = useState("");
  const [smsCooldownActive, setSmsCooldownActive] = useState(false);
  const [smsCooldownTime, setSmsCooldownTime] = useState(0);
  
  // Phone registration for first-time login
  const [registerPhoneNumber, setRegisterPhoneNumber] = useState("");
  
  // OTP visibility states
  const [showOtp, setShowOtp] = useState(false);
  const [showSmsOtp, setShowSmsOtp] = useState(false);
  const [showResetOtp, setShowResetOtp] = useState(false);
  
  // Transient visibility for OTP fields (show briefly, then mask)
  const [otpTransientVisible, setOtpTransientVisible] = useState(false);
  const [smsOtpTransientVisible, setSmsOtpTransientVisible] = useState(false);
  const [resetOtpTransientVisible, setResetOtpTransientVisible] = useState(false);
  const otpRevealTimeoutRef = useRef(null);
  const smsOtpRevealTimeoutRef = useRef(null);
  const resetOtpRevealTimeoutRef = useRef(null);
  
  const router = useRouter();

  const handleLoginKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleOtpKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleOtpVerification();
    }
  };

  const handlePasswordChangeKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handlePasswordChange();
    }
  };

  const handleForgotPasswordKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleForgotPassword();
    }
  };

  const handleResetOtpKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleVerifyResetOTP();
    }
  };

  const handleResetPasswordKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleResetPassword();
    }
  };


  const handleSmsOtpKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSmsOtpVerification();
    }
  };

  // Global keyboard event handler
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        
        // Determine which action to take based on current step and resetStep
        if (step === 1) {
          handleLogin();
        } else if (step === 2) {
          if (useSmsOtp) {
            if (smsOtp.length === 6) {
              handleSmsOtpVerification();
            } else {
              handleSendSmsOtp();
            }
          } else {
            handleOtpVerification();
          }
        } else if (step === 3) {
          handlePasswordChange();
        } else if (step === 4) {
          if (resetStep === 1) {
            handleForgotPassword();
          } else if (resetStep === 2) {
            handleVerifyResetOTP();
          } else if (resetStep === 3) {
            handleResetPassword();
          }
        }
      }
    };

    // Add global event listener
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [step, resetStep, loading, email, password, otp, newPassword, confirmPassword, 
      forgotEmail, resetOtp, resetPassword, confirmResetPassword, useSmsOtp, 
      phoneNumber, smsOtp]);
  
  // Cooldown timer effect
  useEffect(() => {
    let interval;
    if (cooldownActive && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setCooldownActive(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldownTime]);

  // SMS cooldown timer effect
  useEffect(() => {
    let interval;
    if (smsCooldownActive && smsCooldownTime > 0) {
      interval = setInterval(() => {
        setSmsCooldownTime((prev) => {
          if (prev <= 1) {
            setSmsCooldownActive(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [smsCooldownActive, smsCooldownTime]);

  // Cleanup reveal timers on unmount
  useEffect(() => {
    return () => {
      if (otpRevealTimeoutRef.current) clearTimeout(otpRevealTimeoutRef.current);
      if (smsOtpRevealTimeoutRef.current) clearTimeout(smsOtpRevealTimeoutRef.current);
      if (resetOtpRevealTimeoutRef.current) clearTimeout(resetOtpRevealTimeoutRef.current);
    };
  }, []);

  const handleLogin = async () => {
    setError("");
    setDevOtp("");
    setResendMessage("");

    if (!email.endsWith("@novaliches.sti.edu.ph") && !email.endsWith("@novaliches.sti.edu")) {
      setError("Please enter a valid STI email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // Updated: same-origin path + credentials
      const response = await axios.post(
        `/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (!response.data.user_id) {
        throw new Error("Missing user_id in response.");
      }
      
      const { token, role, user_id, studentId } = response.data;

      Cookies.set("token", token, { expires: 1, path: "/", secure: false, sameSite: "lax" });
      Cookies.set("role", role, { expires: 1, path: "/", secure: false, sameSite: "strict" });
      Cookies.set("email", email, { expires: 1, path: "/", secure: false, sameSite: "strict" });
      Cookies.set("userId", user_id, { expires: 1, path: "/", secure: false, sameSite: "strict" });
      
      if (studentId) {
        Cookies.set("studentId", studentId.toString(), { expires: 1, path: "/", secure: false, sameSite: "strict" });
        localStorage.setItem("studentId", studentId.toString());
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);
      localStorage.setItem("userId", user_id);

      // Updated: same-origin path + credentials
      const otpResponse = await axios.post(
        `/api/auth/request-otp`,
        { userId: user_id, email },
        { withCredentials: true }
      );

      if (otpResponse.data.devMode && otpResponse.data.otp) {
        setDevOtp(otpResponse.data.otp);
      }

      setCooldownActive(true);
      setCooldownTime(COOLDOWN_SECONDS);
      
      setStep(2); 
    } catch (err) {
      if (err.response && err.response.status === 401) {
        
        if (email.includes("admin") || email.includes("superadmin")) {
          setError("Invalid Email or Password.");
        } else {
          setError("Invalid email or password.");
        }
      } else {
        console.error("Login error:", err);
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (otp.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const userId = Cookies.get("userId");

      // Updated: same-origin path + credentials
      const response = await axios.post(
        `/api/auth/verify-otp`,
        { userId, otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        const role = Cookies.get("role");

        if (role !== "Super Admin") {
          try {
            const token = Cookies.get("token");
            // Updated: same-origin path
            const firstLoginCheckResponse = await axios.get(
              `/api/auth/check-first-login`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                },
                withCredentials: true
              }
            );
            
            if (firstLoginCheckResponse.data.isFirstLogin) {
              setIsFirstLogin(true);
              setStep(3);
              return;
            }
          } catch (firstLoginCheckError) {
            console.error("Error checking first login status:", firstLoginCheckError);
          }
        }

        navigateToDashboard(role);
      } else {
        throw new Error("Verification failed. Please try again.");
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError("Invalid verification code. Please check and try again.");
      } else if (err.response && err.response.status === 401) {
        setError("Verification code has expired or already been used. Please request a new one.");
      } else {
        setError(err.response?.data?.message || "Invalid verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check if phone number is provided
    if (!registerPhoneNumber.trim()) {
      setError("Phone number is required. Please enter your phone number to continue.");
      return;
    }
    
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const userId = Cookies.get("userId");
      const userEmail = Cookies.get("email");
      
      // First register the phone number
      let normalizedPhone = registerPhoneNumber.replace(/\s/g, '');
      if (normalizedPhone.startsWith('09')) {
        normalizedPhone = '+63' + normalizedPhone.substring(1);
      } else if (normalizedPhone.startsWith('63')) {
        normalizedPhone = '+' + normalizedPhone;
      } else if (!normalizedPhone.startsWith('+63')) {
        normalizedPhone = '+63' + normalizedPhone;
      }

      // Validate phone number format
      const phoneRegex = /^(\+63|63|0)?[9]\d{9}$/;
      if (!phoneRegex.test(normalizedPhone.replace(/\s/g, ''))) {
        setError("Please enter a valid Philippines phone number (e.g., +639123456789 or 09123456789).");
        setLoading(false);
        return;
      }

      // Register phone number
      const phoneResponse = await axios.post(
        `/api/auth/register-phone`,
        { userId, email: userEmail, phoneNumber: normalizedPhone },
        { withCredentials: true }
      );

      if (!phoneResponse.data.success) {
        setError(phoneResponse.data.message || "Failed to register phone number. Please try again.");
        setLoading(false);
        return;
      }
      
      // Then change the password
      const response = await axios.post(
        `/api/auth/change-first-password`,
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        // Get the user role and check authentication status
        const role = Cookies.get("role") || localStorage.getItem("role");
        const token = Cookies.get("token") || localStorage.getItem("token");
        console.log("User role before navigation:", role); // Debug log
        console.log("Token exists:", !!token); // Debug log
        
        // DON'T clear authentication data - user should remain logged in
        // Only clear form data and reset first login flag
        
        // Clear form data
        setEmail("");
        setPassword("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setRegisterPhoneNumber("");
        setIsFirstLogin(false);
        setError("");
        setResendMessage("");

        // Close the login modal first
        if (onClose) {
          onClose();
        }

        // Navigate to dashboard based on role (with small delay to ensure modal closes)
        if (role) {
          console.log("Navigating to dashboard for role:", role); // Debug log
          setTimeout(() => {
            navigateToDashboard(role);
          }, 100); // Small delay to ensure modal closes
        } else {
          console.error("No role found, redirecting to login");
          setError("Authentication error. Please login again.");
          setStep(1);
        }
      } else {
        throw new Error("Password change failed. Please try again.");
      }
    } catch (err) {
      console.error("Password change failed:", err);
      setError(err.response?.data?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToDashboard = (role) => {
    console.log("navigateToDashboard called with role:", role); // Debug log
    
    if (role === "Super Admin") {
      console.log("Redirecting to Super Admin dashboard");
      router.push("/superadmin");
    } else if (role === "Admin") {
      console.log("Redirecting to Admin dashboard");
      router.push("/admin");
    } else if (role === "Student") {
      console.log("Redirecting to Student dashboard");
      router.push("/student");
    } else {
      // Fallback: redirect to login if role is not recognized
      console.warn("Unknown role:", role);
      setError("Authentication error. Please login again.");
      setStep(1);
    }
  };

  const handleResendOTP = async () => {
    if (cooldownActive) {
      setResendMessage(`Please wait ${cooldownTime} seconds before requesting another code.`);
      return;
    }

    setResendLoading(true);
    setResendMessage("");
    setDevOtp("");
    try {
      const userId = Cookies.get("userId");
      const userEmail = Cookies.get("email");
      // Updated: same-origin path + credentials
      const response = await axios.post(
        `/api/auth/request-otp`,
        { userId, email: userEmail },
        { withCredentials: true }
      );

      if (response.data.devMode && response.data.otp) {
        setDevOtp(response.data.otp);
      }
      
      setResendMessage("Verification code resent. Check your email.");
      
      setCooldownActive(true);
      setCooldownTime(COOLDOWN_SECONDS);
    } catch (err) {
      console.error("Resend OTP error:", err);
      setResendMessage("Failed to resend code. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    if (step === 1) {
      setStep(4); 
      setResetStep(1); 
    } else if (step === 4) {
      setStep(1); 
    }
    setError("");
    setResendMessage("");
  };

  const handleForgotPassword = async () => {
    setError("");
    
    if (!forgotEmail.endsWith("@novaliches.sti.edu.ph") && !forgotEmail.endsWith("@novaliches.sti.edu")) {
      setError("Please enter a valid STI email address.");
      return;
    }
    
    setLoading(true);
    try {
      // Updated: same-origin path
      const response = await axios.post(
        `/api/auth/forgot-password`,
        { email: forgotEmail },
        { withCredentials: true }
      );

      if (response.data.devMode && response.data.otp) {
        setDevOtp(response.data.otp);
      }
 
      setResetStep(2);
 
      setCooldownActive(true);
      setCooldownTime(COOLDOWN_SECONDS);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.response?.data?.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    setError("");
    
    if (resetOtp.length !== 6) {
      setError("Verification code must be exactly 6 digits.");
      return;
    }
    
    setLoading(true);
    try {
      // Updated: same-origin path
      const response = await axios.post(
        `/api/auth/verify-reset-otp`,
        { email: forgotEmail, otp: resetOtp },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setResetStep(3);
        setResendMessage("");
      } else {
        throw new Error("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError(err.response?.data?.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    
    if (resetPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    
    if (resetPassword !== confirmResetPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      // Updated: same-origin path
      const response = await axios.post(
        `/api/auth/reset-password`,
        { resetToken, newPassword: resetPassword },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setForgotEmail("");
        setResetOtp("");
        setResetToken("");
        setResetPassword("");
        setConfirmResetPassword("");
        setResetStep(1);
        
        setStep(1);
        setResendMessage("Password reset successful.");
      } else {
        throw new Error("Password reset failed. Please try again.");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetOTP = async () => {
    if (cooldownActive) {
      setResendMessage(`Please wait ${cooldownTime} seconds before requesting another code.`);
      return;
    }
    
    setResendLoading(true);
    setResendMessage("");
    setDevOtp("");
    try {
      // Updated: same-origin path + credentials
      const response = await axios.post(
        `/api/auth/forgot-password`,
        { email: forgotEmail },
        { withCredentials: true }
      );
      
      if (response.data.devMode && response.data.otp) {
        setDevOtp(response.data.otp);
      }
      
      setResendMessage("Verification code resent. Check your email.");
      
      setCooldownActive(true);
      setCooldownTime(COOLDOWN_SECONDS);
    } catch (err) {
      console.error("Resend reset OTP error:", err);
      setResendMessage("Failed to resend code. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  // SMS OTP handler functions
  const handleSmsOtpRequest = async () => {
    setError("");
    setSmsResendMessage("");
    setUseSmsOtp(true);
    setSmsOtp("");
    setSmsDevOtp("");
    
    // Check if user already has a registered phone number
    try {
      const userId = Cookies.get("userId");
      const response = await axios.post(
        `/api/auth/check-phone-registration`,
        { userId },
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.hasPhone) {
        // User already has a phone number, proceed with SMS OTP
        setPhoneNumber(response.data.phoneNumber);
        setSmsResendMessage(response.data.message);
      } else {
        // User doesn't have a phone number, show error
        setError("Please use email OTP first, then change your password and register your phone number for future SMS OTP use.");
        setUseSmsOtp(false);
        return;
      }
    } catch (err) {
      console.error("Check phone registration error:", err);
      setError("Unable to check phone registration. Please try again.");
      setUseSmsOtp(false);
    }
  };


  const handleSendSmsOtp = async () => {
    // Check if cooldown is active
    if (smsCooldownActive) {
      setSmsResendMessage(`Please wait ${smsCooldownTime} seconds before sending another code.`);
      return;
    }

    setLoading(true);
    try {
      const userId = Cookies.get("userId");
      
      const response = await axios.post(
        `/api/auth/send-sms-otp`,
        { userId },
        { withCredentials: true }
      );

      if (response.data.devMode && response.data.otp) {
        setSmsDevOtp(response.data.otp);
      }

      setSmsCooldownActive(true);
      setSmsCooldownTime(COOLDOWN_SECONDS);
      setSmsResendMessage(response.data.message);
    } catch (err) {
      console.error("Send SMS OTP error:", err);
      setError(err.response?.data?.message || "Failed to send SMS OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSmsOtpVerification = async () => {
    if (smsOtp.length !== 6) {
      setError("SMS OTP must be exactly 6 digits.");
      return;
    }
    
    // Validate OTP format (only digits)
    if (!/^\d{6}$/.test(smsOtp)) {
      setError("SMS OTP must contain only numbers.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const userId = Cookies.get("userId");
      
      const response = await axios.post(
        `/api/auth/verify-sms-otp`,
        { userId, otp: smsOtp },
        { withCredentials: true }
      );

      if (response.data.success) {
        const role = Cookies.get("role");

        if (role !== "Super Admin") {
          try {
            const token = Cookies.get("token");
            const firstLoginCheckResponse = await axios.get(
              `/api/auth/check-first-login`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                },
                withCredentials: true
              }
            );
            
            if (firstLoginCheckResponse.data.isFirstLogin) {
              setIsFirstLogin(true);
              setStep(3);
              return;
            }
          } catch (firstLoginCheckError) {
            console.error("Error checking first login status:", firstLoginCheckError);
          }
        }

        navigateToDashboard(role);
      } else {
        throw new Error("SMS verification failed. Please try again.");
      }
    } catch (err) {
      console.error("SMS OTP verification error:", err);
      
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message || "Invalid SMS verification code. Please check and try again.");
      } else if (err.response && err.response.status === 401) {
        // Handle OTP expiration specifically
        if (err.response.data.code === 'OTP_EXPIRED') {
          setError("SMS verification code has expired. Please request a new one.");
        } else {
          setError("SMS verification code has expired or already been used. Please request a new one.");
        }
      } else if (err.response && err.response.status === 429) {
        setError("Too many verification attempts. Please wait before trying again.");
      } else if (err.response && err.response.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.response?.data?.message || "Invalid SMS verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendSmsOtp = async () => {
    if (smsCooldownActive) {
      setSmsResendMessage(`Please wait ${smsCooldownTime} seconds before requesting another code.`);
      return;
    }

    setSmsResendLoading(true);
    setSmsResendMessage("");
    setSmsDevOtp("");
    setError("");
    
    try {
      const userId = Cookies.get("userId");
      
      const response = await axios.post(
        `/api/auth/resend-sms-otp`,
        { userId },
        { withCredentials: true }
      );

      if (response.data.success) {
        if (response.data.devMode && response.data.otp) {
          setSmsDevOtp(response.data.otp);
        }
        
        setSmsResendMessage(response.data.message || "SMS verification code resent. Check your phone.");
        
        setSmsCooldownActive(true);
        setSmsCooldownTime(COOLDOWN_SECONDS);
      } else {
        setSmsResendMessage("Failed to resend SMS code. Please try again.");
      }
    } catch (err) {
      console.error("Resend SMS OTP error:", err);
      
      if (err.response && err.response.status === 429) {
        const cooldownRemaining = err.response.data.cooldownRemaining || 120;
        setSmsResendMessage(`Please wait ${cooldownRemaining} seconds before requesting another code.`);
        setSmsCooldownActive(true);
        setSmsCooldownTime(cooldownRemaining);
      } else if (err.response && err.response.status === 400) {
        setSmsResendMessage(err.response.data.message || "Failed to resend SMS code. Please try again.");
      } else {
        setSmsResendMessage("Failed to resend SMS code. Please try again later.");
      }
    } finally {
      setSmsResendLoading(false);
    }
  };

  const handleBackToEmailOtp = () => {
    setUseSmsOtp(false);
    setPhoneNumber("");
    setSmsOtp("");
    setSmsDevOtp("");
    setSmsResendMessage("");
    setError("");
  };


  return (
    <Card className="relative w-96 p-6 bg-white shadow-2xl rounded-lg">
      
      {(step === 2 || step === 3 || step === 4) && (
        <button
          onClick={() => {
            if (step === 3) {
              setStep(2); 
            } else if (step === 2) {
              setStep(1); 
            } else if (step === 4) {
              if (resetStep > 1) {
                setResetStep(resetStep - 1); 
              } else {
                setStep(1); 
              }
            }
          }}
          className="absolute top-2 left-2 text-gray-600 hover:text-gray-900 text-xl"
        >
          <ArrowLeft />
        </button>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#01579B] flex items-center">
          <Image
            src={stiLogo}
            alt="STI Logo"
            className="mr-2"
            style={{ maxHeight: 'calc(36px - (0px * 2))', width: 'auto' }}
          />
          <span>TrustElect</span>
        </h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
        >
          ×
        </button>
      </div>

      <CardContent>
        <h1 className="text-2xl font-bold text-center text-[#01579B] mb-4">
          {step === 1 ? "Login" : 
           step === 2 ? "Verify OTP" : 
           step === 3 ? "Change Password" : 
           "Reset Password"}
        </h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {step === 1 && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}>
            {resendMessage && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 rounded text-sm text-center">
                {resendMessage}
              </div>
            )}
            
            <p className="text-sm text-[#01579B] font-bold">Email</p>
            <Input
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleLoginKeyDown}
              required
              className="mb-2"
            />

            <p className="text-sm text-[#01579B] font-bold mt-2">Password</p>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleLoginKeyDown}
                required
                className="pr-16"
                style={{
                  // Hide browser's default password reveal button completely
                  WebkitTextSecurity: showPassword ? 'none' : 'disc',
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline z-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="text-right mt-2">
              <button 
                type="button"
                onClick={toggleForgotPassword}
                className="cursor-pointer text-sm text-[#01579B] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="cursor-pointer mt-4 w-full bg-[#003399] hover:bg-blue-800 text-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        )}

        {step === 2 && !useSmsOtp && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleOtpVerification();
          }}>
            <h2 className="text-[#01579B] font-semibold mb-2">Enter OTP</h2>
            <p className="text-sm text-gray-700 mb-2">
              A verification code has been sent to your email.
            </p>
            <div className="relative">
              <Input
                type={showOtp ? "text" : (otpTransientVisible ? "text" : "password")}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  if (!showOtp) {
                    setOtpTransientVisible(true);
                    if (otpRevealTimeoutRef.current) clearTimeout(otpRevealTimeoutRef.current);
                    otpRevealTimeoutRef.current = setTimeout(() => setOtpTransientVisible(false), 800);
                  }
                }}
                onKeyDown={handleOtpKeyDown}
                required
                className="pr-16"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline z-10"
                onClick={() => setShowOtp(!showOtp)}
              >
                {showOtp ? "Hide" : "Show"}
              </button>
            </div>

            {devOtp && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-center">
                <p className="text-xs text-gray-500">Development OTP:</p>
                <p className="font-mono text-sm">{devOtp}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="cursor-pointer mt-4 w-full bg-[#FFDF00] hover:bg-[#00FF00] text-black"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
            

            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || cooldownActive}
                className={`text-sm ${cooldownActive ? 'text-gray-400 cursor-not-allowed' : 'text-[#01579B] hover:underline'}`}
              >
                {resendLoading ? "Sending..." : 
                 cooldownActive ? `Resend available in ${cooldownTime}s` : 
                 "Resend verification code"}
              </button>
              {resendMessage && (
                <p className="text-xs mt-1 text-gray-600">{resendMessage}</p>
              )}
            </div>

            {/* SMS OTP Option */}
            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={handleSmsOtpRequest}
                className="text-sm text-[#01579B] hover:underline"
              >
                Use SMS OTP instead if email OTP is not working
              </button>
            </div>
          </form>
        )}

        {step === 2 && useSmsOtp && (
          <div>
            <h2 className="text-[#01579B] font-semibold mb-2">SMS OTP Verification</h2>
            {phoneNumber ? (
              <>
                <p className="text-sm text-gray-700 mb-2">
                  {smsResendMessage || "Enter the 6-digit code sent to your registered phone number."}
                </p>
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Phone Number:</p>
                  <p className="text-sm font-semibold text-gray-800">{phoneNumber}</p>
                </div>
              </>
            ) : (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold mb-2">Phone Number Not Registered</p>
                <p className="text-xs text-yellow-700">
                  Please use email OTP first, then change your password and register your phone number for future SMS OTP use.
                </p>
                <button 
                  type="button"
                  onClick={handleBackToEmailOtp}
                  className="mt-2 text-xs text-[#01579B] hover:underline"
                >
                  Back to Email OTP
                </button>
              </div>
            )}
            
            {phoneNumber && (
              <>
                <Button
                  onClick={handleSendSmsOtp}
                  className="cursor-pointer mb-4 w-full bg-[#FFDF00] hover:bg-[#00FF00] text-black"
                  disabled={loading}
                >
                  {loading ? "Sending..." : smsCooldownActive ? `Send SMS OTP (${smsCooldownTime}s)` : "Send SMS OTP"}
                </Button>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSmsOtpVerification();
                }}>
                  <h3 className="text-[#01579B] font-semibold mb-2">Enter Verification Code</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Enter the 6-digit code sent to your phone.
                  </p>
                  <div className="relative">
                    <Input
                      type={showSmsOtp ? "text" : (smsOtpTransientVisible ? "text" : "password")}
                      placeholder="Enter 6-digit SMS OTP"
                      value={smsOtp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setSmsOtp(value);
                        if (!showSmsOtp) {
                          setSmsOtpTransientVisible(true);
                          if (smsOtpRevealTimeoutRef.current) clearTimeout(smsOtpRevealTimeoutRef.current);
                          smsOtpRevealTimeoutRef.current = setTimeout(() => setSmsOtpTransientVisible(false), 800);
                        }
                      }}
                      onKeyDown={handleSmsOtpKeyDown}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      className="pr-16"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline z-10"
                      onClick={() => setShowSmsOtp(!showSmsOtp)}
                    >
                      {showSmsOtp ? "Hide" : "Show"}
                    </button>
                  </div>

                  {smsDevOtp && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-center">
                      <p className="text-xs text-black">Testing OTP:</p>
                      <p className="font-mono text-sm text-black">{smsDevOtp}</p>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="cursor-pointer mt-4 w-full bg-[#FFDF00] hover:bg-[#00FF00] text-black"
                    disabled={loading || smsOtp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify SMS OTP"}
                  </Button>
                  

                  <div className="mt-4 text-center">
                    <button 
                      type="button"
                      onClick={handleResendSmsOtp}
                      disabled={smsResendLoading || smsCooldownActive}
                      className={`text-sm ${smsCooldownActive ? 'text-gray-400 cursor-not-allowed' : 'text-[#01579B] hover:underline'}`}
                    >
                      {smsResendLoading ? "Sending..." : 
                       smsCooldownActive ? `Resend available in ${smsCooldownTime}s` : 
                       "Resend verification code"}
                    </button>
                  </div>

                  <div className="mt-2 text-center">
                    <button 
                      type="button"
                      onClick={handleBackToEmailOtp}
                      className="text-sm text-[#01579B] hover:underline"
                    >
                      Back to Email OTP
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
        
        {step === 3 && (
          <div>
            <p className="text-sm text-gray-700 mb-4">
              This is your first login. Please change your password and register your phone number for SMS OTP.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePasswordChange();
            }}>
              <p className="text-sm text-[#01579B] font-bold mt-3">New Password</p>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={handlePasswordChangeKeyDown}
                  required
                  className="mb-2"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
              
              <p className="text-sm text-[#01579B] font-bold mt-3">Confirm Password</p>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handlePasswordChangeKeyDown}
                  required
                  className="mb-4"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              
              <ul className="text-xs text-gray-600 mb-4 pl-4 list-disc">
                <li>Password must be at least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number or special character</li>
              </ul>
              
              <p className="text-sm text-[#01579B] font-bold mt-3">Phone Number</p>
              <Input
                type="tel"
                placeholder="Enter your phone number (e.g., 09123456789)"
                value={registerPhoneNumber}
                onChange={(e) => setRegisterPhoneNumber(e.target.value)}
                required
                className="mb-4"
              />
              
              <Button
                type="submit"
                className="cursor-pointer mt-2 w-full bg-[#003399] hover:bg-blue-800 text-white"
                disabled={loading || !registerPhoneNumber.trim()}
              >
                {loading ? "Updating..." : "Change Password & Register Phone"}
              </Button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="reset-password-container">
            
            {resetStep === 1 && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}>
                <p className="text-sm text-gray-700 mb-3">
                  Enter your STI email address to receive a password reset code.
                </p>
                <Input
                  type="email"
                  placeholder="Enter your STI Email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onKeyDown={handleForgotPasswordKeyDown}
                  required
                  className="mb-4"
                />
                
                <Button
                  type="submit"
                  className="w-full bg-[#003399] hover:bg-blue-800 text-white"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Request Reset Code"}
                </Button>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    className="text-sm text-[#01579B] hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
            
            {resetStep === 2 && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleVerifyResetOTP();
              }}>
                <p className="text-sm text-gray-700 mb-3">
                  Enter the 6-digit verification code sent to your email.
                </p>
                <div className="relative">
                  <Input
                    type={showResetOtp ? "text" : (resetOtpTransientVisible ? "text" : "password")}
                    placeholder="Enter 6-digit code"
                    value={resetOtp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetOtp(value);
                      if (!showResetOtp) {
                        setResetOtpTransientVisible(true);
                        if (resetOtpRevealTimeoutRef.current) clearTimeout(resetOtpRevealTimeoutRef.current);
                        resetOtpRevealTimeoutRef.current = setTimeout(() => setResetOtpTransientVisible(false), 800);
                      }
                    }}
                    onKeyDown={handleResetOtpKeyDown}
                    required
                    className="mb-3 pr-16"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline z-10 top-0"
                    onClick={() => setShowResetOtp(!showResetOtp)}
                  >
                    {showResetOtp ? "Hide" : "Show"}
                  </button>
                </div>
                
                {devOtp && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-center mb-3">
                    <p className="text-xs text-gray-500">Code:</p>
                    <p className="font-mono text-sm">{devOtp}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-[#003399] hover:bg-blue-800 text-white"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
                
                {/* Resend OTP button with cooldown */}
                <div className="mt-4 text-center">
                  <button 
                    type="button"
                    onClick={handleResendResetOTP}
                    disabled={resendLoading || cooldownActive}
                    className={`text-sm ${cooldownActive ? 'text-gray-400 cursor-not-allowed' : 'text-[#01579B] hover:underline'}`}
                  >
                    {resendLoading ? "Sending..." : 
                     cooldownActive ? `Resend in ${cooldownTime}s` : 
                     "Resend code"}
                  </button>
                </div>
              </form>
            )}
            
            {resetStep === 3 && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleResetPassword();
              }}>
                <p className="text-sm text-gray-700 mb-3">
                  Create a new password.
                </p>
                
                <p className="text-sm text-[#01579B] font-bold mt-2">New Password</p>
                <div className="relative">
                  <Input
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    onKeyDown={handleResetPasswordKeyDown}
                    required
                    className="mb-2"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                  >
                    {showResetPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                <p className="text-sm text-[#01579B] font-bold mt-3">Confirm Password</p>
                <div className="relative">
                  <Input
                    type={showConfirmResetPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    onKeyDown={handleResetPasswordKeyDown}
                    required
                    className="mb-3"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 text-sm text-[#01579B] hover:underline"
                    onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                  >
                    {showConfirmResetPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-[#003399] hover:bg-blue-800 text-white mt-4"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
