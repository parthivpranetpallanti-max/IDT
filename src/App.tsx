import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Award, 
  User, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  GraduationCap, 
  ArrowRight, 
  ExternalLink, 
  Briefcase, 
  Zap, 
  Flame, 
  Info, 
  Code, 
  Check, 
  Sparkles,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  SkillRating,
  CareerTrack,
  CourseRecommendation,
  RoadmapStep,
  CareerRecommendationResult,
  QuizQuestion,
  QuizEvaluation,
  MarketTrend,
  StudentProfile
} from './types';
import { 
  playClick, 
  playTab, 
  playSuccess, 
  playOnboarding, 
  playWarning, 
  isMuted, 
  setMute 
} from './utils/sound';

// Supported tracks
const TRACKS_LIST: CareerTrack[] = [
  'Software Engineer',
  'Data Scientist',
  'AI Engineer',
  'Cybersecurity Analyst',
  'Cloud Engineer',
  'UI/UX Designer'
];

export default function App() {
  // Application Page State
  // 'onboarding' | 'dashboard' | 'assessment' | 'roadmap' | 'market' | 'courses' | 'projects' | 'profile'
  const [activeTab, setActiveTab] = useState<string>('onboarding');
  const [soundMuted, setSoundMuted] = useState<boolean>(isMuted());

  // Tab selector with audio chime
  const selectTab = (tabName: string) => {
    setActiveTab(tabName);
    playTab();
  };

  const handleToggleMute = () => {
    const next = !soundMuted;
    setMute(next);
    setSoundMuted(next);
    if (!next) {
      setTimeout(() => {
        playClick();
      }, 50);
    }
  };

  // Student profile state
  const [profile, setProfile] = useState<StudentProfile>({
    studentName: '',
    currentYear: '1st Year BTech / CSE',
    college: '',
    interests: [],
    completedCourses: [],
    completedRoadmapSteps: [],
    badgetIds: ['b-welcome']
  });

  // Selected Track
  const [selectedTrack, setSelectedTrack] = useState<CareerTrack>('AI Engineer');

  // Custom onboarding inputs
  const [inputName, setInputName] = useState<string>('');
  const [inputCollege, setInputCollege] = useState<string>('');
  const [rawSkillLevel, setRawSkillLevel] = useState<string>('Beginner with basic python or logic');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestsQuery, setInterestsQuery] = useState<string>('');

  // Selected preset interest tags
  const PRESET_INTEREST_TAGS = [
    'Algorithms', 'Web Design', 'Open Source', 'Mathematics', 
    'Cloud Platforms', 'Security Systems', 'Artificial Intelligence', 
    'Game Development', 'Data Structures', 'Database Systems', 
    'Linux Bash', 'Creative Art & Layouts'
  ];

  // Dynamic Data States loaded from API
  const [recommendation, setRecommendation] = useState<CareerRecommendationResult | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrend | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizEvaluation, setQuizEvaluation] = useState<QuizEvaluation | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Loaders and error banners
  const [recommendationLoading, setRecommendationLoading] = useState<boolean>(false);
  const [marketLoading, setMarketLoading] = useState<boolean>(false);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const [apiSourceInfo, setApiSourceInfo] = useState<string>('');

  // Auto-fill defaults for immediate user testing
  const applyDemoProfile = () => {
    playClick();
    setInputName('Alex Chen');
    setInputCollege('IEEE Institute of Software Tech');
    setSelectedInterests(['Algorithms', 'Artificial Intelligence', 'Mathematics', 'Cloud Platforms']);
    setRawSkillLevel('Has built short script prototypes, comfortable with basic syntax');
    setSelectedTrack('AI Engineer');
  };

  // Add/remove interests
  const toggleInterest = (tag: string) => {
    playClick();
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter(i => i !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const addCustomInterest = () => {
    playClick();
    if (interestsQuery.trim() && !selectedInterests.includes(interestsQuery.trim())) {
      setSelectedInterests([...selectedInterests, interestsQuery.trim()]);
      setInterestsQuery('');
    }
  };

  // On onboarding submit
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      setErrorText('Please specify your name to personalize your guidance.');
      playWarning();
      return;
    }
    setErrorText('');
    setRecommendationLoading(true);

    const updatedProfile: StudentProfile = {
      ...profile,
      studentName: inputName.trim(),
      college: inputCollege.trim() || 'Engineering College',
      interests: selectedInterests
    };
    setProfile(updatedProfile);

    try {
      const response = await fetch('/api/careers/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: selectedInterests,
          currentLevelSkill: rawSkillLevel,
          year: '1st Year BE / BTech CSE',
          college: inputCollege,
          targetTrack: selectedTrack
        })
      });

      const resJson = await response.json();
      if (resJson.success) {
        setRecommendation(resJson.data);
        setApiSourceInfo(resJson.source || 'Preset Engine');
        setActiveTab('dashboard');
        playOnboarding();
        
        // Also fetch initial market trends and quiz questions for this track asynchronously
        fetchMarketTrends(selectedTrack);
        fetchQuizQuestions(selectedTrack);
      } else {
        setErrorText(resJson.error || 'Failed to communicate recommendation parameters');
        playWarning();
      }
    } catch (err: any) {
      setErrorText('Server communication failed: ' + (err.message || err));
      playWarning();
    } finally {
      setRecommendationLoading(false);
    }
  };

  // Fetch Market Trends
  const fetchMarketTrends = async (track: CareerTrack) => {
    setMarketLoading(true);
    try {
      const response = await fetch(`/api/market/trends?track=${encodeURIComponent(track)}`);
      const resJson = await response.json();
      if (resJson.success) {
        setMarketTrends(resJson.trends);
      }
    } catch (err) {
      console.error('Failed to load market metrics: ', err);
    } finally {
      setMarketLoading(false);
    }
  };

  // Fetch Quiz Questions
  const fetchQuizQuestions = async (track: CareerTrack) => {
    setQuizLoading(true);
    setIsQuizSubmitted(false);
    setSelectedAnswers({});
    setActiveQuestionIndex(0);
    setQuizEvaluation(null);
    try {
      const response = await fetch(`/api/quiz/questions?track=${encodeURIComponent(track)}`);
      const resJson = await response.json();
      if (resJson.success) {
        setQuizQuestions(resJson.questions || []);
      }
    } catch (err) {
      console.error('Failed to load quiz content: ', err);
    } finally {
      setQuizLoading(false);
    }
  };

  // Evaluate Quiz Answers
  const submitQuizAnswers = async () => {
    if (Object.keys(selectedAnswers).length < quizQuestions.length) {
      playWarning();
      alert(`Please reply to all ${quizQuestions.length} benchmark questions before submitting evaluation.`);
      return;
    }

    setQuizLoading(true);
    try {
      const response = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          answers: selectedAnswers,
          questions: quizQuestions
        })
      });

      const resJson = await response.json();
      if (resJson.success) {
        setQuizEvaluation(resJson.evaluation);
        setIsQuizSubmitted(true);
        playSuccess();

        // Mutate the local skill ratings based on the evaluation offsets to show immediate user feedback!
        if (recommendation && resJson.evaluation.updatedSkillRatings) {
          const updatedSkills = recommendation.skillsList.map((skill: SkillRating) => {
            const modification = resJson.evaluation.updatedSkillRatings.find(
              (item: any) => item.skillName.toLowerCase().includes(skill.skillName.toLowerCase()) || 
                             skill.skillName.toLowerCase().includes(item.skillName.toLowerCase())
            );
            if (modification) {
              const prev = skill.studentScore;
              const next = Math.max(0, Math.min(100, prev + modification.extraScore));
              return {
                ...skill,
                studentScore: next,
                gapDescription: next > prev ? 'Knowledge updated successfully after positive quiz benchmark!' : skill.gapDescription
              };
            }
            return skill;
          });
          setRecommendation({
            ...recommendation,
            skillsList: updatedSkills
          });
        }

        // Add standard certificate badges
        const addedBadges = [...profile.badgetIds];
        if (resJson.evaluation.score >= 80 && !addedBadges.includes('b-expert')) {
          addedBadges.push('b-expert');
        }
        if (!addedBadges.includes('b-quiz')) {
          addedBadges.push('b-quiz');
        }
        setProfile({ ...profile, badgetIds: addedBadges });
      } else {
        playWarning();
      }
    } catch (err) {
      console.error('Quiz evaluation error: ', err);
      playWarning();
    } finally {
      setQuizLoading(false);
    }
  };

  // Handle Dynamic Track Selection Swap directly from Dashboard
  const handleTrackChange = async (newTrack: CareerTrack) => {
    playTab();
    setSelectedTrack(newTrack);
    setRecommendationLoading(true);
    try {
      const response = await fetch('/api/careers/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: profile.interests,
          currentLevelSkill: rawSkillLevel,
          year: '1st Year BE / BTech CSE',
          college: profile.college,
          targetTrack: newTrack
        })
      });

      const resJson = await response.json();
      if (resJson.success) {
        setRecommendation(resJson.data);
        setApiSourceInfo(resJson.source || 'Preset Engine');
        // Clear active quiz and fetch new
        fetchMarketTrends(newTrack);
        fetchQuizQuestions(newTrack);
      }
    } catch (err) {
      console.error('Direct path change error: ', err);
    } finally {
      setRecommendationLoading(false);
    }
  };

  // Toggle step completion inside roadmap
  const toggleRoadmapStepCompleted = (stepId: string) => {
    let updatedSteps = [...profile.completedRoadmapSteps];
    if (updatedSteps.includes(stepId)) {
      updatedSteps = updatedSteps.filter(id => id !== stepId);
      playClick();
    } else {
      updatedSteps.push(stepId);
      playSuccess();
    }

    // Trigger milestone badges
    const addedBadges = [...profile.badgetIds];
    if (updatedSteps.length >= 1 && !addedBadges.includes('b-pioneer')) {
      addedBadges.push('b-pioneer');
    }
    if (updatedSteps.length === (recommendation?.roadmap?.length || 0) && !addedBadges.includes('b-scholar')) {
      addedBadges.push('b-scholar');
    }

    setProfile({
      ...profile,
      completedRoadmapSteps: updatedSteps,
      badgetIds: addedBadges
    });
  };

  // Calculate Progress Percent dynamically
  const totalSteps = recommendation?.roadmap?.length || 3;
  const completedStepsCount = profile.completedRoadmapSteps.filter(id => 
    recommendation?.roadmap?.some(s => s.id === id)
  ).length;
  const computedProgressPercent = Math.round((completedStepsCount / totalSteps) * 100);

  // Return badge details helper
  const getBadgeDetails = (id: string) => {
    const badges: Record<string, { label: string; desc: string; icon: string; color: string }> = {
      'b-welcome': { label: 'Novice Explorer', desc: 'Successfully customized Career profile parameters', icon: '🧭', color: 'from-cyan-500/80 to-cyan-500' },
      'b-quiz': { label: 'Assessed Brain', desc: 'Completed the technical benchmark diagnostic quiz', icon: '🧠', color: 'from-cyan-400 to-teal-500' },
      'b-expert': { label: 'High Achiever', desc: 'Scored 80%+ on your technical career diagnostic', icon: '⚡', color: 'from-fuchsia-400 to-cyan-500' },
      'b-pioneer': { label: 'Core Pioneer', desc: 'Marked your first structured learning Milestone', icon: '🚀', color: 'from-teal-400 to-cyan-500' },
      'b-scholar': { label: 'Grand Scholar', desc: 'Completed all phases on your personalized Roadmap', icon: '🎓', color: 'from-cyan-500 to-blue-500' }
    };
    return badges[id] || { label: 'Achievement Unlock', desc: 'Awarded for active engagement', icon: '🏆', color: 'from-gray-500 to-cyan-700' };
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-[#E0E2E6] overflow-x-hidden">
      
      {/* SIDEBAR NAVIGATION GRID */}
      {activeTab !== 'onboarding' && (
        <nav className="w-full md:w-72 bg-black/80 border-r border-cyan-550/20 flex flex-col p-6 shrink-0 relative z-25">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Compass className="w-6 h-6 text-black" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tighter text-white block leading-tight font-display">CAREER COMPASS</span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Innovative AI Core</span>
              </div>
            </div>
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-all shrink-0 ${
                soundMuted 
                  ? 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                  : 'border-white/5 bg-white/5 text-cyan-300 hover:bg-white/10'
              }`}
              type="button"
              aria-label="Toggle Sound Effects"
              title={soundMuted ? "Unmute Sound Feedback" : "Mute Sound Feedback"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Principal Navigation Unit */}
            <div className="space-y-1.5Packed font-bold">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#22d3ee]/50 px-3 mb-2 font-mono">Principal Workspace</p>
              
              <button
                onClick={() => selectTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'dashboard' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'dashboard' ? 'bg-cyan-400 animate-pulse' : 'bg-transparent'}`}></span>
                  Dashboard Workspace
                </div>
              </button>

              <button
                onClick={() => selectTab('assessment')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'assessment' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'assessment' ? 'bg-cyan-400' : 'bg-transparent'}`}></span>
                  Skill Assessment
                </div>
                {quizQuestions.length > 0 && (
                  <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                    {Object.keys(selectedAnswers).length}/{quizQuestions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => selectTab('roadmap')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'roadmap' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'roadmap' ? 'bg-cyan-400' : 'bg-transparent'}`}></span>
                  Personal Roadmap
                </div>
                {computedProgressPercent > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                    {computedProgressPercent}%
                  </span>
                )}
              </button>
            </div>

            {/* Intelligence modules */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#22d3ee]/50 px-3 mb-2 font-mono font-bold">Market Intelligence</p>
              
              <button
                onClick={() => selectTab('market')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'market' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Market Analyser
              </button>

              <button
                onClick={() => selectTab('courses')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'courses' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Course Laboratory
              </button>

              <button
                onClick={() => selectTab('projects')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'projects' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Code className="w-4 h-4 text-fuchsia-400" />
                Sandbox Projects
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#22d3ee]/50 px-3 mb-2 font-mono">User Space</p>
              <button
                onClick={() => selectTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === 'profile' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Award className="w-4 h-4 text-cyan-400" />
                Achievements & Badges
              </button>
            </div>
          </div>

          {/* Sidebar student info footer */}
          <div className="mt-8 pt-6 border-t border-cyan-500/10">
            <div className="p-4 bg-black/60 border border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.05)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-cyan-300 font-mono tracking-wider italic">1ST YEAR CSE</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-200 px-1 rounded">STUDENT</span>
              </div>
              <p className="text-sm font-black text-white tracking-tight">{profile.studentName || 'Alex Chen'}</p>
              <p className="text-[10px] text-white/50 truncate break-all mt-0.5">{profile.college || 'CSE Tech Academy'}</p>
              
              <div className="mt-4">
                <div className="flex justify-between items-center text-[10px] text-white/40 mb-1 font-mono">
                  <span>Pathway Progress</span>
                  <span className="font-bold text-cyan-400">{computedProgressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500" 
                    style={{ width: `${computedProgressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                if (confirm("Reset current profile, interests, and re-enter onboarding setup?")) {
                  setActiveTab('onboarding');
                }
              }}
              className="mt-4 w-full text-center text-white/30 hover:text-red-400 text-xs py-1 transition-colors font-mono"
            >
              ← Reset Profile Setup
            </button>
          </div>
        </nav>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 flex flex-col relative px-4 md:px-10 py-6 overflow-y-auto">
        
        {/* Futuristic Background Blur Nodes */}
        <div className="absolute top-10 right-10 w-[200px] md:w-[600px] h-[200px] md:h-[600px] bg-cyan-600/10 rounded-full blur-[80px] md:blur-[140px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-[150px] md:w-[450px] h-[150px] md:h-[450px] bg-cyan-700/5 rounded-full blur-[70px] md:blur-[120px] -z-10 pointer-events-none"></div>

        {/* TOP SITE HEADER */}
        {activeTab !== 'onboarding' && (
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-8 border-b border-cyan-500/10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-bold text-cyan-300 rounded font-mono uppercase tracking-widest animate-pulse">
                  Active Vector
                </span>
                {apiSourceInfo && (
                  <span className="text-[10px] text-white/40 font-mono">
                    Driven by: <span className="text-white/70 italic font-bold">{apiSourceInfo}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3.5xl font-black italic tracking-tighter text-white uppercase leading-none font-display">
                {selectedTrack} <span className="text-cyan-400">Compass</span>
              </h1>
            </div>

            {/* Career Fast Selection Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-black/65 border border-cyan-500/25 p-1.5 rounded-xl text-xs">
              <span className="text-white/40 font-mono font-bold px-2">Swap Career focus:</span>
              <div className="flex flex-wrap gap-1">
                {TRACKS_LIST.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTrackChange(t)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      selectedTrack === t
                        ? 'bg-cyan-500 text-black shadow shadow-cyan-500/35'
                        : 'text-white/50 hover:text-white hover:bg-white/5 text-[11px]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </header>
        )}

        {/* VIEW ROUTER FOR MAIN CONTENT */}

        {/* 1. ONBOARDING SCREEN */}
        {activeTab === 'onboarding' && (
          <div className="max-w-4xl mx-auto my-auto py-8 flex flex-col justify-center items-center">
            
            <div className="text-center mb-10 max-w-2xl">
              <span className="px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 rounded-full font-mono uppercase tracking-wider inline-block mb-3">
                1st Year CSE Lab Project
              </span>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tightest leading-tight text-white mb-4 uppercase font-display">
                CAREER COMPASS <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400">AI</span>
              </h1>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                An intelligent system mapping industry skill benchmarks, diagnostic quizzes, 
                and custom curated learning paths specifically for introductory Computer Science Engineering students.
              </p>
            </div>

            {/* Main Interactive Board */}
            <div className="w-full bg-black border border-cyan-500/20 rounded-3xl p-6 md:p-10 backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)]">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-teal-400"></div>

              <div className="flex justify-between items-center mb-6 pb-4 border-b border-cyan-500/10">
                <h2 className="text-xl font-bold text-white font-display border-l-4 border-cyan-400 pl-3">Profile Diagnostics Setup</h2>
                <button
                  type="button"
                  onClick={applyDemoProfile}
                  className="px-3.5 py-1 text-xs bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 rounded-lg font-mono font-bold transition-all border border-cyan-500/25"
                >
                  ⚡ Fast Autofill Demo Student
                </button>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 font-mono">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Chen"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-cyan-500/20 rounded-xl text-white placeholder-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
                    />
                  </div>

                  {/* College/Institute */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 font-mono">
                      Engineering College / Institute
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IIT Madras / IEEE College of CSE"
                      value={inputCollege}
                      onChange={(e) => setInputCollege(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-cyan-500/20 rounded-xl text-white placeholder-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Target Career Pathway */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 font-mono">
                    Select Target Tech Track (Your Ultimate Goal)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TRACKS_LIST.map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() => { playClick(); setSelectedTrack(track); }}
                        className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between h-28 ${
                          selectedTrack === track
                            ? 'bg-cyan-950/30 border-cyan-400 shadow-md shadow-cyan-500/10'
                            : 'bg-black/30 border-white/5 hover:border-cyan-500/20'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase">Path option</span>
                        <span className="text-sm font-black text-white italic tracking-tight font-display">{track}</span>
                        <span className="text-[10px] text-white/40 truncate">Click to select</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Skill Indicator */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 font-mono">
                    Describe Your Current Programming Experience
                  </label>
                  <select
                    value={rawSkillLevel}
                    onChange={(e) => setRawSkillLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-cyan-500/20 rounded-xl text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
                  >
                    <option value="Absolute raw beginner, never coded before">Absolute raw beginner, never coded before</option>
                    <option value="Know basic Python/C++ loops and variables, no web experience">Know basic Python/C++ loops and variables, no web experience</option>
                    <option value="Built single-page scripts, understand functions and basic APIs">Built single-page scripts, understand functions and basic APIs</option>
                    <option value="Intermediate React developer, comfortable with state and Git">Intermediate React developer, comfortable with state and Git</option>
                  </select>
                </div>

                {/* Interactive Interest Tags Select */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 font-mono flex justify-between">
                    <span>What areas excite you most? (Select multiple)</span>
                    <span className="text-cyan-400 font-bold">{selectedInterests.length} Selected</span>
                  </label>
                  
                  {/* Preset Quick Tags */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_INTEREST_TAGS.map((tag) => {
                      const active = selectedInterests.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            active
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white scale-105'
                              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          {active ? '✓ ' : ''}{tag}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add dynamic manual tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Or specify another custom focus target..."
                      value={interestsQuery}
                      onChange={(e) => setInterestsQuery(e.target.value)}
                      className="flex-1 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs outline-none focus:border-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomInterest();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomInterest}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs hover:bg-white/15"
                    >
                      Add Custom
                    </button>
                  </div>
                </div>

                {/* Error text notice if any */}
                {errorText && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{errorText}</p>
                  </div>
                )}

                {/* Embark button inside onboarding */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={recommendationLoading}
                    className="w-full py-4 bg-white hover:bg-white/90 text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3"
                  >
                    {recommendationLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating Your Personalized AI Pathway...
                      </>
                    ) : (
                      <>
                        Generate Career Roadmap & Begin Diagnostics
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <p className="mt-8 text-xs text-white/30 text-center uppercase tracking-widest font-mono">
              Designed as a professional design thinking laboratory deliverable for freshman engineering students.
            </p>
          </div>
        )}

        {/* 2. MAIN DASHBOARD VIEW WORKSPACE */}
        {activeTab === 'dashboard' && recommendation && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT SIDE BLOCK: MATCH DETAILS & SKILL GAP RECAP */}
              <div className="col-span-1 lg:col-span-8 space-y-6">
                
                {/* CAREER TRACK MATCH HERO BANNER */}
                <section className="bg-black border-2 border-cyan-400/40 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px]"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                        <span className="text-xs font-bold text-fuchsia-300 font-mono uppercase tracking-wider">High Dynamic Alignment</span>
                      </div>
                      <h3 className="text-3xl font-black italic tracking-tight text-white uppercase leading-none font-display">
                        Your Custom Track suitability is at <span className="text-cyan-400">{recommendation.matchPercentage}%</span>
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed mt-2 max-w-xl font-mono">
                        {recommendation.summary}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center items-center p-4 bg-black border border-cyan-500/30 rounded-2xl shrink-0 text-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Index Score</p>
                      <p className="text-4xl md:text-5xl font-black italic tracking-tighter text-cyan-400 leading-none">
                        {recommendation.matchPercentage}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase font-mono">✓ Highly Compatible</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-cyan-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono mb-2">Why This Path Fits You</p>
                      <ul className="space-y-1.5 text-xs text-white/65 font-mono">
                        {recommendation.whyThisFits?.map((why, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-1 shrink-0">•</span>
                            <span>{why}</span>
                          </li>
                        )) || (
                          <>
                            <li className="flex items-center gap-2">✓ Alignment with interest in programming logic systems</li>
                            <li className="flex items-center gap-2">✓ Analytical approach to solving structured hurdles</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-col justify-end items-end">
                      <button
                        onClick={() => setActiveTab('roadmap')}
                        className="px-6 py-3 bg-white text-black font-black uppercase tracking-tight rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform w-full md:w-auto"
                      >
                        Launch Interactive Roadmap →
                      </button>
                    </div>
                  </div>
                </section>

                {/* SKILLS GAP MATRIX PREVIEW CONTAINER */}
                <section className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-black tracking-tight uppercase font-display">TECHNICAL SKILLS COMPARATIVE MATRIX</h2>
                      <p className="text-white/40 text-xs uppercase tracking-wider font-mono">Gap analysis compared with current industry benchmarks</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('assessment')}
                      className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-bold border border-cyan-500/20 transition-all font-mono"
                    >
                      Verify Via Skill Quiz →
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recommendation.skillsList.map((skill: SkillRating, index: number) => {
                      const isDeficient = skill.industryStandard - skill.studentScore > 20;
                      return (
                        <div key={index} className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="px-2 py-0.5 bg-white/5 text-white/50 rounded font-mono text-[9px] mr-2 text-[10px] uppercase font-bold tracking-wider">
                                {skill.category}
                              </span>
                              <span className="font-bold text-white tracking-tight">{skill.skillName}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-white/40">You: <strong className="text-white">{skill.studentScore}%</strong></span>
                              <span className="text-white/40">Req: <strong className="text-cyan-300">{skill.industryStandard}%</strong></span>
                              {isDeficient ? (
                                <span className="text-[10px] bg-red-500/20 text-red-300 rounded px-1.5 py-0.5 font-bold uppercase font-mono">
                                  Gap Flagged
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 rounded px-1.5 py-0.5 font-bold uppercase font-mono">
                                  On Track
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Complex visual progress bar overlaying student actual score and required benchmark */}
                          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
                            {/* Industry Standard Target Marker Line */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 shadow-[0_0_5px_rgba(34,211,238,0.8)]" 
                              style={{ left: `${skill.industryStandard}%` }}
                              title="Industry Standard Boundary"
                            ></div>
                            
                            {/* Student Score Bar */}
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${
                                isDeficient 
                                  ? 'bg-gradient-to-r from-red-500 to-fuchsia-500' 
                                  : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                              }`} 
                              style={{ width: `${skill.studentScore}%` }}
                            ></div>
                          </div>

                          <p className="text-xs text-white/50 leading-relaxed font-mono">
                            <span className="text-cyan-300 font-bold">Action target:</span> {skill.gapDescription}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </div>

              {/* RIGHT SIDE BLOCK: MARKET DEMAND PREVIEW & QUICK ONBOARD DETAILS */}
              <div className="col-span-1 lg:col-span-4 space-y-6">
                
                {/* MARKET LIVE INSIGHT CARD */}
                {marketTrends ? (
                  <div className="bg-black border-2 border-cyan-400/30 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-cyan-500/10">
                    <div className="absolute top-[-20%] right-[-10%] opacity-15">
                      <BookOpen className="w-48 h-48 text-cyan-400" />
                    </div>

                    <div className="relative z-10 space-y-5">
                      <div>
                        <p className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400">MARKET DEMAND INDICATOR</p>
                        <h4 className="text-4xl font-extrabold italic tracking-tighter leading-none mt-1 uppercase font-display border-b border-cyan-500/20 pb-2">
                          {marketTrends.demandScore}% Hot index
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="bg-[#020204] p-3 rounded-xl border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.05)]">
                          <p className="text-[9px] text-cyan-200 font-mono font-bold uppercase">Average Salary range</p>
                          <p className="font-extrabold text-sm text-fuchsia-400 tracking-tight">{marketTrends.salaryRange}</p>
                        </div>
                        <div className="bg-[#020204] p-3 rounded-xl border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.05)]">
                          <p className="text-[9px] text-cyan-200 font-mono font-bold uppercase">Job Growth YoY</p>
                          <p className="font-extrabold text-sm text-emerald-300 tracking-tight">{marketTrends.growthRate}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-cyan-200 mb-1">Key Dynamic Keywords:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {marketTrends.trendingKeywords?.map((k, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#020204] border border-cyan-500/25 rounded text-[10px] font-bold tracking-tight text-cyan-300">
                              #{k}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-white/80 leading-relaxed font-mono">
                        {marketTrends.overview}
                      </p>

                      <button
                        onClick={() => setActiveTab('market')}
                        className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-colors border border-cyan-400/50 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                      >
                        Complete Target Trends Tracker <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-white/30 mb-2" />
                    <p className="text-xs text-white/40">Fetching market statistics metrics...</p>
                  </div>
                )}

                {/* EARNING BADGES STATS UNIT */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white font-display">Your Milestone Achievements</h4>
                  
                  <div className="space-y-2.5">
                    {profile.badgetIds.map((bId) => {
                      const info = getBadgeDetails(bId);
                      return (
                        <div key={bId} className="flex gap-3 items-center p-3 bg-black/40 rounded-2xl border border-white/5">
                          <div className={`w-10 h-10 shrink-0 bg-gradient-to-tr ${info.color} rounded-xl flex items-center justify-center text-xl`}>
                            {info.icon}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white tracking-tight truncate">{info.label}</p>
                            <p className="text-[10px] text-white/40 leading-relaxed truncate">{info.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-bold font-mono"
                  >
                    Manage Achievements & Profile Page →
                  </button>
                </div>

                {/* FIRST YEAR VALUE SUGGESTION GUIDE */}
                <div className="p-5 bg-black border border-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.02)]">
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">Innovative First Year Strategy</p>
                      <p className="text-[11px] text-white/50 leading-relaxed font-mono">
                        Freshman semesters present minimal specialization overload. This is the optimal window to build robust logical core systems and Git workflows before major engineering syllabi land next year.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* LOWER STRIP: DYNAMIC PROJECT SUGGESTIONS */}
            <section className="bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold uppercase text-white font-display">Target Pathway Labs Sandbox Projects</h3>
                  <p className="text-white/40 text-xs font-mono">Suggested high-fidelity building platforms suitable for 1st Year innovative project submissions</p>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="px-4 py-2 bg-white text-black font-black text-xs uppercase tracking-tight rounded-xl"
                >
                  View All Specs
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendation.suggestedProjects?.map((proj, idx) => (
                  <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-fuchsia-400 font-bold uppercase tracking-widest text-[9px]">Comp: {proj.complexity}</span>
                        <span className="bg-white/5 text-white/50 px-2 py-0.5 rounded text-[9px] font-bold">PROJECT OPTION</span>
                      </div>
                      <h4 className="text-lg font-bold text-white tracking-tight">{proj.title}</h4>
                      <p className="text-xs text-white/60 leading-relaxed mt-1">{proj.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-cyan-500/15 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-white/40 font-mono">Stack:</span>
                      {proj.techStack?.map((stat, i) => (
                        <span key={i} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded font-mono text-[9px] font-bold">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                )) || (
                  <p className="text-xs text-white/40">No specific projects recorded yet.</p>
                )}
              </div>
            </section>

          </div>
        )}

        {/* 3. SKILL ASSESSMENT QUIZ PAGE */}
        {activeTab === 'assessment' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="bg-black border border-cyan-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.02)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-cyan-500/15">
                <div>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/20 text-[9px] font-bold rounded font-mono uppercase tracking-widest">
                    Technical Benchmark Quiz
                  </span>
                  <h2 className="text-2xl font-black italic tracking-tight text-white uppercase mt-1 font-display">
                    Path Verification: {selectedTrack}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fetchQuizQuestions(selectedTrack)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-mono flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-trigger API Quiz
                  </button>
                </div>
              </div>

              {quizLoading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-10 h-10 mx-auto animate-spin text-cyan-400" />
                  <p className="text-sm text-white/60 font-mono">Dynamically synthesizing interactive tech assessment questions...</p>
                </div>
              ) : quizQuestions.length > 0 ? (
                <div className="space-y-6">
                  
                  {/* QUESTION PROGRESS SELECTION BAR */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {quizQuestions.map((q, idx) => {
                      const answered = selectedAnswers[idx] !== undefined;
                      const isCurrent = activeQuestionIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => { playClick(); setActiveQuestionIndex(idx); }}
                          className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs transition-all shrink-0 ${
                            isCurrent
                              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                              : answered
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35'
                                : 'bg-white/5 text-white/40 border border-white/5'
                          }`}
                        >
                          Q{idx + 1} {answered ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE QUESTION BLOCK */}
                  <div className="p-6 bg-[#020204] rounded-2xl border border-cyan-500/25 space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-cyan-400 font-extrabold uppercase tracking-wider">
                        Topic Tag: {quizQuestions[activeQuestionIndex].skillTag}
                      </span>
                      <span className="text-white/30">Question {activeQuestionIndex + 1} of {quizQuestions.length}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white leading-relaxed">
                      {quizQuestions[activeQuestionIndex].question}
                    </h3>

                    {/* Options list */}
                    <div className="space-y-2.5 pt-2">
                      {quizQuestions[activeQuestionIndex].options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[activeQuestionIndex] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!isQuizSubmitted) {
                                playClick();
                                setSelectedAnswers({
                                  ...selectedAnswers,
                                  [activeQuestionIndex]: optIdx
                                });
                              }
                            }}
                            disabled={isQuizSubmitted}
                            className={`w-full p-4 rounded-xl text-left border text-xs font-semibold transition-all flex justify-between items-center ${
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                                : 'bg-black/20 border-white/5 hover:border-cyan-500/20 text-white/70 hover:text-white'
                            }`}
                          >
                            <span>{option}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-white/20'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* NEXT / PREV FOOTER CONTEXT */}
                  <div className="flex justify-between items-center pt-4">
                    <button
                      onClick={() => { playClick(); setActiveQuestionIndex(prev => Math.max(0, prev - 1)); }}
                      disabled={activeQuestionIndex === 0}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-xs font-bold transition-all"
                    >
                      ← Previous
                    </button>

                    {activeQuestionIndex < quizQuestions.length - 1 ? (
                      <button
                        onClick={() => { playClick(); setActiveQuestionIndex(prev => prev + 1); }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all"
                      >
                        Next Question →
                      </button>
                    ) : (
                      !isQuizSubmitted && (
                        <button
                          onClick={submitQuizAnswers}
                          className="px-6 py-3 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider rounded-xl text-xs transition-transform"
                        >
                          Yield Quiz Diagnostics
                        </button>
                      )
                    )}
                  </div>

                  {/* QUIZ DIAGNOSTIC EVALUATION RESULTS */}
                  {isQuizSubmitted && quizEvaluation && (
                    <div className="space-y-6 pt-6 border-t border-cyan-500/15">
                      <div className="bg-black border-2 border-cyan-400/40 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)]">
                        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-300">BENCHMARK PERFORMANCE CARD</span>
                            <h4 className="text-3xl font-black italic text-white font-display mt-0.5">Quiz Finished!</h4>
                            <p className="text-sm text-white/75 leading-relaxed max-w-xl mt-2">
                              {quizEvaluation.insights}
                            </p>
                          </div>

                          <div className="text-center p-5 bg-[#020204] rounded-2xl border border-cyan-500/30 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1 font-mono">Score evaluated</p>
                            <p className="text-5xl font-extrabold italic text-cyan-400 tracking-tight leading-none">
                              {quizEvaluation.score}%
                            </p>
                            <p className="text-[10px] text-cyan-300 font-bold font-mono mt-1 uppercase">
                              {quizEvaluation.score >= 80 ? '✓ Expert Alignment' : 'Diagnostic Complete'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Gaps identified list */}
                      <div className="space-y-3 p-6 bg-black/20 rounded-2xl border border-white/5">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Detected Knowledge Gaps
                        </h4>
                        <ul className="space-y-2 text-xs text-white/70">
                          {quizEvaluation.skillGapsIdentified.map((gap, i) => (
                            <li key={i} className="flex gap-2 items-start p-2 bg-red-500/5 rounded border border-red-500/10 font-mono">
                              <span className="text-red-400 font-bold shrink-0">▸</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-mono">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Profile metrics have adjusted! Verify updated stats on the primary Dashboard and check custom courses recommended in the course tab to patch gaps.</span>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <p className="text-center text-xs text-white/40 font-mono">Unable to retrieve technical assessment questions. Click "Recheck" to re-try.</p>
              )}
            </div>

          </div>
        )}

        {/* 4. PERSONAL ROADMAP TIMELINE */}
        {activeTab === 'roadmap' && recommendation && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="flex justify-between items-center bg-black border border-cyan-500/20 rounded-3xl p-6">
              <div>
                <h2 className="text-xl font-bold uppercase text-white font-display">Personalized Phase Progression</h2>
                <p className="text-xs text-white/40 font-mono">Step-by-step sequential guideline mapping Beginner, Intermediate, and Advanced semesters</p>
              </div>

              <div className="p-3 bg-[#020204] border border-cyan-500/30 rounded-2xl text-right">
                <span className="text-[10px] text-white/40 block font-mono">Roadmap Phases Completed</span>
                <span className="text-lg font-bold text-cyan-400">{completedStepsCount} of {recommendation.roadmap?.length || 3}</span>
              </div>
            </div>

            <div className="space-y-8 relative">
              {/* Vertical line connector */}
              <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-cyan-500/30"></div>

              {recommendation.roadmap?.map((step: RoadmapStep, sIdx: number) => {
                const isCompleted = profile.completedRoadmapSteps.includes(step.id);
                
                return (
                  <div key={step.id} className="relative pl-14 transition-all">
                    
                    {/* Circle timeline visual item */}
                    <button 
                      onClick={() => toggleRoadmapStepCompleted(step.id)}
                      className={`absolute left-2.5 top-1.5 w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-400 text-white animate-bounce' 
                          : 'bg-black border-white/20 text-white/40 hover:border-cyan-400 hover:text-white'
                      }`}
                      title={isCompleted ? "Mark incomplete" : "Mark step completed"}
                    >
                      {isCompleted ? <Check className="w-4.5 h-4.5" /> : <span className="text-xs font-bold font-mono">{sIdx + 1}</span>}
                    </button>

                    <div className={`p-6 md:p-8 bg-black/60 border rounded-3xl space-y-4 hover:border-cyan-500/35 transition-colors ${
                      isCompleted ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : 'border-cyan-500/15'
                    }`}>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 text-[9px] font-bold font-mono rounded tracking-widest uppercase">
                              {step.phase} Phase
                            </span>
                            <span className="text-white/40 text-xs font-mono">• {step.estimatedWeeks} weeks recommended duration</span>
                          </div>
                          <h3 className="text-xl font-bold text-white tracking-tight">{step.title}</h3>
                        </div>

                        <button
                          onClick={() => toggleRoadmapStepCompleted(step.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all font-mono ${
                            isCompleted 
                              ? 'bg-emerald-500/25 text-emerald-300' 
                              : 'bg-white/5 hover:bg-white/15 text-white/70'
                          }`}
                        >
                          {isCompleted ? '✓ Phase Accomplished' : 'Mark Phase Completed'}
                        </button>
                      </div>

                      <p className="text-sm text-white/60 leading-relaxed font-mono">
                        {step.description}
                      </p>

                      {/* Skills acquired in this phase */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">Target Capabilities Unlocked</p>
                        <div className="flex flex-wrap gap-2">
                          {step.skillsAcquired?.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-white/5 text-white/80 rounded-lg text-xs border border-white/5 font-semibold">
                              🛠️ {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Curated Resources for this phase */}
                      {step.resources && step.resources.length > 0 && (
                        <div className="pt-4 border-t border-cyan-500/15 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">Specialized Curated Resources</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {step.resources.map((res, rIdx) => (
                              <div key={rIdx} className="p-4 bg-[#020204] rounded-2xl border border-cyan-500/15 space-y-2 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-cyan-400 font-bold uppercase tracking-wider font-mono">{res.provider}</span>
                                    <span className={`font-mono uppercase font-bold text-[9px] px-1.5 rounded border ${
                                      res.type === 'free' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5'
                                    }`}>
                                      {res.type}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-white tracking-tight">{res.title}</h4>
                                  <p className="text-[11px] text-white/50 leading-relaxed">{res.description}</p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                  <span className="text-[10px] text-white/40 font-mono">Target: {res.difficulty} • {res.duration}</span>
                                  <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 font-mono"
                                    id={`res-link-${sIdx}-${rIdx}`}
                                  >
                                    Inspect Course <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              }) || (
                <p className="text-center text-xs text-white/40">No Roadmap steps compiled.</p>
              )}
            </div>

          </div>
        )}

        {/* 5. MARKET DEMAND ANALYZER (FULL PAGE) */}
        {activeTab === 'market' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="bg-black border border-cyan-500/25 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(34,211,238,0.02)]">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyan-500/15 pb-4">
                <div>
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 rounded font-mono uppercase tracking-widest">
                    Live Industry Grounding Intel
                  </span>
                  <h2 className="text-2xl font-black italic text-white uppercase font-display mt-1">
                    Continuous Industry Demand Index - {selectedTrack}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fetchMarketTrends(selectedTrack)}
                    className="px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 rounded-lg text-xs font-mono border border-cyan-500/30 transition-all flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" /> Re-poll API Trend
                  </button>
                </div>
              </div>

              {marketLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-10 h-10 mx-auto animate-spin text-cyan-400 mb-2" />
                  <p className="text-sm font-mono text-white/60">Quizzing worldwide hiring registries and analyzing target data streams...</p>
                </div>
              ) : marketTrends ? (
                <div className="space-y-8">
                  
                  {/* METRIC STATISTICS ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div className="p-6 bg-black border border-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.02)] space-y-1">
                      <p className="text-xs font-mono text-cyan-300 font-bold uppercase">Dynamic Demand Index</p>
                      <p className="text-4xl font-extrabold italic text-white font-display tracking-tight mt-1">{marketTrends.demandScore}%</p>
                      <div className="pt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${marketTrends.demandScore}%` }}></div>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 font-mono">Analyzed worldwide vacancy quotients</p>
                    </div>

                    <div className="p-6 bg-black border border-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.02)] space-y-1">
                      <p className="text-xs font-mono text-cyan-300 font-bold uppercase">Growth Index Velocity</p>
                      <p className="text-4xl font-extrabold italic text-white font-display tracking-tight mt-1">{marketTrends.growthRate}</p>
                      <div className="pt-2">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                          ▲ High Expansion
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1.5 font-mono">Aggregate compound expansion percentage</p>
                    </div>

                    <div className="p-6 bg-black border border-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.02)] space-y-1">
                      <p className="text-xs font-mono text-cyan-300 font-bold uppercase">Fresh Graduate Salary</p>
                      <p className="text-4xl font-extrabold italic text-white font-display tracking-tight mt-1 truncate">{marketTrends.salaryRange}</p>
                      <div className="pt-2 font-mono text-[10px] text-fuchsia-400 font-bold">
                        ★ Standard junior scale indicator
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 font-mono">Calculated from leading recruitment registries</p>
                    </div>

                  </div>

                  {/* SUMMARY PARAGRAPH */}
                  <div className="p-6 bg-[#020204] border border-cyan-500/20 rounded-2xl space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">Expert Market Assessment Outlook</p>
                    <p className="text-sm text-white/80 leading-relaxed font-mono">
                      {marketTrends.overview}
                    </p>
                  </div>

                  {/* EMERGING SKILLS DYNAMIC LIST */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white uppercase font-display">Target Emerging Engineering Capabilities</h4>
                      <p className="text-white/40 text-xs font-mono">Highly suggested micro-capabilities giving recruits an exceptional advantage</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketTrends.emergingSkills?.map((skill, index) => (
                        <div key={index} className="p-4 bg-black border border-cyan-500/15 space-y-1">
                          <span className="text-[9px] font-mono uppercase bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 rounded px-1.5 py-0.5 font-bold">
                            Emerging Hot Capability
                          </span>
                          <h5 className="text-base font-bold text-white tracking-tight mt-1">{skill.name}</h5>
                          <p className="text-xs text-white/50 leading-relaxed font-mono mt-1">{skill.relevance}</p>
                        </div>
                      )) || (
                        <>
                          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                            <h5 className="font-bold text-white">Generative AI Prompts Systems</h5>
                            <p className="text-xs text-white/50 mt-1">Empowers automated script debugging and contextual task resolution.</p>
                          </div>
                          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                            <h5 className="font-bold text-white">Dockerized Container Isolate</h5>
                            <p className="text-xs text-white/50 mt-1">Guarantees code predictability and frictionless local build integration.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <p className="text-center text-xs text-white/40">Unable to retrieve live market intelligence indices at this moment.</p>
              )}
            </div>

          </div>
        )}

        {/* 6. COURSE LABORATORY */}
        {activeTab === 'courses' && recommendation && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="bg-black border border-cyan-500/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(34,211,238,0.02)]">
              <div>
                <h2 className="text-2xl font-black italic tracking-tight text-white uppercase font-display">Recommended Learning Syllabus</h2>
                <p className="text-xs text-white/40 font-mono">Curated web lectures, sandbox certificates, and open-source materials targeted for {selectedTrack}</p>
              </div>

              {/* Course items stack list */}
              <div className="space-y-4">
                {recommendation.roadmap?.flatMap(s => s.resources || []).map((res, index) => (
                  <div key={index} className="p-5 bg-[#020204] rounded-2xl border border-cyan-500/15 hover:border-cyan-400/40 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold rounded uppercase">
                          {res.provider}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.type === 'free' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                        }`}>
                          {res.type === 'free' ? 'Free Resource' : 'Certificate option'}
                        </span>
                        <span className="bg-white/5 text-white/50 px-2 py-0.5 rounded font-mono text-[9px] font-bold">
                          {res.difficulty} Level
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight">{res.title}</h3>
                      <p className="text-xs text-white/60 leading-relaxed max-w-2xl font-mono">{res.description}</p>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5 shrink-0 gap-3">
                      <div className="text-left md:text-right font-mono text-[11px]">
                        <p className="text-white/40">Duration Guide</p>
                        <p className="font-extrabold text-white">{res.duration}</p>
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-black hover:bg-white/95 font-black uppercase text-xs tracking-tight rounded-xl flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                      >
                        Inspect Resource <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </div>
                ))}
              </div>

              <div className="p-4 bg-black border border-cyan-500/25 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed font-mono">
                  All links refer to high-quality academic references and massive open tutorials verified continuously by the Career Compass Innovative engine. Always select "audit" or "free path" options during enrollment to conserve student laboratory budget.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* 7. SANDBOX PROJECTS (FULL SPECS) */}
        {activeTab === 'projects' && recommendation && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black italic tracking-tight text-white uppercase font-display">Target Sandbox Laboratory Projects</h2>
                <p className="text-xs text-white/40 font-mono">High-fidelity student projects configured to prove key architecture competencies on recruitment screenings</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {recommendation.suggestedProjects?.map((proj, idx) => (
                  <div key={idx} className="p-6 md:p-8 bg-black border-2 border-cyan-500/20 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(34,211,238,0.02)]">
                    
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="px-2.5 py-1 bg-fuchsia-500/20 text-fuchsia-300 font-mono font-bold rounded uppercase tracking-wider">
                          Target Complexity: {proj.complexity}
                        </span>
                      </div>
                      <span className="text-white/30 font-mono">Spec Identifier: sandbox-{idx + 1}</span>
                    </div>

                    <h3 className="text-2xl font-black italic text-white tracking-tight uppercase font-display">{proj.title}</h3>
                    
                    <p className="text-sm text-white/70 leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Step-by-step implementation guide */}
                    <div className="pt-4 border-t border-cyan-500/15 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">Suggested Implementation Milestones</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 bg-black border border-cyan-500/15 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">Phase A</span>
                          <h4 className="text-xs font-bold text-white">Repository setup & Local Mock Schema</h4>
                          <p className="text-[10px] text-white/50">Initialize directory files, Git, configure Tailwind structures.</p>
                        </div>
                        <div className="p-4 bg-black border border-cyan-500/15 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">Phase B</span>
                          <h4 className="text-xs font-bold text-white">Express Backend REST Routing</h4>
                          <p className="text-[10px] text-white/50">Configure mock controller routing models to simulate query metrics.</p>
                        </div>
                        <div className="p-4 bg-black border border-cyan-500/15 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">Phase C</span>
                          <h4 className="text-xs font-bold text-white">Refinement & Error Boundary Guard</h4>
                          <p className="text-[10px] text-white/50">Deploy sandbox targets to free cloud servers on continuous git push.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center pt-2">
                       <span className="text-xs text-white/40 font-mono">Project Stack tokens:</span>
                      {proj.techStack?.map((stat, i) => (
                        <span key={i} className="px-2.5 py-1 bg-cyan-500/10 text-cyan-300 rounded font-mono text-xs font-bold">
                          {stat}
                        </span>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 8. PROFILE & ACHIEVEMENTS MANAGEMENT */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="bg-black border border-cyan-500/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(34,211,238,0.02)]">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-cyan-500/20">
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase font-display">Student Innovative Profile Spaces</h2>
                  <p className="text-xs text-white/40 font-mono">Manage dynamic profile tags, parameters, and certified diagnostic credentials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* PROFILE INFORMATION SECTION */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white font-display">Bio Parameters</h3>
                  
                  <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4 font-mono text-xs text-white/80">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/40 uppercase font-bold">Candidate Name</span>
                      <span className="text-white font-bold">{profile.studentName}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/40 uppercase font-bold">Academic Status</span>
                      <span className="text-white font-bold">{profile.currentYear}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/40 uppercase font-bold">Engineering Campus</span>
                      <span className="text-white font-bold">{profile.college}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                      <span className="text-white/40 uppercase font-bold">Primary Target Pathway</span>
                      <span className="text-cyan-400 font-bold">{selectedTrack}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-white/40 uppercase font-bold block">Selected Career Interests</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {profile.interests?.map((i, idx) => (
                          <span key={idx} className="bg-white/5 text-white/80 px-2.5 py-1 rounded-md text-[11px]">
                            {i}
                          </span>
                        )) || <span className="text-white/30 font-bold">No custom tags configured</span>}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('onboarding')}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-mono border border-white/5"
                  >
                    Modify Onboarding Parameters
                  </button>
                </div>

                {/* EARNED CERTIFIED BADGES */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white font-display">Syllabus Badges</h3>
                  
                  <div className="space-y-3">
                    {['b-welcome', 'b-quiz', 'b-expert', 'b-pioneer', 'b-scholar'].map((id) => {
                      const earned = profile.badgetIds.includes(id);
                      const detail = getBadgeDetails(id);
                      
                      return (
                        <div key={id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                          earned 
                            ? 'bg-black/40 border-cyan-500/25 shadow-[0_0_15px_rgba(34,211,238,0.05)]' 
                            : 'bg-[#020204] border-white/5 opacity-45'
                        }`}>
                          <div className={`w-12 h-12 bg-gradient-to-tr rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                            earned ? detail.color : 'from-gray-700 to-gray-800'
                          }`}>
                            {earned ? detail.icon : '🔒'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-white tracking-tight">{detail.label}</h4>
                              {earned ? (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1 rounded uppercase">Earned</span>
                              ) : (
                                <span className="text-[8px] bg-white/5 text-white/30 font-mono px-1 rounded uppercase">Locked</span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{detail.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
