import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, MapPin, IndianRupee, User, HeartPulse, Loader2,
  AlertTriangle, Info, Sparkles, Zap, ArrowRight, Dna, Stethoscope,
  Send, Bot, UserCircle, Globe, CheckCircle2, Shield, FileText, Languages
} from 'lucide-react';
import HospitalCard from './HospitalCard';
import ConfidenceBadge from './ConfidenceBadge';
import NeuralVortexBg from './ui/NeuralVortexBg';
import StyledChatInput from './StyledChatInput';
import HospitalMap from './HospitalMap';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';



export default function PatientSearch() {
  const { user, getToken } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);

  const [form, setForm] = useState({ query: '', budget: '' });
  const [city, setCity] = useState('');
  const [comorbidities, setComorbidities] = useState('');
  const [aiComorbidities, setAiComorbidities] = useState('');
  const [aiStatus, setAiStatus] = useState("idle"); // idle | loading | done | error
  const [urgency, setUrgency] = useState("planned"); // emergency | planned
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loanModal, setLoanModal] = useState(null);
  const [loanSubmitting, setLoanSubmitting] = useState(false);
  const [loanSuccess, setLoanSuccess] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [preCheckResult, setPreCheckResult] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);
  const [formLoading, setFormLoading] = useState({ budget: false, comorbidities: false });

  // --- OLD CODE ---
  // (No auto-fill effect)
  
  // --- NEW CODE ---
  useEffect(() => {
    const queryStr = String(form.query || "").trim();
    if (queryStr.length < 3) {
      setAiStatus("idle");
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(async () => {
      console.log("[AI-Fill] Triggering for:", queryStr);
      setAiStatus("loading");
      setFormLoading({ budget: true, comorbidities: true });
      try {
        const GEMINI_API_KEY = "AIzaSyDU5iSbCdwY68saJXewlXpJ0fSeyhRp-KM";
        const prompt = `User needs: ${queryStr}. Patient age: ${user?.age || 'unknown'}. Urgency: ${urgency}.
        If emergency: prioritize nearest hospitals, suggest higher budget buffer.
        If planned: optimize for cost and financing options.
        Return ONLY valid JSON: { "estimated_budget": number, "comorbidities": string, "city": string }. estimated_budget: single number in INR representing maximum cost. Base budget on average Indian hospital costs. If city mentioned in query, extract it.`;
        
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        console.log("URL:", GEMINI_URL);
        const res = await axios.post(GEMINI_URL, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        });
        
        console.log("[AI-Fill] Raw response:", res.data);
        const rawText = res.data.candidates[0].content.parts[0].text;
        const data = JSON.parse(rawText.replace(/```json|```/g, "").trim());
        console.log("RESPONSE:", JSON.stringify(data));
        
        setForm(prev => ({
          ...prev,
          budget: !prev.budget || prev.budget.trim() === "" ? (String(data.estimated_budget || "")) : prev.budget,
        }));
        
        if (data.comorbidities) {
          setAiComorbidities(data.comorbidities);
        }
        
        if (data.city) {
          setCity(data.city);
          if (!city || city.trim() === "") {
            setMapQuery(data.city);
          }
        }
        setAiStatus("done");
      } catch (err) { 
        console.error("[AI-Fill] Failed:", err);
        setAiStatus("error");
      } finally { 
        setFormLoading({ budget: false, comorbidities: false }); 
      }
    }, 800); // Slightly slower debounce for reliability
    return () => clearTimeout(debounceTimer.current);
  }, [form.query]);

  // Send chat message to AI
  const sendChat = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, { messages: updated });
      const ai = res.data;
      setChatMessages([...updated, { role: 'assistant', content: ai.message }]);
      setDetectedLang(ai.detected_language);

      // Auto-fill form from AI response
      if (ai.auto_fill) {
        if (ai.auto_fill.location) {
          setMapQuery(ai.auto_fill.location);
          setCity(ai.auto_fill.location);
        }
        if (ai.auto_fill.comorbidities) {
          setAiComorbidities(ai.auto_fill.comorbidities);
        }
        setForm(prev => ({
          ...prev,
          budget: ai.auto_fill.budget ? String(ai.auto_fill.budget) : prev.budget,
          query: ai.auto_fill.procedure || prev.query,
        }));
      }

      // Auto-search if ready
      if (ai.ready_to_search && ai.auto_fill?.procedure && ai.auto_fill?.location) {
        handleSearch(ai.auto_fill.procedure, ai.auto_fill.location, ai.auto_fill.budget, ai.auto_fill.age, ai.auto_fill.comorbidities);
      }
    } catch (err) {
      setChatMessages([...updated, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    } finally { setChatLoading(false); }
  };

  const handleSearch = async (query, location, budget, age, comorbidities) => {
    setError(''); setLoading(true); setResults(null);
    const searchLocation = location || city;
    if (searchLocation) setMapQuery(searchLocation);
    try {
      const res = await axios.post(`${API_URL}/api/search`, {
        query: query || form.query, location: location || city,
        budget: budget || (form.budget ? parseFloat(form.budget) : null),
        age: age || user?.age || null,
        comorbidities: comorbidities || null,
        urgency: urgency || null,
      });
      setResults(res.data);

      // Show AI reasons in chat
      if (res.data.possible_reasons) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `🏥 **${res.data.results_count} hospitals found!**\n\n${res.data.possible_reasons}\n\n⚕️ Scroll down to see ranked results.`
        }]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch results.');
    } finally { setLoading(false); }
  };

  const [mapQuery, setMapQuery] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.query.trim() || !city.trim()) {
      setError('Please enter your symptom/procedure and location.');
      return;
    }
    setMapQuery(city || form.query);
    handleSearch();
  };

  const [loanResult, setLoanResult] = useState(null);

  const checkEligibility = async (hospital) => {
    setEligibilityLoading(true);
    setPreCheckResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/lender/underwrite`, {
        extracted_procedure: results?.parsed_intent?.extracted_procedure || form.query,
        location: hospital.city,
        age: user?.age || null,
        comorbidities: comorbidities || '',
        geo_tier: hospital.tier || 'tier2'
      });
      setPreCheckResult(res.data);
    } catch (err) {
      console.error("Eligibility check failed:", err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleOpenLoanModal = (hospital) => {
    setLoanModal(hospital);
    checkEligibility(hospital);
  };

  const submitLoanApplication = async (hospital) => {
    setLoanSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found. Please sign in again.");

      const rate = hospital.base_rates?.[results?.parsed_intent?.extracted_procedure?.toLowerCase()?.replace(/ /g, '_')];
      
      const payload = {
        patient_name: user?.displayName || user?.email || 'Anonymous Patient',
        patient_age: user?.age || 0,
        procedure: results?.parsed_intent?.extracted_procedure || form.query || 'Medical Procedure',
        hospital_name: hospital.name,
        hospital_city: hospital.city,
        estimated_cost_min: Math.round(preCheckResult?.underwriting?.total_min || (rate ? rate * 0.85 : 100000)),
        estimated_cost_max: Math.round(preCheckResult?.underwriting?.total_max || (rate ? rate * 1.35 : 200000)),
        loan_amount_requested: Math.round(preCheckResult?.underwriting?.total_min || rate || 150000),
        ayushman_coverage: 0,
        confidence_score: parseFloat(results?.confidence_score || 0.75),
        comorbidities: String(comorbidities || ''),
        geo_tier: hospital.tier || 'tier2',
        risk_flags: JSON.stringify(preCheckResult?.risk_flags || [])
      };

      console.log("[LoanApply] Sending payload:", payload);

      const res = await axios.post(`${API_URL}/api/loan/apply`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLoanResult(res.data);
      setLoanSuccess(true);
      
      setTimeout(() => { 
        setLoanModal(null); 
        setLoanSuccess(false); 
        setLoanResult(null);
        setPreCheckResult(null);
      }, 6000);
    } catch (err) {
      console.error("[LoanApply] Error:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : err.message);
      alert(`Submission Failed: ${msg || "Unknown error"}. Please try again.`);
    } finally {
      setLoanSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-10">
      <NeuralVortexBg />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Hero */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
              <Sparkles size={14} /> AI-Powered Healthcare Navigator
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight">
              Find the Right Hospital, <span className="text-gradient">Know the Real Cost</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Type your symptoms in <span className="text-slate-300 font-medium">any language</span> — English, Hindi, Hinglish, Marathi, Tamil — and chat with AI to find ranked hospitals.
            </p>
          </div>
        </motion.div>

        {/* AI Chat Interface */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl mb-6 overflow-hidden">

          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Bot size={14} className="text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-white">CURIFY AI Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {detectedLang && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                <Languages size={11} className="text-violet-400" />
                <span className="text-[10px] font-semibold text-violet-400 uppercase">{detectedLang}</span>
              </div>
            )}
          </div>



          {/* Nearby Hospitals Map Section */}
          <HospitalMap searchLocation={mapQuery} />
        </motion.div>

        {/* Manual Search Form */}
        <motion.form onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Stethoscope size={14} className="text-emerald-400" /> Search Fields
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 ${
                aiStatus === "idle" ? "bg-slate-500/5 border-slate-500/10 text-slate-500" :
                aiStatus === "loading" ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse" :
                aiStatus === "done" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {aiStatus === "idle" && <span className="text-[10px]">✦</span>}
                {aiStatus === "loading" && <Zap size={10} className="animate-bounce" />}
                {aiStatus === "done" && <CheckCircle2 size={10} />}
                {aiStatus === "error" && <AlertTriangle size={10} />}
                <span className="text-[9px] font-bold uppercase tracking-tight">
                  {aiStatus === "idle" && "AI AUTO-FILL"}
                  {aiStatus === "loading" && "AI Filling..."}
                  {aiStatus === "done" && "AI Filled"}
                  {aiStatus === "error" && "AI Unavailable"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <InputField icon={Search} label="Symptom/Procedure" value={form.query}
                onChange={(v) => setForm({ ...form, query: v })} placeholder='e.g., knee replacement' id="patient-query" />
              <InputField icon={MapPin} label="City / Pincode" value={city}
                onChange={(v) => setCity(v)} placeholder="e.g., Nagpur" id="patient-location" />
              <InputField icon={IndianRupee} label="Budget (₹)" value={form.budget}
                loading={formLoading.budget}
                onChange={(v) => setForm({ ...form, budget: v })} placeholder="e.g., 160000" id="patient-budget" />

              {/* Urgency Toggle */}
              <div className="flex flex-col">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                  <Zap size={10} className="text-emerald-400" /> Urgency
                </label>
                <div className="flex bg-white/[0.04] border border-white/10 rounded-xl p-1 h-[42px]">
                  <button type="button" onClick={() => setUrgency("emergency")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
                      urgency === "emergency" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400 hover:text-white"
                    }`}>
                    🚨 Emergency
                  </button>
                  <button type="button" onClick={() => setUrgency("planned")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
                      urgency === "planned" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
                    }`}>
                    📅 Planned
                  </button>
                </div>
              </div>

              <InputField icon={HeartPulse} label="Comorbidities" value={comorbidities}
                loading={formLoading.comorbidities}
                onChange={(v) => setComorbidities(v)} placeholder={aiComorbidities || "diabetes, BP"} id="patient-comorbidities" />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <motion.button type="submit" disabled={loading || chatLoading}
              className="btn-glow w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              {loading || chatLoading ? (
                <><Loader2 size={18} className="animate-spin" /> {chatLoading ? 'AI is analyzing query...' : 'Finding Hospitals...'}</>
              ) : (
                <><Zap size={18} /> Find Hospitals <ArrowRight size={14} /></>
              )}
            </motion.button>
          </div>
        </motion.form>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div className="space-y-4 mt-6" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-300 text-sm">Decision Support, Not Diagnosis</p>
                  <p className="text-amber-200/70 text-xs">DPDP Act 2023 Compliant • All estimates anchored to NHA/CGHS published rates.</p>
                </div>
              </div>

              {/* Results Header */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {results.results_count} Hospital{results.results_count !== 1 ? 's' : ''} Found
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Procedure: <span className="text-emerald-400 font-medium">{results.parsed_intent?.extracted_procedure?.replace(/_/g, ' ')}</span>
                    {results.parsed_intent?.icd10_code && (
                      <span className="ml-2 text-slate-600 font-mono text-[10px]">ICD-10: {results.parsed_intent.icd10_code}</span>
                    )}
                  </p>
                </div>
                <ConfidenceBadge score={results.confidence_score} />
              </div>

              {/* Clinical Pathways */}
              {results.parsed_intent?.clinical_pathway?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Dna size={12} className="text-violet-400" /> Clinical Pathway Probabilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.parsed_intent.clinical_pathway.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium text-slate-200">{p.procedure?.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                          {Math.round(p.probability * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hospital Cards */}
              <div className="space-y-3">
                {results.hospitals?.map((hospital, index) => (
                  <motion.div key={hospital.hospital_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}>
                    <HospitalCard hospital={hospital} index={index} procedure={results.parsed_intent?.extracted_procedure}
                      userBudget={form.budget ? parseFloat(form.budget) : null}
                      onApplyLoan={() => handleOpenLoanModal(hospital)} />
                  </motion.div>
                ))}
              </div>

              {/* Funding Gap */}
              {form.budget && results.hospitals?.length > 0 && (
                <FundingGap budget={parseFloat(form.budget)} hospitals={results.hospitals}
                  procedure={results.parsed_intent?.extracted_procedure} />
              )}

              {/* DPDP Badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-[11px] text-slate-500">DPDP Act 2023 Compliant • Data processed as per Digital Personal Data Protection Act</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loan Application Modal */}
        <AnimatePresence>
          {loanModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => !loanSubmitting && setLoanModal(null)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 space-y-4"
                onClick={e => e.stopPropagation()}>
                {loanSuccess ? (
                  <div className="text-center py-4 space-y-4">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-2" />
                    <h3 className="text-lg font-bold text-white">Application Submitted!</h3>
                    <p className="text-sm text-slate-400">
                      {loanResult?.message || 'Your loan application has been sent for review.'}
                    </p>
                    {loanResult?.eligible_lenders?.length > 0 && (
                      <div className="space-y-2 text-left">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Matched Lenders</p>
                        {loanResult.eligible_lenders.map((l, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                            <div>
                              <div className="text-xs font-semibold text-white">{l.lender_name}</div>
                              <div className="text-[10px] text-slate-500">{l.interest_rate}% p.a. • EMI ₹{(l.emi_estimate_12m/1000).toFixed(1)}K/mo</div>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                              {Math.round(l.approval_probability * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {loanResult?.risk_level && (
                      <div className="text-[11px] text-slate-500">
                        Risk: <span className={`font-bold ${loanResult.risk_level === 'Low' ? 'text-emerald-400' : loanResult.risk_level === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>{loanResult.risk_level}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText size={18} className="text-emerald-400" /> Apply for Healthcare Loan
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Hospital</span><span className="text-white font-medium">{loanModal.name}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Procedure</span><span className="text-emerald-400 capitalize">{results?.parsed_intent?.extracted_procedure?.replace(/_/g, ' ')}</span></div>
                        {preCheckResult && (
                          <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                            <span className="text-slate-400">Estimated Total Cost</span>
                            <span className="text-white font-bold text-sm">₹{(preCheckResult.underwriting.total_min / 100000).toFixed(1)}L - ₹{(preCheckResult.underwriting.total_max / 100000).toFixed(1)}L</span>
                          </div>
                        )}
                      </div>

                      {eligibilityLoading ? (
                        <div className="py-8 text-center space-y-3">
                          <Loader2 size={32} className="mx-auto text-emerald-500 animate-spin" />
                          <p className="text-xs text-slate-400">Matching you with the best lenders...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Available Lending Options</p>
                          {preCheckResult?.eligible_lenders?.length > 0 ? (
                            <div className="space-y-2">
                              {preCheckResult.eligible_lenders.map((l, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 group hover:bg-emerald-500/10 transition-all">
                                  <div>
                                    <div className="text-xs font-bold text-white">{l.lender_name}</div>
                                    <div className="text-[10px] text-emerald-400/70">{l.interest_rate}% p.a. • EMI starting ₹{(l.emi_estimate_12m/1000).toFixed(1)}K/mo</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-bold text-emerald-400">{Math.round(l.approval_probability * 100)}% Match</div>
                                    <div className="text-[9px] text-slate-500 italic">12-mo tenure</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                              <p className="text-xs text-amber-400">No direct matches found. Submit to request manual review from our banking partners.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => submitLoanApplication(loanModal)} disabled={loanSubmitting || eligibilityLoading}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loanSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                      {loanSubmitting ? 'Processing Application...' : 'Submit Final Application'}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center italic">By clicking submit, you agree to share your medical profile with the selected lenders under DPDP Act 2023.</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, value, onChange, placeholder, type = 'text', id, loading }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
        <Icon size={10} className="text-emerald-400" /> {label}
      </label>
      <div className="relative group">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} 
          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all pr-10 hover:bg-white/[0.06]" 
          id={id} 
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && (
            <Loader2 size={14} className="text-emerald-500 animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}

function FundingGap({ budget, hospitals, procedure }) {
  const rate = hospitals[0]?.base_rates?.[procedure?.toLowerCase()?.replace(/ /g, '_')];
  if (!rate) return null;
  const gap = rate - budget;
  const isUnder = gap > 0;
  return (
    <div className={`rounded-xl border p-4 ${isUnder ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
      <h3 className="text-sm font-bold text-white mb-1">
        {isUnder ? '⚠ Financial Triage: Funding Gap Detected' : '✓ Budget Sufficient'}
      </h3>
      <p className="text-xs text-slate-400">
        Budget: <span className="font-bold text-white">₹{(budget / 100000).toFixed(1)}L</span> |
        Top hospital estimate: <span className="font-bold text-white">₹{(rate / 100000).toFixed(1)}L</span>
        {isUnder && (
          <span className="block mt-1 text-amber-400 font-medium">
            Gap: ₹{(gap / 1000).toFixed(0)}K — A healthcare loan of ₹{(gap / 1000).toFixed(0)}K would cover the shortfall. Apply above!
          </span>
        )}
      </p>
    </div>
  );
}
