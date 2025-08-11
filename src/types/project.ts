// src/types/project.ts - TypeScript type definitions
export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  requirementCount: number;
  analyzedCount: number;
  averageQualityScore?: number;
}

export interface ProjectRequirement {
  id: number;
  projectId: number;
  text: string;
  title?: string;
  status: 'Draft' | 'Analyzed' | 'Enhanced' | 'Failed';
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
  analysis?: AnalysisResponse;
  enhancements?: EnhancementResponse;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateRequirementRequest {
  text: string;
  title?: string;
}

export interface UpdateRequirementRequest {
  text: string;
  title?: string;
}

export interface ProjectStats {
  totalRequirements: number;
  analyzedRequirements: number;
  enhancedRequirements: number;
  averageQualityScore?: number;
  qualityDistribution: Record<string, number>;
  commonIssues: Record<string, number>;
}

export interface QualityIssue {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  problematicText: string;
  suggestion: string;
}

export interface AnalysisResponse {
  overallScore: number;
  issues: QualityIssue[];
  analyzedAt: string;
}

export interface Enhancement {
  text: string;
  changes: string[];
  improvements: string[];
  qualityScore: number;
  rationale?: string;
}

export interface EnhancementResponse {
  enhancements: Enhancement[];
  recommendedIndex?: number;
}

// src/services/projectApi.ts - Project API service
const API_BASE_URL = 'http://localhost:5074/api';

class ProjectApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateProject(id: number, request: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectStats(id: number): Promise<ProjectStats> {
    return this.request<ProjectStats>(`/projects/${id}/stats`);
  }

  // Requirement operations
  async getProjectRequirements(projectId: number): Promise<ProjectRequirement[]> {
    return this.request<ProjectRequirement[]>(`/projects/${projectId}/requirements`);
  }

  async getRequirement(projectId: number, requirementId: number): Promise<ProjectRequirement> {
    return this.request<ProjectRequirement>(`/projects/${projectId}/requirements/${requirementId}`);
  }

  async addRequirement(projectId: number, request: CreateRequirementRequest): Promise<ProjectRequirement> {
    return this.request<ProjectRequirement>(`/projects/${projectId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateRequirement(
    projectId: number, 
    requirementId: number, 
    request: UpdateRequirementRequest
  ): Promise<ProjectRequirement> {
    return this.request<ProjectRequirement>(`/projects/${projectId}/requirements/${requirementId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteRequirement(projectId: number, requirementId: number): Promise<void> {
    await this.request<void>(`/projects/${projectId}/requirements/${requirementId}`, {
      method: 'DELETE',
    });
  }

  // Analysis operations
  async analyzeRequirement(projectId: number, requirementId: number): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>(`/projects/${projectId}/requirements/${requirementId}/analyze`, {
      method: 'POST',
    });
  }

  async enhanceRequirement(projectId: number, requirementId: number): Promise<EnhancementResponse> {
    return this.request<EnhancementResponse>(`/projects/${projectId}/requirements/${requirementId}/enhance`, {
      method: 'POST',
    });
  }

  async analyzeAllRequirements(projectId: number): Promise<{ analyzedCount: number; results: AnalysisResponse[] }> {
    return this.request(`/projects/${projectId}/analyze-all`, {
      method: 'POST',
    });
  }

  // Health check
  async testConnection(): Promise<{ status: string; message: string; perplexityConnected: boolean }> {
    return this.request<{ status: string; message: string; perplexityConnected: boolean }>('/requirements/health');
  }
}

export const projectApi = new ProjectApiService();