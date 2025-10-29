"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import NotificationBell from "../../components/NotificationBell";
import Image from 'next/image';
import stiLogo from "../../assets/sti_logo.png"
import axios from "axios";
import { useLogo } from "../../hooks/useLogo";

export default function Header() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const { logoUrl, isLoading: logoLoading } = useLogo();

  const handleLogout = async () => {
    try {
      // Get user information before removing cookies
      const token = Cookies.get("token");
      const userId = Cookies.get("userId");
      const email = Cookies.get("email");
      const role = Cookies.get("role");
      
      // Call the logout API
      await axios.post(`${API_URL}/auth/logout`, {
        userId,
        email,
        role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Then remove cookies and redirect
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("email");
      Cookies.remove("userId");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still perform client-side logout even if API call fails
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("email");
      Cookies.remove("userId");
      router.push("/");
    }
  };

  return (
    <header className="top-0 left-0 right-0 w-full bg-[#0020C2] text-white shadow-md p-4 flex justify-between items-center h-20 z-50">
     
      <h2 className="text-2xl font-bold flex items-center">
        {logoUrl ? (
          <Image 
            src={`${logoUrl}?timestamp=${new Date().getTime()}`}
            alt="Site Logo" 
            width={60}
            height={20}
            className="mr-2"
            priority
            unoptimized={true}
            style={{ maxHeight: 'calc(51px - (0px * 2))' }}
            onError={(e) => {
              console.error("Error loading logo:", logoUrl);
              // Try multiple fallback URLs for logo
              const fallbackUrls = [
                logoUrl.replace('/uploads/images/', '/api/uploads/images/'),
                logoUrl.replace('/uploads/', '/api/uploads/'),
                logoUrl.replace('/uploads/images/', '/uploads/'),
                logoUrl
              ];
              
              const img = e.currentTarget;
              const tryNextFallback = (index) => {
                if (index >= fallbackUrls.length) {
                  console.error('All logo fallback URLs failed, hiding logo');
                  img.style.display = 'none';
                  return;
                }
                
                const fallbackUrl = fallbackUrls[index];
                img.src = `${fallbackUrl}?timestamp=${new Date().getTime()}`;
                img.onload = () => {
                  console.log('Logo loaded successfully with fallback URL:', fallbackUrl);
                };
                img.onerror = () => {
                  console.error('Logo fallback URL failed:', fallbackUrl);
                  tryNextFallback(index + 1);
                };
              };
              
              tryNextFallback(0);
            }}
            onLoad={() => {
              console.log('Logo loaded successfully:', logoUrl);
            }}
          />
        ) : (
          <Image 
            src={stiLogo}
            alt="STI Logo"
            width={60}
            height={20}
            className="mr-2"
            priority
            style={{ maxHeight: 'calc(51px - (0px * 2))' }}
          />
        )}
        <span className="text-white">TrustElect</span> 
      </h2>

      
      <div className="flex items-center gap-4">
        <div className="text-white hover:text-yellow-300">
          <NotificationBell />
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
