// src/types/index.ts

export interface QualityIssue {
  type: 'ambiguity' | 'completeness' | 'consistency' | 'verifiability' | 'traceability';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  problematicText: string;
  suggestion: string;
}

export interface RequirementAnalysis {
  overallScore: number;
  issues: QualityIssue[];
  analyzedAt: string;
}

export interface RequirementEnhancement {
  text: string;
  changes: string[];
  improvements: string[];
  qualityScore: number;
}

export interface EnhancementResponse {
  enhancements: RequirementEnhancement[];
}

export interface AnalyzeRequest {
  text: string;
  projectId?: string;
}

export interface EnhanceRequest {
  text: string;
  issues?: QualityIssue[];
}

export interface BatchRequirement {
  key: string;
  id: number;
  text: string;
  analysis?: RequirementAnalysis;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface BatchAnalyzeRequest {
  requirements: string[];
}

export interface DashboardData {
  recentAnalyses: Array<{
    id: string;
    text: string;
    score: number;
    issues: number;
    analyzedAt: string;
  }>;
  qualityTrends: Array<{
    date: string;
    averageScore: number;
    totalAnalyses: number;
  }>;
  issueDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  severityBreakdown: Array<{
    severity: string;
    count: number;
    color: string;
  }>;
}

export type ApiStatus = 'healthy' | 'degraded' | 'unhealthy';

export type ProgressStatus = 'success' | 'normal' | 'exception';

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}