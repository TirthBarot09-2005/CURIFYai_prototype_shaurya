import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn, useUser } from "@clerk/clerk-react";

export default function AuthPage() {
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/onboarding", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-24">
      {/* Ambient glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.06] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-500/[0.05] blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 24 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/pokecut.png" alt="CURIFY" className="w-12 h-12 rounded-xl" />
            <span className="text-2xl font-bold text-white tracking-tight">CURIFY AI</span>
          </Link>
        </div>

        {/* Clerk SignIn Component */}
        <div className="w-full shadow-2xl rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl">
          <SignIn 
            path="/auth"
            routing="path"
            signUpUrl="/auth/sign-up"
            appearance={{
              elements: {
                rootBox: "w-full !bg-transparent",
                card: "!bg-white/5 backdrop-blur-xl border-none shadow-none text-white w-full",
                headerTitle: "text-white text-2xl font-bold",
                headerSubtitle: "text-slate-400 text-sm",
                socialButtonsBlockButton: "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-white transition-all",
                socialButtonsBlockButtonText: "text-white font-medium",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-slate-600 text-[10px] uppercase tracking-widest",
                formFieldLabel: "text-slate-400 text-xs font-semibold uppercase tracking-wider",
                formFieldInput: "!bg-white/[0.04] !border-white/10 !text-white placeholder-slate-600 focus:ring-emerald-500/30 rounded-xl",
                formFieldInputGroup: "!text-white",
                formButtonPrimary: "bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold rounded-full transition-all py-3.5",
                footerActionText: "text-slate-500 text-sm",
                footerActionLink: "text-emerald-400 font-medium hover:text-emerald-300 transition-colors",
                identityPreviewText: "text-white",
                identityPreviewEditButtonIcon: "text-emerald-400",
                formResendCodeLink: "text-emerald-400 hover:text-emerald-300",
                otpCodeFieldInput: "!text-white !bg-white/[0.04] !border-white/10 rounded-xl",
                otpCodeFieldErrorText: "text-red-400",
                formFieldInputShowPasswordButton: "text-slate-400",
                alternativeMethodsBlockButton: "!text-white bg-white/[0.03] border-white/10 hover:bg-white/[0.07] transition-all",
                cardBox: "w-full !bg-transparent shadow-none border-none",
                footer: "!bg-transparent",
                footerAction: "!bg-transparent"
              }
            }}
          />
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 CURIFY AI Navigator by Team Shaurya
        </p>
      </motion.div>
    </div>
  );
}
