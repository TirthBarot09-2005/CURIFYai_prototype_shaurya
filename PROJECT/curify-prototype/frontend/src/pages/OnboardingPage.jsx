import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { HeartPulse, BarChart3, ArrowRight, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const LENDING_CATEGORIES = [
  { id: 'surgery', label: 'Surgery' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'chronic', label: 'Chronic Illness' },
  { id: 'maternity', label: 'Maternity' },
  { id: 'diagnostics', label: 'Diagnostics' }
];

export default function OnboardingPage() {
  const { user, role: contextRole, profileCompleted, setProfileCompleted, setUserRole, loading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already onboarded
  useEffect(() => {
    if (!authLoading && profileCompleted && contextRole) {
      navigate(contextRole === 'patient' ? '/patient' : '/lender/dashboard', { replace: true });
    }
  }, [profileCompleted, contextRole, authLoading, navigate]);

  // Form states
  const [formData, setFormData] = useState({
    // Basic fields
    name: '',
    // Patient fields
    age: '',
    city: '',
    blood_group: '',
    comorbidities: '',
    // Lender fields
    company_name: '',
    lending_capacity: '',
    interest_rate: '',
    approval_time_days: '',
    categories: []
  });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (catId) => {
    setFormData(prev => {
      const current = prev.categories;
      const updated = current.includes(catId) 
        ? current.filter(id => id !== catId)
        : [...current, catId];
      return { ...prev, categories: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      
      // Filter data based on role
      const submissionData = role === 'patient' 
        ? {
            age: parseInt(formData.age),
            city: formData.city,
            blood_group: formData.blood_group,
            comorbidities: formData.comorbidities
          }
        : {
            company_name: formData.company_name,
            lending_capacity: parseInt(formData.lending_capacity),
            interest_rate: parseFloat(formData.interest_rate),
            approval_time_days: parseInt(formData.approval_time_days),
            categories: formData.categories
          };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          name: formData.name,
          data: submissionData
        })
      });

      if (res.ok) {
        setProfileCompleted(true);
        setUserRole(role); // Update role in context too
        navigate(role === 'patient' ? '/patient' : '/lender/dashboard', { replace: true });
      }
    } catch (error) {
      console.error("Onboarding submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus {
            -webkit-text-fill-color: white !important;
            -webkit-box-shadow: 0 0 0px 1000px rgba(15, 23, 42, 0.9) inset !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}
      </style>
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center"
            >
              <div className="mb-10">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <img src="/pokecut.png" alt="Curify" className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Welcome to CurifyAI</h1>
                <p className="text-slate-400">Tell us how you'll be using the platform to personalize your experience.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                {/* Patient Option */}
                <button
                  onClick={() => handleRoleSelect('patient')}
                  className="group relative p-8 rounded-3xl border border-emerald-500/20 bg-white/[0.03] backdrop-blur-xl text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <HeartPulse className="text-emerald-400" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">I am a Patient</h3>
                  <p className="text-sm text-slate-400 mb-6">Seeking medical care, comparing costs, and exploring financing options.</p>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    Select Role <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Lender Option */}
                <button
                  onClick={() => handleRoleSelect('lender')}
                  className="group relative p-8 rounded-3xl border border-sky-500/20 bg-white/[0.03] backdrop-blur-xl text-left transition-all hover:border-sky-500/50 hover:bg-sky-500/5"
                >
                  <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="text-sky-400" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">I am a Lender</h3>
                  <p className="text-sm text-slate-400 mb-6">Providing healthcare loans, managing underwriting, and monitoring risks.</p>
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                    Select Role <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl"
            >
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium"
              >
                <ChevronLeft size={18} /> Back to Role Selection
              </button>

              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {role === 'patient' ? <HeartPulse className="text-emerald-400" /> : <BarChart3 className="text-sky-400" />}
                  {role === 'patient' ? 'Patient Profile' : 'Lender Details'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">Please fill in the details below to complete your setup.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name is managed via Clerk, no need to ask again */}
                {role === 'patient' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age</label>
                        <input
                          required
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                          placeholder="e.g. 35"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</label>
                        <select
                          required
                          name="blood_group"
                          value={formData.blood_group}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all appearance-none"
                        >
                          <option value="" disabled className="bg-slate-900">Select...</option>
                          {BLOOD_GROUPS.map(bg => (
                            <option key={bg} value={bg} className="bg-slate-900">{bg}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">City</label>
                      <input
                        required
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comorbidities / Medical History</label>
                      <textarea
                        name="comorbidities"
                        value={formData.comorbidities}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all resize-none"
                        placeholder="e.g. Diabetes, Hypertension (Optional)"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
                      <input
                        required
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/30 outline-none transition-all"
                        placeholder="e.g. HDFC Health Finance"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lending Capacity (INR)</label>
                        <input
                          required
                          type="number"
                          name="lending_capacity"
                          value={formData.lending_capacity}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/30 outline-none transition-all"
                          placeholder="e.g. 5000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interest Rate (%)</label>
                        <input
                          required
                          type="number"
                          step="0.1"
                          name="interest_rate"
                          value={formData.interest_rate}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/30 outline-none transition-all"
                          placeholder="e.g. 10.5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lending Categories</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {LENDING_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                              formData.categories.includes(cat.id)
                                ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approval Time (Days)</label>
                      <input
                        required
                        type="number"
                        name="approval_time_days"
                        value={formData.approval_time_days}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500/30 outline-none transition-all"
                        placeholder="e.g. 2"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-3 mt-8 shadow-2xl ${
                    role === 'patient' 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20' 
                      : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                  } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>Complete Setup <CheckCircle2 size={18} /></>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
