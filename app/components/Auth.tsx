"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  Zap,
  Search,
  Shield,
  FileText,
  Cpu,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Loader2,
} from "lucide-react";

type AuthView = "signin" | "signup" | "forgot-password" | "success-signup" | "success-reset"

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [view, setView] = useState<AuthView>("signin");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (view === "signup"){
        const {error} = await supabase.auth.signUp({ email, password})
        if (error) throw error;
        setView("success-signup")
      }else if (view === "signin"){
        const {error} = await supabase.auth.signInWithPassword({email, password})
        if (error) throw error;
      }else if (view === "forgot-password"){
        const {error} = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setView("success-reset")
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      console.error("Auth error: ", error.message)      
    } finally {
      setLoading(false)
    }

    // if (isSignUp) {
    //   const { error: signUpError } = await supabase.auth.signUp({
    //     email,
    //     password,
    //   });
    //   setShowSuccessMessage(true);
    //   setEmail("")
    //   setPassword("")
    //   if (signUpError) {
    //     setErrorMessage(signUpError.message)
    //     console.error("Error signing up: ", signUpError.message);
    //     return;
    //   }
    // } else {
    //   const { error: signInError } = await supabase.auth.signInWithPassword({
    //     email,
    //     password,
    //   });
    //   if (signInError) {
    //     setErrorMessage(signInError.message)
    //     console.error("Error signing in: ", signInError.message);
    //     return;
    //   }
    // }
  };

  return (
       <div className="flex min-h-screen bg-linear-to-r from-blue-500 to-pink-300 font-sans text-slate-900 overflow-hidden">
      {/* LEFT SIDE: AUTH FORM */}
      <div className="w-full lg:w-[450px] flex flex-col justify-center p-8 sm:p-12 xl:p-20 relative z-10">
        <div className="mb-10 lg:hidden flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">DocuIntel</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          {showSuccessMessage ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                Verify your email
              </h2>
              <p className="text-slate-950 mb-6 leading-relaxed">
                We've sent a confirmation link to <span className="font-bold text-slate-900">{email}</span>. 
                Please click the link in the email to activate your account.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8">
                <p className="text-sm text-slate-800 italic">
                  Tip: If you don't see it within a few minutes, check your spam or junk folder.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSuccessMessage(false);
                  setIsSignUp(false);
                }}
                className="flex items-center text-sm font-semibold text-red-800 hover:text-red-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
               <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isSignUp ? "Get started" : "Welcome back"}
          </h2>
          <p className="text-black mb-8">
            {isSignUp 
              ? "Create an account to start indexing your documents." 
              : "Enter your credentials to access your documents."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-black">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-black ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none bg-white"
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-900 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center hover:cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-sm font-semibold text-indigo-800 hover:text-indigo-900 transition-colors hover:cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Create one"}
            </button>
          </div>
            </>
          )
        }
         
        </div>
      </div>

      {/* RIGHT SIDE: MARKETING/PURPOSE SECTION */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center p-20 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="max-w-2xl relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-xl shadow-indigo-500/20">
              <Zap className="w-8 h-8 text-white fill-current" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white italic">DocuIntel</h1>
          </div>

          <h2 className="text-5xl font-bold text-white leading-[1.1] mb-6">
            Intelligent Search for your <span className="text-indigo-400 font-serif italic text-6xl">Internal Archive.</span>
          </h2>
          
          <p className="text-xl text-slate-400 leading-relaxed mb-12">
            DocuIntel automatically extracts text from your PDFs and Images, categories them with precision, and provides a powerful Full-Text Search portal to find anything in seconds.
          </p>

          <div className="grid grid-cols-2 gap-8 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-800 p-2 rounded-lg text-indigo-400">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Lightning Search</h4>
              </div>
              <p className="text-slate-500 text-sm leading-snug">
                Search through gigabytes of text snippets, categories, and titles instantly with our indexed FTS engine.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-800 p-2 rounded-lg text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold">OCR Extraction</h4>
              </div>
              <p className="text-slate-500 text-sm leading-snug">
                Powered by Tesseract and PDF-to-Text to ensure no data remains locked inside flat images or scans.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-800 p-2 rounded-lg text-indigo-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Secure Vault</h4>
              </div>
              <p className="text-slate-500 text-sm leading-snug">
                Encrypted storage and metadata indexing powered by Supabase with Row Level Security.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-800 p-2 rounded-lg text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Smart Tags</h4>
              </div>
              <p className="text-slate-500 text-sm leading-snug">
                Automatic and manual categorization of documents by project, topic, and department.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
