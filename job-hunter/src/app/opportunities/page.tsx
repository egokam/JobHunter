'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, ExternalLink, Check, X, Send, Briefcase, ChevronDown, Minus, Loader2, Trash2, Download, MapPin, Banknote } from 'lucide-react';
import Link from 'next/link';

type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: 'pending' | 'approved' | 'published' | 'rejected';
  source: string;
  work_type?: string;
  salary?: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' }
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' }
];

export default function OpportunitiesDatabase() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  
  // Bulk Selection & Cleanup States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOpportunities();
    autoCleanup(); // Run silent cleanup for 7-days old records

    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setIsStatusOpen(false);
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) setIsSourceOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear selections when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, statusFilter, sourceFilter]);

  // SILENT 7-DAY AUTO CLEANUP
  const autoCleanup = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('opportunities')
        .delete()
        .in('status', ['published', 'rejected'])
        .lt('created_at', sevenDaysAgo);
    } catch (e) {
      console.error('Auto-cleanup failed silently', e);
    }
  };

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

  // EMPTY RECYCLE BIN (MANUAL)
  const emptyBin = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all published and rejected offers to optimize the database?')) return;
    setIsEmptying(true);
    try {
      await supabase
        .from('opportunities')
        .delete()
        .in('status', ['published', 'rejected']);
      await fetchOpportunities();
    } catch (e) {
      console.error(e);
    } finally {
      setIsEmptying(false);
    }
  };

  const filteredData = opportunities.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || item.source.toLowerCase() === sourceFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const binCount = opportunities.filter(o => o.status === 'published' || o.status === 'rejected').length;

  // Bulk Selection Logic
  const isAllSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < filteredData.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (newStatus: 'approved' | 'rejected' | 'published') => {
    setIsProcessingBulk(true);
    try {
      const itemsToProcess = opportunities.filter(o => selectedIds.includes(o.id));

      if (newStatus === 'published') {
        for (const item of itemsToProcess) {
          if (item.status !== 'published') {
            const res = await fetch('http://localhost:5000/api/publish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
            const result = await res.json();
            if (!result.success) console.error('Error publishing:', result.error);
          }
        }
      }

      const { error } = await supabase
        .from('opportunities')
        .update({ status: newStatus })
        .in('id', selectedIds);

      if (error) throw error;

      setSelectedIds([]);
      fetchOpportunities();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // CSV EXPORT LOGIC
  const exportToCSV = () => {
    const headers = ['Title', 'Company', 'Location', 'Work Type', 'Salary', 'Platform', 'Status', 'Date Hunted', 'URL'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.company.replace(/"/g, '""')}"`,
        `"${item.location.replace(/"/g, '""')}"`,
        `"${item.work_type || 'Not Specified'}"`,
        `"${item.salary || 'Not Specified'}"`,
        `"${item.source}"`,
        `"${item.status}"`,
        `"${new Date(item.created_at).toLocaleDateString('en-GB')}"`,
        `"${item.url}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `JobHunter_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-8 bg-[#0a0f1c] text-slate-50 flex flex-col items-center relative overflow-hidden">
      
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <header className="w-full max-w-7xl mb-8 relative z-50 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/5 backdrop-blur-md w-fit group shadow-lg shadow-black/20">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
              className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-xl text-sm font-medium backdrop-blur-md transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 group w-full sm:w-auto"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              Export CSV
            </button>
            <button
              onClick={emptyBin}
              disabled={isEmptying || binCount === 0}
              className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-medium backdrop-blur-md transition-all shadow-lg shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto"
            >
              {isEmptying ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="group-hover:scale-110 transition-transform" />}
              Empty Bin ({binCount})
            </button>
            <div className="hidden sm:block bg-indigo-500/10 border border-indigo-500/20 px-5 py-2.5 rounded-xl text-sm font-medium backdrop-blur-md text-indigo-200 shadow-lg shadow-indigo-500/10">
              Total Records: <span className="text-white ml-1 text-base">{filteredData.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            
            <div className="relative flex-1 md:w-48" ref={statusRef}>
              <div 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white cursor-pointer flex justify-between items-center hover:border-white/20 transition-all group"
              >
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors" size={18} />
                <span className="text-sm font-medium">{STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute w-full top-full mt-2 bg-slate-800/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="py-2">
                      {STATUS_OPTIONS.map((option) => (
                        <div 
                          key={option.value}
                          onClick={() => { setStatusFilter(option.value); setIsStatusOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors text-slate-300 hover:text-white text-sm"
                        >
                          <span>{option.label}</span>
                          {statusFilter === option.value && <Check size={16} className="ml-auto text-indigo-400" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex-1 md:w-48" ref={sourceRef}>
              <div 
                onClick={() => setIsSourceOpen(!isSourceOpen)}
                className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white cursor-pointer flex justify-between items-center hover:border-white/20 transition-all group"
              >
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 transition-colors" size={18} />
                <span className="text-sm font-medium">{SOURCE_OPTIONS.find(opt => opt.value === sourceFilter)?.label}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isSourceOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isSourceOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute w-full top-full mt-2 bg-slate-800/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="py-2">
                      {SOURCE_OPTIONS.map((option) => (
                        <div 
                          key={option.value}
                          onClick={() => { setSourceFilter(option.value); setIsSourceOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors text-slate-300 hover:text-white text-sm"
                        >
                          <span>{option.label}</span>
                          {sourceFilter === option.value && <Check size={16} className="ml-auto text-indigo-400" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl relative z-10 pb-32">
        <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-white/5 bg-black/20">
                <tr>
                  <th className="px-6 py-5 w-16">
                    <div 
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors border ${
                        isAllSelected 
                          ? 'bg-indigo-500 border-indigo-500' 
                          : isPartiallySelected 
                            ? 'bg-indigo-500/50 border-indigo-500' 
                            : 'bg-black/30 border-slate-500 hover:border-indigo-400'
                      }`}
                    >
                      {isAllSelected && <Check size={14} className="text-white" />}
                      {isPartiallySelected && <Minus size={14} className="text-white" />}
                    </div>
                  </th>
                  <th className="px-6 py-5 font-medium">Position Details</th>
                  <th className="px-6 py-5 font-medium">Platform</th>
                  <th className="px-6 py-5 font-medium">Status</th>
                  <th className="px-6 py-5 font-medium">Date Hunted</th>
                  <th className="px-6 py-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Search size={40} className="text-slate-600 mb-2" />
                        <p className="text-lg">No opportunities found.</p>
                        <p className="text-sm text-slate-600">Try adjusting your advanced filters or search term.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, i) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        key={item.id} 
                        onClick={() => toggleSelect(item.id)}
                        className={`hover:bg-white/[0.04] transition-colors group cursor-pointer ${isSelected ? 'bg-indigo-500/5' : ''}`}
                      >
                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                          <div 
                            onClick={() => toggleSelect(item.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors border ${
                              isSelected 
                                ? 'bg-indigo-500 border-indigo-500' 
                                : 'bg-black/30 border-slate-500 hover:border-indigo-400 group-hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-200 group-hover:text-white transition-colors text-base mb-1">{item.title}</div>
                          <div className="text-slate-500 text-sm flex items-center gap-2">
                            <span className="text-slate-300 font-medium">{item.company}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" /> 
                            {item.location}
                          </div>
                          {/* Badges للبيانات الغنية (Rich Data) */}
                          {(item.work_type || item.salary) && (
                            <div className="flex flex-wrap gap-2 mt-2.5">
                              {item.work_type && (
                                <span className="flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                                  <MapPin size={10} /> {item.work_type}
                                </span>
                              )}
                              {item.salary && (
                                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium tracking-wider">
                                  <Banknote size={10} /> {item.salary}
                                </span>
                              )}
                            </div>
                          )}
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
                        <td className="px-6 py-5 text-slate-400 font-medium">
                          {new Date(item.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {item.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(item, 'approved')} className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20" title="Approve">
                                <Check size={18} />
                              </button>
                              <button onClick={() => updateStatus(item, 'rejected')} className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20" title="Reject">
                                <X size={18} />
                              </button>
                            </>
                          )}
                          {item.status === 'approved' && (
                            <button onClick={() => updateStatus(item, 'published')} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                              <Send size={16} />
                              <span className="font-medium">Publish</span>
                            </button>
                          )}
                          <a href={item.url} target="_blank" rel="noreferrer" className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border border-transparent hover:border-indigo-500/20">
                            <ExternalLink size={18} />
                          </a>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-slate-800/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-2 text-slate-300 font-medium border-r border-white/10 pr-6">
              <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {selectedIds.length}
              </span>
              Selected
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleBulkAction('approved')}
                disabled={isProcessingBulk}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors disabled:opacity-50"
              >
                <Check size={16} /> Approve All
              </button>
              
              <button 
                onClick={() => handleBulkAction('rejected')}
                disabled={isProcessingBulk}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
              >
                <X size={16} /> Reject All
              </button>
              
              <button 
                onClick={() => handleBulkAction('published')}
                disabled={isProcessingBulk}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
              >
                {isProcessingBulk ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}