'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, Briefcase, Clock, CheckCircle, ChevronRight, ExternalLink, Check, X, Send, Sparkles, ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';

type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: 'pending' | 'approved' | 'published' | 'rejected';
  source: string;
  created_at: string;
};

const COUNTRIES = [
  { name: 'Remote', flag: '🌍' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Netherlands', flag: '🇳🇱' },
];

const TECH_KEYWORDS = [
  'full stack', 'frontend', 'backend', 'react', 'next.js', 
  'typescript', 'javascript', 'tailwind css', 'supabase', 
  'node.js', 'express', 'linux', 'git', 'web developer'
];

const AI_TYPOS: Record<string, string> = {
  'developpr': 'developer',
  'reac': 'react',
  'phyton': 'python',
  'node js': 'node.js',
  'front-end': 'frontend',
  'back-end': 'backend',
  'javscript': 'javascript'
};

const AI_RELATIONS: Record<string, string> = {
  'react': 'next.js',
  'next.js': 'tailwind css',
  'typescript': 'react',
  'nodejs': 'express',
  'frontend': 'react',
  'backend': 'supabase',
  'full stack': 'typescript'
};

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState({
    keywords: ['developer'],
    location: COUNTRIES[1],
    linkedin: true,
    indeed: false
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{ type: 'typo' | 'relation' | 'autocomplete', text: string } | null>(null);
  
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOpportunities();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const inputLower = keywordInput.toLowerCase().trim();

    if (inputLower && AI_TYPOS[inputLower]) {
      setAiSuggestion({ type: 'typo', text: AI_TYPOS[inputLower] });
      return;
    }

    if (inputLower.length >= 2) {
      const autocompleteMatch = TECH_KEYWORDS.find(tech => 
        tech.startsWith(inputLower) && 
        tech !== inputLower && 
        !settings.keywords.map(k => k.toLowerCase()).includes(tech)
      );
      
      if (autocompleteMatch) {
        setAiSuggestion({ type: 'autocomplete', text: autocompleteMatch });
        return;
      }
    }

    if (settings.keywords.length > 0 && inputLower.length === 0) {
      const lastWord = settings.keywords[settings.keywords.length - 1].toLowerCase();
      if (AI_RELATIONS[lastWord] && !settings.keywords.map(k => k.toLowerCase()).includes(AI_RELATIONS[lastWord])) {
        setAiSuggestion({ type: 'relation', text: AI_RELATIONS[lastWord] });
        return;
      }
    }
    
    setAiSuggestion(null);
  }, [keywordInput, settings.keywords]);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOpportunities(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (item: Opportunity, newStatus: 'approved' | 'rejected' | 'published') => {
    try {
      if (newStatus === 'published') {
        const res = await fetch('http://localhost:5000/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
      }

      const { error } = await supabase
        .from('opportunities')
        .update({ status: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRunScraper = async () => {
    setIsScraping(true);
    try {
      const payload = {
        keyword: settings.keywords.join(' '),
        location: settings.location.name,
        linkedin: settings.linkedin,
        indeed: settings.indeed
      };

      const response = await fetch('http://localhost:5000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        fetchOpportunities();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsScraping(false);
    }
  };

  const addKeyword = (word: string) => {
    const trimmed = word.trim();
    if (trimmed && !settings.keywords.includes(trimmed)) {
      setSettings({ ...settings, keywords: [...settings.keywords, trimmed] });
    }
    setKeywordInput('');
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(keywordInput);
    }
  };

  const removeKeyword = (indexToRemove: number) => {
    setSettings({
      ...settings,
      keywords: settings.keywords.filter((_, index) => index !== indexToRemove)
    });
  };

  const stats = {
    total: opportunities.length,
    pending: opportunities.filter(o => o.status === 'pending').length,
    published: opportunities.filter(o => o.status === 'published').length,
  };

  const recentOpportunities = opportunities.slice(0, 5);
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

  return (
    <div className="min-h-screen p-8 bg-[#0a0f1c] text-slate-50 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-slate-900/80 border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-[0_0_40px_rgba(79,70,229,0.15)] backdrop-blur-xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Engine Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Target Keywords</label>
                  <div className="w-full bg-black/30 border border-white/10 rounded-xl p-2 min-h-[56px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                    {settings.keywords.map((kw, idx) => (
                      <span key={idx} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 backdrop-blur-md">
                        {kw}
                        <button onClick={() => removeKeyword(idx)} className="hover:text-white transition-colors"><X size={14} /></button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      className="flex-1 bg-transparent border-none outline-none text-white px-2 py-1 min-w-[120px] placeholder:text-slate-600"
                      placeholder="Add keyword..."
                    />
                  </div>
                  
                  <AnimatePresence>
                    {aiSuggestion && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-2 mt-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg"
                      >
                        <Sparkles size={16} className="text-purple-400" />
                        <span className="text-sm text-purple-200">
                          {aiSuggestion.type === 'typo' && 'Did you mean '}
                          {aiSuggestion.type === 'relation' && 'Consider adding '}
                          {aiSuggestion.type === 'autocomplete' && 'Suggested: '}
                          <span className="font-bold text-purple-400">{aiSuggestion.text}</span>?
                        </span>
                        <button 
                          onClick={() => {
                            if (aiSuggestion.type === 'typo') setKeywordInput(aiSuggestion.text);
                            else addKeyword(aiSuggestion.text);
                            setAiSuggestion(null);
                          }}
                          className="ml-auto text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-2 py-1 rounded transition-colors"
                        >
                          Apply
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="space-y-2 relative" ref={countryRef}>
                  <label className="text-sm font-medium text-slate-300">Target Location</label>
                  <div 
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-white">
                      <span className="text-xl">{settings.location.flag}</span>
                      <span>{settings.location.name}</span>
                    </div>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {isCountryOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute w-full top-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                      >
                        <div className="p-3 border-b border-white/10 bg-black/20">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Search country..." 
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full bg-black/30 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto py-2 custom-scrollbar">
                          {filteredCountries.map((country, idx) => (
                            <div 
                              key={idx}
                              onClick={() => { setSettings({...settings, location: country}); setIsCountryOpen(false); setCountrySearch(''); }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors text-slate-200 hover:text-white"
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span>{country.name}</span>
                              {settings.location.name === country.name && <Check size={16} className="ml-auto text-indigo-400" />}
                            </div>
                          ))}
                          {filteredCountries.length === 0 && <div className="px-4 py-3 text-sm text-slate-500 text-center">No countries found.</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="text-sm font-medium text-slate-300">Data Sources</label>
                  <div className="flex flex-col gap-3">
                    <div 
                      onClick={() => setSettings({...settings, linkedin: !settings.linkedin})}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <span className="font-medium text-slate-200">LinkedIn</span>
                      <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${settings.linkedin ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.linkedin ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setSettings({...settings, indeed: !settings.indeed})}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <span className="font-medium text-slate-200">Indeed</span>
                      <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${settings.indeed ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.indeed ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full max-w-6xl flex justify-between items-center py-8 z-10">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-black tracking-tighter text-white flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Briefcase size={18} className="text-white" />
          </div>
          Job<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Hunter</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4 items-center"
        >
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">System Online</span>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md text-slate-300 hover:text-white"
          >
            <Settings size={20} />
          </button>

          <button 
            onClick={handleRunScraper}
            disabled={isScraping}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-md border ${
              isScraping 
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 cursor-not-allowed' 
                : 'bg-indigo-600/90 hover:bg-indigo-500 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'
            }`}
          >
            {isScraping ? (
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={16} className="fill-current" />
            )}
            {isScraping ? 'Hunting...' : 'Run Engine'}
          </button>
        </motion.div>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-8 z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Total Hunted', value: stats.total, icon: Briefcase, color: 'text-blue-400', bg: 'from-blue-500/10 to-transparent', border: 'border-blue-500/20' },
            { title: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/20' },
            { title: 'Published', value: stats.published, icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/20' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden bg-white/5 border ${stat.border} p-6 rounded-2xl backdrop-blur-md`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-50`} />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-slate-400 text-sm font-medium mb-1">{stat.title}</h2>
                  <p className="text-4xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-2 h-6 rounded-full bg-indigo-500" />
              Recent Operations
            </h2>
            <Link href="/opportunities" className="group flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl">
              Show All Database
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-white/5 bg-black/20">
                <tr>
                  <th className="px-6 py-5 font-medium">Position & Company</th>
                  <th className="px-6 py-5 font-medium">Platform</th>
                  <th className="px-6 py-5 font-medium">Status</th>
                  <th className="px-6 py-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                    </td>
                  </tr>
                ) : recentOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Data warehouse is empty. Run engine to hunt.</td>
                  </tr>
                ) : (
                  recentOpportunities.map((item, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={item.id} 
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{item.title}</div>
                        <div className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                          {item.company} <span className="w-1 h-1 rounded-full bg-slate-600" /> {item.location}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          item.source === 'LinkedIn' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        }`}>
                          {item.source}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          item.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          item.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          item.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'pending' ? 'bg-amber-400' :
                            item.status === 'approved' ? 'bg-blue-400' :
                            item.status === 'published' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        {item.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(item, 'approved')} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20" title="Approve">
                              <Check size={18} />
                            </button>
                            <button onClick={() => updateStatus(item, 'rejected')} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20" title="Reject">
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {item.status === 'approved' && (
                          <button onClick={() => updateStatus(item, 'published')} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Send size={14} />
                            Publish
                          </button>
                        )}
                        <a href={item.url} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent hover:border-indigo-500/20">
                          <ExternalLink size={18} />
                        </a>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}