import axios from 'axios';

// Use the correct backend port from launchSettings.json
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7277/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for LLM calls
  // Allow HTTPS with self-signed certificates in development
  httpsAgent: process.env.NODE_ENV === 'development' ? {
    rejectUnauthorized: false
  } : undefined
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Request Data:', config.data);
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
    console.log('Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });
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
  rationale?: string;
}

export interface EnhancementResponse {
  enhancements: RequirementEnhancement[];
  recommendedIndex?: number;
}

export interface AnalyzeRequest {
  text: string;
  projectId?: string;
}

export interface EnhanceRequest {
  text: string;
  issues?: QualityIssue[];
}

export interface HealthResponse {
  status: string;
  message: string;
  perplexityConnected?: boolean;
  timestamp: string;
  version?: string;
}

// API functions
export const requirementsApi = {
  // Test API connection - FIXED ENDPOINT
  testConnection: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>('/requirements/health');
    return response.data;
  },

  // Analyze a single requirement for quality issues
  analyzeRequirement: async (requirement: string): Promise<RequirementAnalysis> => {
    if (!requirement?.trim()) {
      throw new Error('Requirement text is required');
    }

    console.log('Analyzing requirement:', requirement.substring(0, 100) + '...');
    
    const response = await api.post<RequirementAnalysis>('/requirements/analyze', {
      text: requirement.trim()
    });
    
    console.log('Analysis result:', response.data);
    return response.data;
  },

  // Enhance a requirement based on identified issues
  enhanceRequirement: async (requirement: string, issues?: QualityIssue[]): Promise<EnhancementResponse> => {
    if (!requirement?.trim()) {
      throw new Error('Requirement text is required');
    }

    console.log('Enhancing requirement:', requirement.substring(0, 100) + '...');
    console.log('Based on issues:', issues?.length || 0, 'issues');
    
    const response = await api.post<EnhancementResponse>('/requirements/enhance', {
      text: requirement.trim(),
      issues: issues || []
    });
    
    console.log('Enhancement result:', response.data);
    return response.data;
  },

  // Batch analyze multiple requirements
  batchAnalyze: async (requirements: string[]): Promise<RequirementAnalysis[]> => {
    if (!requirements?.length) {
      throw new Error('Requirements array is required');
    }

    const validRequirements = requirements.filter(req => req?.trim());
    if (validRequirements.length === 0) {
      throw new Error('At least one valid requirement is required');
    }

    if (validRequirements.length > 50) {
      throw new Error('Maximum 50 requirements allowed for batch processing');
    }

    console.log('Batch analyzing:', validRequirements.length, 'requirements');
    
    const response = await api.post<RequirementAnalysis[]>('/requirements/batch-analyze', {
      requirements: validRequirements
    });
    
    console.log('Batch analysis result:', response.data.length, 'analyses completed');
    return response.data;
  },

  // Get API statistics and capabilities
  getStats: async () => {
    const response = await api.get('/requirements/stats');
    return response.data;
  }
};

// Development helper to test backend connection
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing backend connection...');
    const health = await requirementsApi.testConnection();
    console.log('Backend connected:', health);
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};

export default api;