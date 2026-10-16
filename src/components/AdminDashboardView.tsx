import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Camera,
  Upload,
  BookOpen,
  Users,
  FileText,
  Trash2,
  Download,
  Settings,
  Plus,
  CheckCircle2,
  ChevronRight,
  Database,
  Award,
  Search,
  Check,
  UserPlus,
  X
} from 'lucide-react';
import { Lesson } from '../types';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { sounds } from '../utils/audio';

interface AdminDashboardViewProps {
  lessons: Lesson[];
  onScanClick: () => void;
  onUploadClick: () => void;
  onSelectSop: (id: string, title: string) => void;
  onDeleteSop?: (id: string) => void;
  onOpenRoleSwitcher: () => void;
  onBackToHome?: () => void;
}

const INITIAL_USERS = [
  { id: 'u1', name: 'Vikram Sharma', email: 'vikram.s@org.internal', role: 'Admin', department: 'Executive Operations', status: 'Active' },
  { id: 'u2', name: 'Priya Patel', email: 'priya.p@org.internal', role: 'Learner', department: 'Sterile Cleanroom', status: 'Active' },
  { id: 'u3', name: 'Carlos Mendez', email: 'carlos.m@org.internal', role: 'Learner', department: 'Housekeeping Services', status: 'Active' },
  { id: 'u4', name: 'Amina Al-Mansoor', email: 'amina.a@org.internal', role: 'Learner', department: 'Manufacturing', status: 'Active' },
  { id: 'u5', name: 'David Kim', email: 'david.k@org.internal', role: 'Manager', department: 'Floor Operations', status: 'Active' },
  { id: 'u6', name: 'Sarah Jenkins', email: 'sarah.j@org.internal', role: 'Manager', department: 'Quality Assurance', status: 'Active' },
];

const INITIAL_CAMPAIGNS = [
  { id: 'c1', title: 'Q4 Cleanroom Sterilization Protocol', sop: 'Aseptic Hand Hygiene & Gowning', target: 'Cleanroom Division (42 Staff)', completion: 94 },
  { id: 'c2', title: 'High-Touch Disinfection Mandate', sop: 'Room Sanitization & Disinfection', target: 'Housekeeping Services (68 Staff)', completion: 88 },
  { id: 'c3', title: 'ESD Assembly Line Re-Certification', sop: 'Precision Mechanical Assembly', target: 'Assembly Technicians (32 Staff)', completion: 100 },
];

export const getModuleCreationDate = (lesson: Lesson, index: number): string => {
  if (lesson.createdAt) return lesson.createdAt;
  const seedDates = [
    'Oct 14, 2026',
    'Oct 12, 2026',
    'Oct 09, 2026',
    'Oct 05, 2026',
    'Sep 28, 2026',
    'Sep 20, 2026',
    'Sep 15, 2026',
  ];
  return seedDates[index % seedDates.length];
};

export const getModuleAssignedStatus = (lesson: Lesson, campaigns: any[]): 'Assigned' | 'Not Assigned' => {
  if (lesson.assignedStatus) return lesson.assignedStatus;
  if (lesson.isAssigned !== undefined) return lesson.isAssigned ? 'Assigned' : 'Not Assigned';
  const assignedInCampaign = campaigns.some((c) =>
    (c.sop && lesson.title && c.sop.toLowerCase().includes(lesson.title.toLowerCase())) ||
    (c.sop && lesson.title && lesson.title.toLowerCase().includes(c.sop.toLowerCase()))
  );
  const isAssignedCommon = ['housekeeping_sanitization', 'picking-101', 'safety-first'].includes(lesson.id);
  return assignedInCampaign || isAssignedCommon ? 'Assigned' : 'Not Assigned';
};

export default function AdminDashboardView({
  lessons,
  onScanClick,
  onUploadClick,
  onSelectSop,
  onDeleteSop,
  onOpenRoleSwitcher,
  onBackToHome,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'users' | 'assignments' | 'reports' | 'settings'>('content');

  // Ensure scroll is at the top when entering Admin
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Search & Filter
  const [contentSearch, setContentSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Roster, Campaigns & Settings state
  const [userList, setUserList] = useState(INITIAL_USERS);
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Learner' | 'Manager' | 'Admin'>('Learner');
  const [newUserDept, setNewUserDept] = useState('');
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);
  const [minPassScore, setMinPassScore] = useState(85);
  const [maxRetries, setMaxRetries] = useState(3);
  const [strictMode, setStrictMode] = useState(true);

  // Fallback to INITIAL_LESSONS if lessons array is empty
  const effectiveLessons = useMemo(() => {
    return Array.isArray(lessons) && lessons.length > 0 ? lessons : INITIAL_LESSONS;
  }, [lessons]);

  // Filtered Content
  const filteredLessons = useMemo(() => {
    return effectiveLessons.filter((l) =>
      (l?.title || '').toLowerCase().includes(contentSearch.toLowerCase()) ||
      ((l?.category || '') && l.category.toLowerCase().includes(contentSearch.toLowerCase()))
    );
  }, [effectiveLessons, contentSearch]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userList.filter((u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [userList, userSearch]);

  const handleExportCSV = () => {
    sounds.playTap();
    const csvContent =
      "Learner Name,Role,Department,Assigned SOP,Score,Status,Date\n" +
      "Vikram Sharma,Admin,Executive Operations,Room Sanitization,100%,Certified,2026-10-16\n" +
      "Priya Patel,Learner,Sterile Cleanroom,Aseptic Hand Hygiene,92%,Certified,2026-10-16\n" +
      "Carlos Mendez,Learner,Housekeeping Services,Order Picking,88%,Certified,2026-10-15\n" +
      "Amina Al-Mansoor,Learner,Manufacturing,Precision Assembly,96%,Certified,2026-10-14";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOP_Compliance_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    sounds.playTap();
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 2000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setUserList((prev) => [
      ...prev,
      {
        id: `u${Date.now()}`,
        name: newUserName.trim(),
        email: `${newUserName.toLowerCase().replace(/\s+/g, '.')}@org.internal`,
        role: newUserRole,
        department: newUserDept.trim() || 'Operations',
        status: 'Active',
      },
    ]);
    setNewUserName('');
    setIsAddUserModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 pb-16 text-white relative z-10 w-full max-w-4xl mx-auto space-y-5 font-sans select-none animate-in fade-in duration-150">
      
      {/* 1. Header (Clean, Flat, No Neon) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          {onBackToHome && (
            <button
              onClick={() => {
                sounds.playTap();
                onBackToHome();
              }}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1 mb-2 font-medium cursor-pointer transition-colors"
            >
              ← Back to Frontline (Guruji)
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Administration Control Center
          </h1>
          <p className="text-xs text-white/70 font-medium mt-0.5">
            Users · Content · Assignments · Reports · Settings
          </p>
        </div>
      </div>

      {/* 2. PILLAR 1: Scan & Upload Authority */}
      <div className="rounded-2xl border border-white/15 bg-black p-5 flex flex-col items-center justify-center text-center gap-4">
        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-bold text-sky-400">Scan & Upload Authority</span>
            <span className="text-[10px] font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
            Sole authority to scan SOPs with camera OCR, upload document files, and create training decks.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 w-full max-w-md">
          <button
            onClick={() => {
              sounds.playTap();
              onScanClick();
            }}
            className="flex-1 py-3 px-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera size={18} className="text-sky-400" />
            <span>Scan SOP</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onUploadClick();
            }}
            className="flex-1 py-3 px-5 rounded-xl bg-white text-black hover:bg-white/90 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload size={18} />
            <span>Upload SOP</span>
          </button>
        </div>
      </div>

      {/* 3. Flat Tab Selector with Mustard Pill Text */}
      <div className="grid grid-cols-5 gap-1 bg-black p-1 rounded-xl border border-white/10">
        {[
          { id: 'content', label: 'Content' },
          { id: 'users', label: 'Users' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'reports', label: 'Reports' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playTap();
                setActiveTab(tab.id as any);
              }}
              className={`py-2 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold text-center transition-all cursor-pointer truncate ${
                isActive
                  ? 'bg-white/15 text-[#E5A93C] shadow-sm font-bold'
                  : 'text-[#E5A93C]/60 hover:text-[#E5A93C]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CONTENT (SOP REPOSITORY) */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={14} />
              <input
                type="text"
                placeholder="Search repository SOPs..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
            <span className="text-xs text-white/50 font-mono shrink-0 hidden sm:inline">
              Zero-Cost Disk Ready
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {filteredLessons.map((lesson, idx) => {
              const createdDate = getModuleCreationDate(lesson, idx);
              const assignedStatus = getModuleAssignedStatus(lesson, campaigns);
              const isAssigned = assignedStatus === 'Assigned';

              return (
                <div
                  key={lesson.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      {/* Very small dot: subtle natural forest green if assigned (no neon), neutral grey if not assigned */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isAssigned ? 'bg-[#15803d]' : 'bg-[#52525b]'
                        }`}
                        title={isAssigned ? 'Assigned' : 'Not Assigned'}
                      />
                      <h4 className="text-base sm:text-lg font-bold text-white leading-snug">{lesson.title}</h4>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-1 pl-4.5">{lesson.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onSelectSop(lesson.id, lesson.title);
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer transition-colors"
                    >
                      Inspect
                    </button>

                    {/* Date placed right near the delete icon */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/40">
                        {createdDate}
                      </span>

                      {onDeleteSop && (
                        <button
                          onClick={() => {
                            sounds.playTap();
                            if (confirm(`Delete '${lesson.title}' from the repository?`)) {
                              onDeleteSop(lesson.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                          title="Delete SOP"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USERS (STAFF & ASSOCIATE ROSTER) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={14} />
              <input
                type="text"
                placeholder="Search staff by name or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={() => {
                sounds.playTap();
                setIsAddUserModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 cursor-pointer shrink-0"
            >
              + Add User
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <span className="text-sm font-bold text-white block">{u.name}</span>
                  <span className="text-xs text-white/50 block font-mono">{u.email}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/60 hidden sm:inline">{u.department}</span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80">
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS (TRAINING CAMPAIGNS) */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white">Organization-Wide Training Campaigns</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Deploy mandatory procedures and track frontline compliance across cohorts.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{camp.title}</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    SOP: {camp.sop} · Target: {camp.target}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-white/80">
                    {camp.completion}% Completed
                  </span>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      alert(`Campaign reminders dispatched to ${camp.target}.`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer"
                  >
                    Nudge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS (AUDIT CSV EXPORT) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Audit-Ready Compliance Reporting</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Generate timestamped compliance CSV verification records certifying completed solo drills.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Download size={14} />
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Compliance Rate</span>
              <span className="text-xl font-bold text-white mt-0.5 block">94.2%</span>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Certified Associates</span>
              <span className="text-xl font-bold text-white mt-0.5 block">142</span>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Safety Non-Conformances</span>
              <span className="text-xl font-bold text-white mt-0.5 block">0</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Global Training & Safety Controls</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Pass threshold (85%), retry limits, and strict safety breach controls.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-3.5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 cursor-pointer shrink-0"
            >
              Save Settings
            </button>
          </div>

          {savedSettingsNotice && (
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white">
              System parameters saved successfully.
            </div>
          )}

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {/* Setting 1: Passing Score */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-white block">Global Passing Score Threshold</span>
                <span className="text-xs text-white/50 block mt-0.5">
                  Solo Test Me score required for certification (Preset: 85%).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="60"
                  max="100"
                  value={minPassScore}
                  onChange={(e) => setMinPassScore(Number(e.target.value))}
                  className="w-16 h-9 rounded-lg bg-white/5 border border-white/15 text-center text-xs font-bold text-white"
                />
                <span className="text-xs font-bold text-white">%</span>
              </div>
            </div>

            {/* Setting 2: Retry Limit */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-white block">Assessment Retry Limits</span>
                <span className="text-xs text-white/50 block mt-0.5">
                  Attempts allowed before triggering supervisor observation.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      sounds.playTap();
                      setMaxRetries(num);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      maxRetries === num
                        ? 'bg-white text-black font-bold'
                        : 'border border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Setting 3: Strict Safety Breach Controls */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-white block">Strict Safety Breach Lockdown</span>
                <span className="text-xs text-white/50 block mt-0.5">
                  Instant failure if any critical safety control gate is violated.
                </span>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setStrictMode(!strictMode);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  strictMode
                    ? 'bg-white text-black font-bold'
                    : 'border border-white/10 text-white/60'
                }`}
              >
                {strictMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-black border border-white/15 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Add Staff / Associate</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs text-white/50 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full h-9 px-2 rounded-lg bg-black border border-white/15 text-xs text-white focus:outline-none"
                >
                  <option value="Learner">Learner</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Cleanroom"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-white text-black font-bold text-xs"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
