import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save, CheckCircle2, HeartPulse, BarChart3, Loader2, MapPin, Calendar, Droplets, Building2, Percent, Clock } from 'lucide-react';
import axios from 'axios';
import { FileText, ExternalLink, Activity } from 'lucide-react';

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const LENDING_CATEGORIES = [
  { id: 'surgery', label: 'Surgery' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'chronic', label: 'Chronic Illness' },
  { id: 'maternity', label: 'Maternity' },
  { id: 'diagnostics', label: 'Diagnostics' }
];

export default function ProfilePage() {
  const { user: authUser, role, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("[ProfilePage] Raw Data:", res.data);
      const data = res.data;
      // Ensure sub-objects exist to prevent rendering crashes
      const initialized = {
        ...data,
        patient_data: data.patient_data || {},
        lender_data: data.lender_data || {}
      };
      
      console.log("[ProfilePage] Initializing profile with:", initialized);
      setProfile(initialized);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const currentRole = profile?.role || role;
      const updateData = currentRole === 'patient' ? profile.patient_data : profile.lender_data;
      
      console.log("[ProfilePage] Saving profile:", { name: profile.name, data: updateData });

      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        name: profile.name,
        data: updateData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchProfile(); // Refresh
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value, isNested = false) => {
    setProfile(prev => {
      if (isNested) {
        const dataKey = profileRole === 'patient' ? 'patient_data' : 'lender_data';
        return {
          ...prev,
          [dataKey]: { ...prev[dataKey], [field]: value }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const toggleCategory = (catId) => {
    const current = profile.lender_data.categories || [];
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId];
    handleInputChange('categories', updated, true);
  };

  const getDisplayName = () => {
    if (authUser?.fullName) return authUser.fullName;
    if (profile?.name && profile.name.trim() !== "") return profile.name;
    const email = authUser?.primaryEmailAddress?.emailAddress || profile?.email;
    if (email) return email.split('@')[0];
    return "";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c14]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-slate-500 text-sm animate-pulse">Synchronizing secure profile data...</p>
      </div>
    </div>
  );

  const profileRole = profile?.role || role;

  return (
    <div className="relative min-h-screen pt-24 pb-16 bg-[#0a0c14]">
      {/* Success Banner */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-xl flex items-center gap-2 shadow-2xl"
          >
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">Profile updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
              <p className="text-slate-400">Manage your institutional and professional details.</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${profileRole === 'patient' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
              {profileRole === 'patient' ? <HeartPulse size={18} /> : <BarChart3 size={18} />}
              <span className="text-sm font-bold uppercase tracking-wider">{profileRole}</span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content / Role Specific */}
          <div className="lg:col-span-3 space-y-6">
              <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-sky-400" />
                  {profileRole === 'patient' ? 'Medical Information' : 'Institutional Details'}
                </h3>

                {profileRole === 'patient' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Age</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          type="number" 
                          value={profile.patient_data.age || ''} 
                          onChange={(e) => handleInputChange('age', e.target.value, true)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Blood Group</label>
                      <div className="relative">
                        <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select 
                          value={profile.patient_data.blood_group || ''} 
                          onChange={(e) => handleInputChange('blood_group', e.target.value, true)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/30 outline-none appearance-none"
                        >
                          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg} className="bg-slate-900">{bg}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">City / Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          type="text" 
                          value={profile.patient_data.city || ''} 
                          onChange={(e) => handleInputChange('city', e.target.value, true)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Comorbidities</label>
                      <textarea 
                        value={profile.patient_data.comorbidities || ''} 
                        onChange={(e) => handleInputChange('comorbidities', e.target.value, true)}
                        rows="4"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/30 outline-none resize-none"
                        placeholder="e.g. Hypertension, Type 2 Diabetes"
                      />
                    </div>
                  </div>

                  {/* My Loan Applications Section */}
                  <PatientLoans />
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Financial Institution / Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          type="text" 
                          value={profile.lender_data.company_name || ''} 
                          onChange={(e) => handleInputChange('company_name', e.target.value, true)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/30 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Lending Capacity (INR)</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                            type="number" 
                            value={profile.lender_data.lending_capacity || ''} 
                            onChange={(e) => handleInputChange('lending_capacity', e.target.value, true)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/30 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Interest Rate (%)</label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                            type="number" 
                            step="0.1"
                            value={profile.lender_data.interest_rate || ''} 
                            onChange={(e) => handleInputChange('interest_rate', e.target.value, true)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/30 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Avg Approval Time (Days)</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                            type="number" 
                            value={profile.lender_data.approval_time_days || ''} 
                            onChange={(e) => handleInputChange('approval_time_days', e.target.value, true)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500/30 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-400 uppercase block">Focus Categories</label>
                      <div className="flex flex-wrap gap-2">
                        {LENDING_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              (profile.lender_data.categories || []).includes(cat.id)
                                ? 'bg-sky-500 border-sky-400 text-white'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-3">
                  <Shield className="text-sky-400 shrink-0" size={18} />
                  <p className="text-[11px] text-slate-500 italic">Your institutional and professional data is processed securely under DPDP Act 2023 protocols.</p>
                </div>

                <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all ${
                      profileRole === 'patient' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-sky-500 hover:bg-sky-400'
                    } text-white shadow-xl shadow-sky-500/20 disabled:opacity-50`}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function PatientLoans() {
  const { getToken } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/loan/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoans(res.data);
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []);

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="animate-spin text-emerald-400" size={24} />
    </div>
  );

  if (loans.length === 0) return null;

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="text-emerald-400" size={18} />
          My Loan Applications
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">TRACKING {loans.length} REQUESTS</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {loans.map((loan) => (
          <motion.div 
            key={loan.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white capitalize">{loan.procedure.replace(/_/g, ' ')}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    loan.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    loan.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {loan.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {loan.hospital_name}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {loan.hospital_city}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Requested</div>
                  <div className="text-xs font-bold text-white">₹{(loan.loan_amount_requested / 100000).toFixed(2)}L</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Approval Odds</div>
                  <div className={`text-xs font-bold ${
                    loan.approval_probability > 0.8 ? 'text-emerald-400' : 
                    loan.approval_probability > 0.6 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {Math.round(loan.approval_probability * 100)}%
                  </div>
                </div>
              </div>
            </div>
            
            {loan.lender_notes && (
              <div className="mt-3 p-2 rounded-lg bg-black/20 border border-white/5 text-[10px] text-slate-400 italic">
                Lender Note: "{loan.lender_notes}"
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
