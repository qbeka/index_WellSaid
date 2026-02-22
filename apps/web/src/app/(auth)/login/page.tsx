"use client";

import { useEffect, useState } from "react";
import { signInWithGoogle } from "./actions";

import Image from "next/image";
import sphereImage from "@/images/sphere.png";
import logoImage from "@/images/logo.png";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const transition1 = setTimeout(() => setMounted(true), 100);
    const transition2 = setTimeout(() => setShifted(true), 2000);
    const transition3 = setTimeout(() => setShowButton(true), 2000);

    return () => {
      clearTimeout(transition1);
      clearTimeout(transition2);
      clearTimeout(transition3);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
    }
  };

 return (
    <>
      <style>{`
        @keyframes orb-float {
          0%   { transform: rotate(0deg) scale(1); }
          33%  { transform: rotate(4deg) scale(1.03); }
          66%  { transform: rotate(-3deg) scale(0.90); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .orb-animate {
          animation: orb-float 20s ease-in-out infinite;
        }
      `}</style>

      <div
        className="fixed inset-0 flex overflow-hidden"
        style={{
          backgroundColor: "#f0ece6",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div
          className={`relative flex items-center justify-center transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          ${shifted ? "w-[60%]" : "w-full"}
          ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transitionProperty: "width, opacity" }}
        >
          <div
            className={`transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <Image
              src={sphereImage}
              alt="Background Gradient Sphere Image"
              width={1000}
              height={1000}
              className="orb-animate"
            />
          </div>

          <div className="absolute z-10 flex items-center gap-6 text-white pointer-events-none select-none">
            <Image 
              src={logoImage} 
              alt="WellSaid Logo" 
              width={150} 
              height={150} 
              priority 
              />

            <div className="flex flex-col leading-none">
              <span
                className="text-[2rem] font-light tracking-wider opacity-90 mb-2 drop-shadow-sm"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Welcome to
              </span>

              <span
                className="text-[4rem] tracking-tight drop-shadow-sm"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
              >
                WellSaid
              </span>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col items-left justify-center transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          ${shifted ? "w-[40%] opacity-100" : "w-0 opacity-0"}`}
          style={{ transitionProperty: "width, opacity", overflow: "hidden" }}
        >
          <div
            className={`flex flex-col items-center w-72 transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)]
            ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <p
              className="text-[1.1rem] text-[var(--color-foreground)] opacity-60 mb-2"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
            > 
              Sign in to continue
            </p>

            {error && (
              <p className="text-center text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              aria-label="Continue with Google"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background-muted)] active:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" 
                fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" 
                fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" 
                fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" 
                fill="#EA4335"/>
              </svg>
              {loading ? "Redirecting..." : "Continue with Google"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
