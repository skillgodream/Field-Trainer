import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Eye,
  Award,
  RotateCcw
} from 'lucide-react';
import { Lesson } from '../types';
import {
  getStoredPilotLearners,
  SEED_LEARNERS,
  PilotLearner,
  calculatePilotScorecard
} from '../utils/pilotManager';
import NewLearnerAssignmentModal from './NewLearnerAssignmentModal';
import SupervisorObservationModal from './SupervisorObservationModal';
import LearnerEvidenceReportModal from './LearnerEvidenceReportModal';
import { sounds } from '../utils/audio';

interface ManagerDashboardViewProps {
  lessons: Lesson[];
  onSelectSop: (id: string, title: string) => void;
  onOpenRoleSwitcher: () => void;
  onBackToHome?: () => void;
}

export default function ManagerDashboardView({
  lessons,
  onSelectSop,
  onOpenRoleSwitcher,
  onBackToHome,
}: ManagerDashboardViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'assign' | 'scores'>('team');
  const [learners, setLearners] = useState<PilotLearner[]>(() => {
    try {
      const stored = getStoredPilotLearners();
      return Array.isArray(stored) && stored.length > 0 ? stored : SEED_LEARNERS;
    } catch {
      return SEED_LEARNERS;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeObservationLearner, setActiveObservationLearner] = useState<PilotLearner | null>(null);
  const [activeEvidenceLearner, setActiveEvidenceLearner] = useState<PilotLearner | null>(null);

  const scorecard = useMemo(() => {
    try {
      return calculatePilotScorecard('All');
    } catch {
      return {
        totalAssigned: learners.length,
        workplaceCertifiedCount: learners.filter((l) => l.workplaceReadiness === 'workplace_demonstration_passed').length,
        awaitingSupervisorCount: 1,
        remediationOutstandingCount: 0,
      };
    }
  }, [learners]);

  const filteredLearners = useMemo(() => {
    if (!Array.isArray(learners)) return [];
    return learners.filter((l) => {
      const name = l?.name || '';
      const domain = l?.domain || '';
      const role = l?.role || '';
      const q = searchQuery.toLowerCase();
      return name.toLowerCase().includes(q) || domain.toLowerCase().includes(q) || role.toLowerCase().includes(q);
    });
  }, [learners, searchQuery]);

  // Ensure scroll is at the top when entering Manager
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 pb-32 text-white relative z-10 w-full max-w-4xl mx-auto space-y-5 font-sans select-none animate-in fade-in duration-150">
      
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-white/50 uppercase">
              Manager Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Manager Control Hub
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            My Team · Assign Training · Progress & Scores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playTap();
              setIsAssignModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <UserPlus size={14} />
            <span>Assign SOP</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              onOpenRoleSwitcher();
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Switch Role
          </button>
        </div>
      </div>

      {/* 2. Flat Tab Selector (No Card Nesting, Pure Monochrome) */}
      <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-xl border border-white/10">
        {[
          { id: 'team', label: 'My Team', icon: Users },
          { id: 'assign', label: 'Assign Training', icon: UserPlus },
          { id: 'scores', label: 'Progress & Scores', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playTap();
                setActiveSubTab(tab.id as any);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MY TEAM */}
      {activeSubTab === 'team' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar (Flat row) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Team Associates</span>
              <span className="text-xl font-bold text-white mt-0.5 block">{scorecard.totalAssigned || learners.length}</span>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Certified Ready</span>
              <span className="text-xl font-bold text-white mt-0.5 block">{scorecard.workplaceCertifiedCount || 0}</span>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Pending Review</span>
              <span className="text-xl font-bold text-white/70 mt-0.5 block">{scorecard.awaitingSupervisorCount || 0}</span>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] uppercase font-semibold text-white/50 block">Needs Remediation</span>
              <span className="text-xl font-bold text-white/70 mt-0.5 block">{scorecard.remediationOutstandingCount || 0}</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members by name or role..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Flat Roster Rows (Matching clean screenshot style, no nested cards) */}
          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {filteredLearners.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/50">
                No team associates match your search.
              </div>
            ) : (
              filteredLearners.map((learner) => {
                const isWorkplaceCertified = learner.workplaceReadiness === 'workplace_demonstration_passed';
                const isGurujiReady = learner.gurujiReadiness === 'ready_for_supervised_practice';

                return (
                  <div
                    key={learner.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{learner.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {isWorkplaceCertified ? 'Certified' : isGurujiReady ? 'Ready for Observation' : 'In Training'}
                        </span>
                      </div>
                      <span className="text-xs text-white/50 block mt-0.5">
                        {learner.role} · {learner.domain} · Assigned: {learner.assignedSopTitle || 'General SOP'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setActiveEvidenceLearner(learner);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
                      >
                        Evidence
                      </button>

                      <button
                        onClick={() => {
                          sounds.playTap();
                          setActiveObservationLearner(learner);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        Observe
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGN TRAINING */}
      {activeSubTab === 'assign' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Direct SOP Assignment</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Assign verified SOP procedures to team members without changing core content.
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playTap();
                setIsAssignModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 cursor-pointer shrink-0"
            >
              + New Assignment
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <span className="text-[10px] font-semibold text-white/50 uppercase">{lesson.category}</span>
                  <h4 className="text-sm font-bold text-white leading-snug">{lesson.title}</h4>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{lesson.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onSelectSop(lesson.id, lesson.title);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer"
                  >
                    Assign to Associate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROGRESS & SCORES */}
      {activeSubTab === 'scores' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white">Associate Training Records & Sign-Offs</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Review solo assessment scores, critical control checks, and supervisor floor verifications.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-black overflow-hidden">
            {filteredLearners.map((learner) => {
              const lastAttempt = learner.attempts?.[learner.attempts.length - 1];
              const score = lastAttempt?.score || (learner.workplaceReadiness === 'workplace_demonstration_passed' ? 95 : 80);

              return (
                <div
                  key={learner.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <span className="text-sm font-bold text-white block">{learner.name}</span>
                    <span className="text-xs text-white/50 block mt-0.5">
                      {learner.role} · {learner.assignedSopTitle || 'Room Sanitization'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">{score}%</span>
                      <span className="text-[10px] text-white/50 block">
                        {learner.workplaceReadiness === 'workplace_demonstration_passed' ? 'Floor Verified' : 'In Training'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        setActiveObservationLearner(learner);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeObservationLearner && (
        <SupervisorObservationModal
          isOpen={true}
          learner={activeObservationLearner}
          onClose={() => setActiveObservationLearner(null)}
          onSave={() => {
            setLearners(getStoredPilotLearners());
            setActiveObservationLearner(null);
          }}
        />
      )}

      {activeEvidenceLearner && (
        <LearnerEvidenceReportModal
          isOpen={true}
          learner={activeEvidenceLearner}
          onClose={() => setActiveEvidenceLearner(null)}
          onOpenSupervisorObservation={() => {
            const target = activeEvidenceLearner;
            setActiveEvidenceLearner(null);
            setActiveObservationLearner(target);
          }}
        />
      )}

      <NewLearnerAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onLearnerAssigned={() => {
          setLearners(getStoredPilotLearners());
          setIsAssignModalOpen(false);
        }}
      />

    </div>
  );
}
