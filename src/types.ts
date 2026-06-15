export interface SkillRating {
  skillName: string;
  category: string; // e.g. "Languages", "Tools", "Core CS", "Soft Skills"
  studentScore: number; // 0-100 score
  industryStandard: number; // 0-100 target score
  gapDescription: string;
}

export type CareerTrack = 
  | 'Software Engineer'
  | 'Data Scientist'
  | 'AI Engineer'
  | 'Cybersecurity Analyst'
  | 'Cloud Engineer'
  | 'UI/UX Designer';

export interface CourseRecommendation {
  title: string;
  provider: string; // e.g. "Coursera", "Google", "YouTube (Free)", "freeCodeCamp"
  url: string;
  type: 'free' | 'cert' | 'tutorial';
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
}

export interface RoadmapStep {
  id: string;
  title: string;
  phase: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedWeeks: number;
  skillsAcquired: string[];
  description: string;
  resources: CourseRecommendation[];
  isCompleted?: boolean;
}

export interface CareerRecommendationResult {
  track: CareerTrack;
  matchPercentage: number;
  summary: string;
  whyThisFits: string[];
  skillsList: SkillRating[];
  roadmap: RoadmapStep[];
  suggestedProjects: {
    title: string;
    description: string;
    complexity: string;
    techStack: string[];
  }[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number; // 0-3
  explanation: string;
  skillTag: string; // which skill this tests
}

export interface QuizEvaluation {
  score: number;
  totalQuestions: number;
  insights: string;
  skillGapsIdentified: string[];
  updatedSkillRatings: { skillName: string; extraScore: number }[];
}

export interface MarketTrend {
  track: CareerTrack;
  demandScore: number; // 0-100 indicating index
  salaryRange: string; // e.g. "$80,000 - $140,000"
  growthRate: string; // e.g. "+18% YoY"
  trendingKeywords: string[];
  overview: string;
  emergingSkills: { name: string; relevance: string }[];
}

export interface StudentProfile {
  studentName: string;
  currentYear: string; // e.g. "1st Year BE / BTech"
  college: string;
  interests: string[];
  completedCourses: string[];
  completedRoadmapSteps: string[];
  badgetIds: string[];
}
