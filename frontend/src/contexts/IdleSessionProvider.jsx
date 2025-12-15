"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';

const WARNING_MS = 10 * 60 * 1000; // 10 minutes
<<<<<<< HEAD
const TIMEOUT_MS = 15 * 60 * 1000; 
=======
const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b

export default function IdleSessionProvider({ children }) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdownMs, setCountdownMs] = useState(TIMEOUT_MS - WARNING_MS);

  const warningTimerRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    warningTimerRef.current = null;
    timeoutTimerRef.current = null;
    countdownIntervalRef.current = null;
  };

  const logout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
<<<<<<< HEAD

=======
    // Clear client auth
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    Cookies.remove('token');
    Cookies.remove('role');
    try {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }).catch(() => {});
    } catch (_) {}
<<<<<<< HEAD

=======
    // Redirect to landing page instead of login
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    setCountdownMs(TIMEOUT_MS - WARNING_MS);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      const start = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, (TIMEOUT_MS - WARNING_MS) - elapsed);
        setCountdownMs(remaining);
      }, 1000);
    }, WARNING_MS);

<<<<<<< HEAD
=======
    // Force logout after TIMEOUT_MS
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    timeoutTimerRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [logout]);

  const resetActivity = useCallback(() => {
    startTimers();
  }, [startTimers]);

<<<<<<< HEAD

=======
  // Bind activity listeners
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  useEffect(() => {
    startTimers();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetActivity, { passive: true }));

    const visHandler = () => {
      if (document.visibilityState === 'visible') {
<<<<<<< HEAD
=======
        // If user came back, treat as activity
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        resetActivity();
      }
    };
    document.addEventListener('visibilitychange', visHandler);

    return () => {
      clearTimers();
      events.forEach(evt => window.removeEventListener(evt, resetActivity));
      document.removeEventListener('visibilitychange', visHandler);
    };
  }, [resetActivity, startTimers]);

  const handleContinue = () => {
    setShowWarning(false);
    resetActivity();
  };

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 text-black">
            <h3 className="text-lg font-semibold mb-2">Are you still there?</h3>
            <p className="text-sm mb-4">
              You've been inactive for a while. Your session will end in {Math.ceil(countdownMs / 1000)} seconds.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Log out
              </button>
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


