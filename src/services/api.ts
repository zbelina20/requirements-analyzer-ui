// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Type definitions
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

// API functions
export const requirementsApi = {
  // Analyze a single requirement for quality issues
  analyzeRequirement: async (requirement: string): Promise<RequirementAnalysis> => {
    const response = await api.post<RequirementAnalysis>('/requirements/analyze', {
      text: requirement
    });
    return response.data;
  },

  // Enhance a requirement based on identified issues
  enhanceRequirement: async (requirement: string, issues?: QualityIssue[]): Promise<EnhancementResponse> => {
    const response = await api.post<EnhancementResponse>('/requirements/enhance', {
      text: requirement,
      issues: issues
    });
    return response.data;
  },

  // Test API connection
  testConnection: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Batch analyze multiple requirements
  batchAnalyze: async (requirements: string[]): Promise<RequirementAnalysis[]> => {
    const response = await api.post<RequirementAnalysis[]>('/requirements/batch-analyze', {
      requirements: requirements
    });
    return response.data;
  }
};

export default api;