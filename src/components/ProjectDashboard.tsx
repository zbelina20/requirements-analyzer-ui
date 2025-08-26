import React, { useState, useEffect, useCallback } from 'react';

interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  requirementCount: number;
  analyzedCount: number;
  averageQualityScore?: number;
}

interface ProjectRequirement {
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

interface CreateProjectRequest {
  name: string;
  description?: string;
}

interface CreateRequirementRequest {
  text: string;
  title?: string;
}

interface GenerateRequirementsRequest {
  userStory: string;
  projectContext?: string;
}

interface GeneratedRequirement {
  type: 'functional' | 'non-functional' | 'validation' | 'security' | 'usability';
  title: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

interface QualityIssue {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  problematicText: string;
  suggestion: string;
}

interface AnalysisResponse {
  overallScore: number;
  issues: QualityIssue[];
  analyzedAt: string;
}

interface Enhancement {
  text: string;
  changes: string[];
  improvements: string[];
  qualityScore: number;
  rationale?: string;
}

interface EnhancementResponse {
  enhancements: Enhancement[];
  recommendedIndex?: number;
}

const API_BASE_URL = 'http://localhost:5074/api';

const ProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [showGenerateRequirements, setShowGenerateRequirements] = useState(false);
  const [showEditRequirement, setShowEditRequirement] = useState(false);
  const [showRequirementDetails, setShowRequirementDetails] = useState(false);
  const [showGenerationResults, setShowGenerationResults] = useState(false);
  
  // Form states
  const [newProject, setNewProject] = useState<CreateProjectRequest>({ name: '', description: '' });
  const [editProject, setEditProject] = useState<CreateProjectRequest>({ name: '', description: '' });
  const [newRequirement, setNewRequirement] = useState<CreateRequirementRequest>({ text: '', title: '' });
  const [editRequirement, setEditRequirement] = useState<CreateRequirementRequest>({ text: '', title: '' });
  const [generateRequest, setGenerateRequest] = useState<GenerateRequirementsRequest>({ userStory: '', projectContext: '' });
  const [generatedRequirements, setGeneratedRequirements] = useState<GeneratedRequirement[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<ProjectRequirement | null>(null);

  const apiRequest = async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(`${type}: ${text}`);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadProjects = useCallback(async () => {
    try {
      const projectList = await apiRequest('/projects');
      setProjects(projectList);
    } catch (error) {
      showMessage('Failed to load projects', 'error');
    }
  }, []);

  const loadRequirements = useCallback(async (projectId: number) => {
    try {
      const reqs = await apiRequest(`/projects/${projectId}/requirements`);
      setRequirements(reqs);
    } catch (error) {
      showMessage('Failed to load requirements', 'error');
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadRequirements(selectedProject.id);
    }
  }, [selectedProject, loadRequirements]);

  // Project CRUD operations
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      showMessage('Project name is required', 'error');
      return;
    }
    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      });
      setNewProject({ name: '', description: '' });
      setShowCreateProject(false);
      showMessage('Project created successfully', 'success');
      loadProjects();
    } catch (error) {
      showMessage('Failed to create project', 'error');
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !editProject.name.trim()) {
      showMessage('Project name is required', 'error');
      return;
    }
    try {
      const updatedProject = await apiRequest(`/projects/${selectedProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(editProject),
      });
      setSelectedProject(updatedProject);
      setShowEditProject(false);
      showMessage('Project updated successfully', 'success');
      loadProjects();
    } catch (error) {
      showMessage('Failed to update project', 'error');
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This will also delete all requirements in this project.`)) {
      return;
    }
    try {
      await apiRequest(`/projects/${project.id}`, { method: 'DELETE' });
      showMessage('Project deleted successfully', 'success');
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setRequirements([]);
      }
      loadProjects();
    } catch (error) {
      showMessage('Failed to delete project', 'error');
    }
  };

  // Requirement Generation
  const handleGenerateRequirements = async () => {
    if (!selectedProject || !generateRequest.userStory.trim()) {
      showMessage('User story is required', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const generationResult = await apiRequest(`/projects/${selectedProject.id}/requirements/generate`, {
        method: 'POST',
        body: JSON.stringify({
          userStory: generateRequest.userStory,
          projectContext: generateRequest.projectContext || selectedProject.description
        }),
      });
      
      setGeneratedRequirements(generationResult.requirements || []);
      setShowGenerateRequirements(false);
      setShowGenerationResults(true);
      showMessage(`Generated ${generationResult.requirements?.length || 0} requirements successfully`, 'success');
    } catch (error) {
      showMessage('Failed to generate requirements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGeneratedRequirement = async (generatedReq: GeneratedRequirement) => {
    if (!selectedProject) return;
    
    try {
      await apiRequest(`/projects/${selectedProject.id}/requirements`, {
        method: 'POST',
        body: JSON.stringify({
          text: generatedReq.text,
          title: generatedReq.title
        }),
      });
      
      showMessage(`Added "${generatedReq.title}" to project`, 'success');
      loadRequirements(selectedProject.id);
      loadProjects();
    } catch (error) {
      showMessage('Failed to add generated requirement', 'error');
    }
  };

  const handleAddAllGeneratedRequirements = async () => {
    if (!selectedProject || generatedRequirements.length === 0) return;
    
    setLoading(true);
    try {
      const promises = generatedRequirements.map(req => 
        apiRequest(`/projects/${selectedProject.id}/requirements`, {
          method: 'POST',
          body: JSON.stringify({
            text: req.text,
            title: req.title
          }),
        })
      );
      
      await Promise.all(promises);
      setShowGenerationResults(false);
      setGeneratedRequirements([]);
      showMessage(`Added all ${generatedRequirements.length} generated requirements to project`, 'success');
      loadRequirements(selectedProject.id);
      loadProjects();
    } catch (error) {
      showMessage('Failed to add some generated requirements', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Requirement CRUD operations
  const handleAddRequirement = async () => {
    if (!selectedProject || !newRequirement.text.trim()) {
      showMessage('Requirement text is required', 'error');
      return;
    }
    try {
      await apiRequest(`/projects/${selectedProject.id}/requirements`, {
        method: 'POST',
        body: JSON.stringify(newRequirement),
      });
      setNewRequirement({ text: '', title: '' });
      setShowAddRequirement(false);
      showMessage('Requirement added successfully', 'success');
      loadRequirements(selectedProject.id);
      loadProjects();
    } catch (error) {
      showMessage('Failed to add requirement', 'error');
    }
  };

  const handleEditRequirement = async () => {
    if (!selectedRequirement || !editRequirement.text.trim()) {
      showMessage('Requirement text is required', 'error');
      return;
    }
    try {
      const updatedRequirement = await apiRequest(
        `/projects/${selectedRequirement.projectId}/requirements/${selectedRequirement.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(editRequirement),
        }
      );
      setSelectedRequirement(updatedRequirement);
      setShowEditRequirement(false);
      showMessage('Requirement updated successfully', 'success');
      loadRequirements(selectedRequirement.projectId);
      loadProjects();
    } catch (error) {
      showMessage('Failed to update requirement', 'error');
    }
  };

  const handleDeleteRequirement = async (requirement: ProjectRequirement) => {
    if (!window.confirm(`Are you sure you want to delete this requirement?`)) {
      return;
    }
    try {
      await apiRequest(`/projects/${requirement.projectId}/requirements/${requirement.id}`, {
        method: 'DELETE'
      });
      showMessage('Requirement deleted successfully', 'success');
      if (selectedRequirement?.id === requirement.id) {
        setSelectedRequirement(null);
        setShowRequirementDetails(false);
      }
      loadRequirements(requirement.projectId);
      loadProjects();
    } catch (error) {
      showMessage('Failed to delete requirement', 'error');
    }
  };

  const handleAnalyzeRequirement = async (requirement: ProjectRequirement) => {
    setLoading(true);
    try {
      const analysisResult = await apiRequest(`/projects/${requirement.projectId}/requirements/${requirement.id}/analyze`, {
        method: 'POST',
      });
      
      const updatedRequirement = { 
        ...requirement, 
        status: 'Analyzed' as const, 
        qualityScore: analysisResult.overallScore, 
        analysis: analysisResult 
      };
      
      const updatedRequirements = requirements.map((req: ProjectRequirement) => 
        req.id === requirement.id ? updatedRequirement : req
      );
      setRequirements(updatedRequirements);
      
      if (selectedRequirement?.id === requirement.id) {
        setSelectedRequirement(updatedRequirement);
      }
      
      showMessage('Requirement analyzed successfully', 'success');
      loadRequirements(requirement.projectId);
      loadProjects();
    } catch (error) {
      showMessage('Failed to analyze requirement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceRequirement = async (requirement: ProjectRequirement) => {
    if (requirement.status !== 'Analyzed') {
      showMessage('Requirement must be analyzed first', 'error');
      return;
    }

    setLoading(true);
    try {
      const enhancementResult = await apiRequest(`/projects/${requirement.projectId}/requirements/${requirement.id}/enhance`, {
        method: 'POST',
      });
      
      const updatedRequirement = {
        ...requirement,
        status: 'Enhanced' as const,
        enhancements: enhancementResult
      };
      
      const updatedRequirements = requirements.map((req: ProjectRequirement) => 
        req.id === requirement.id ? updatedRequirement : req
      );
      setRequirements(updatedRequirements);
      
      if (selectedRequirement?.id === requirement.id) {
        setSelectedRequirement(updatedRequirement);
      }
      
      showMessage('Enhancement generated successfully', 'success');
      loadRequirements(requirement.projectId);
    } catch (error) {
      showMessage('Failed to enhance requirement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEnhancement = async (enhancementIndex: number) => {
    if (!selectedRequirement?.enhancements) return;

    const selectedEnhancement = selectedRequirement.enhancements.enhancements[enhancementIndex];
    setLoading(true);

    try {
      const updateData = {
        text: selectedEnhancement.text,
        title: selectedRequirement.title
      };

      await apiRequest(`/projects/${selectedRequirement.projectId}/requirements/${selectedRequirement.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const updatedRequirement = {
        ...selectedRequirement,
        text: selectedEnhancement.text,
        qualityScore: selectedEnhancement.qualityScore,
        status: 'Enhanced' as const
      };

      const updatedRequirements = requirements.map((req: ProjectRequirement) => 
        req.id === selectedRequirement.id ? updatedRequirement : req
      );
      setRequirements(updatedRequirements);
      setSelectedRequirement(updatedRequirement);

      showMessage(`Enhancement ${enhancementIndex + 1} applied successfully!`, 'success');
      loadRequirements(selectedRequirement.projectId);
      loadProjects();
    } catch (error) {
      showMessage('Failed to apply enhancement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Analyzed': return '#52c41a';
      case 'Enhanced': return '#1890ff';
      case 'Failed': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const openEditProject = (project: Project) => {
    setEditProject({ name: project.name, description: project.description || '' });
    setShowEditProject(true);
  };

  const openEditRequirement = (requirement: ProjectRequirement) => {
    setEditRequirement({ text: requirement.text, title: requirement.title || '' });
    setSelectedRequirement(requirement);
    setShowEditRequirement(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#001529',
        color: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Requirements Quality Analyzer</h1>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>Project-Based Requirements Management</div>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 1000,
          padding: '12px 16px',
          backgroundColor: message.startsWith('error') ? '#ff4d4f' :
                         message.startsWith('success') ? '#52c41a' : '#1890ff',
          color: 'white',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {message.split(': ')[1]}
        </div>
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Projects Sidebar */}
        <div style={{
          width: '300px',
          backgroundColor: 'white',
          borderRight: '1px solid #d9d9d9',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Projects</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              + New
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <div>No projects yet</div>
              <div style={{ fontSize: '14px' }}>Create your first project to get started</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '12px',
                    border: `1px solid ${selectedProject?.id === project.id ? '#1890ff' : '#d9d9d9'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selectedProject?.id === project.id ? '#e6f7ff' : 'white',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div onClick={() => setSelectedProject(project)}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{project.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      {project.description || 'No description'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                      <span>{project.requirementCount} requirements</span>
                      <span>{project.analyzedCount} analyzed</span>
                    </div>
                    {project.averageQualityScore && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${project.averageQualityScore}%`,
                            height: '100%',
                            backgroundColor: getScoreColor(project.averageQualityScore)
                          }}></div>
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                          Avg. Quality: {Math.round(project.averageQualityScore)}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Edit and Delete buttons */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditProject(project);
                      }}
                      style={{
                        padding: '4px 6px',
                        backgroundColor: '#faad14',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                      title="Edit project"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                      style={{
                        padding: '4px 6px',
                        backgroundColor: '#f5222d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '24px' }}>
          {selectedProject ? (
            <>
              {/* Project Header */}
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ margin: 0, marginBottom: '8px' }}>{selectedProject.name}</h1>
                    <p style={{ margin: 0, color: '#666', marginBottom: '16px' }}>
                      {selectedProject.description || 'No description provided'}
                    </p>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                      <div><strong>{selectedProject.requirementCount}</strong> Requirements</div>
                      <div><strong>{selectedProject.analyzedCount}</strong> Analyzed</div>
                      {selectedProject.averageQualityScore && (
                        <div>
                          Avg. Quality: <strong style={{ color: getScoreColor(selectedProject.averageQualityScore) }}>
                            {Math.round(selectedProject.averageQualityScore)}%
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setShowGenerateRequirements(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#722ed1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Generate from Story
                    </button>
                    <button
                      onClick={() => setShowAddRequirement(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#52c41a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Add Requirement
                    </button>
                  </div>
                </div>
              </div>

              {/* Requirements List */}
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Requirements</h2>
                
                {requirements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <div>No requirements yet</div>
                    <div style={{ fontSize: '14px', marginBottom: '16px' }}>Add your first requirement or generate from a user story</div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setShowGenerateRequirements(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#722ed1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Generate from Story
                      </button>
                      <button
                        onClick={() => setShowAddRequirement(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#52c41a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Add Requirement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requirements.map((requirement) => (
                      <div
                        key={requirement.id}
                        style={{
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          padding: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            {requirement.title && (
                              <h4 style={{ margin: 0, marginBottom: '8px', color: '#262626' }}>
                                {requirement.title}
                              </h4>
                            )}
                            <p style={{ 
                              margin: 0, 
                              color: '#595959',
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
                              {requirement.text.length > 200 ? `${requirement.text.substring(0, 200)}...` : requirement.text}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              backgroundColor: getStatusColor(requirement.status),
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {requirement.status}
                            </div>
                            {requirement.qualityScore && (
                              <div style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                backgroundColor: getScoreColor(requirement.qualityScore),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {requirement.qualityScore}%
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Analysis Results Preview */}
                        {requirement.analysis && requirement.analysis.issues && requirement.analysis.issues.length > 0 && (
                          <div style={{ 
                            marginBottom: '12px',
                            padding: '12px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '6px',
                            borderLeft: '4px solid #1890ff'
                          }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#1890ff', fontSize: '13px' }}>Analysis Results:</h5>
                            <div style={{ fontSize: '12px' }}>
                              <div style={{ marginBottom: '6px' }}>
                                <strong>Issues Found: </strong>{requirement.analysis.issues.length}
                              </div>
                              {requirement.analysis.issues.slice(0, 2).map((issue: any, index: number) => (
                                <div key={index} style={{
                                  padding: '6px',
                                  marginBottom: '4px',
                                  backgroundColor: 'white',
                                  borderRadius: '4px',
                                  borderLeft: `3px solid ${issue.severity === 'critical' ? '#f5222d' : 
                                                          issue.severity === 'major' ? '#faad14' : '#52c41a'}`
                                }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'capitalize' }}>
                                    {issue.type} ({issue.severity})
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#666' }}>
                                    {issue.description.substring(0, 80)}...
                                  </div>
                                </div>
                              ))}
                              {requirement.analysis.issues.length > 2 && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                  +{requirement.analysis.issues.length - 2} more issues
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Success message when no issues */}
                        {requirement.analysis && requirement.analysis.issues && requirement.analysis.issues.length === 0 && (
                          <div style={{ 
                            marginBottom: '12px',
                            padding: '12px', 
                            backgroundColor: '#f6ffed', 
                            borderRadius: '6px',
                            borderLeft: '4px solid #52c41a'
                          }}>
                            <div style={{ color: '#52c41a', fontSize: '12px', fontWeight: 'bold' }}>
                              ✓ No quality issues found - This requirement meets high quality standards!
                            </div>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => {
                              setSelectedRequirement(requirement);
                              setShowRequirementDetails(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f0f0f0',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={() => openEditRequirement(requirement)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#faad14',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          
                          {requirement.status === 'Draft' && (
                            <button
                              onClick={() => handleAnalyzeRequirement(requirement)}
                              disabled={loading}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: loading ? '#d9d9d9' : '#1890ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {loading ? 'Analyzing...' : 'Analyze'}
                            </button>
                          )}
                          
                          {requirement.status === 'Analyzed' && (
                            <button
                              onClick={() => handleEnhanceRequirement(requirement)}
                              disabled={loading}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: loading ? '#d9d9d9' : '#52c41a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {loading ? 'Enhancing...' : 'Enhance'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteRequirement(requirement)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f5222d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              backgroundColor: 'white',
              padding: '60px 24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎯</div>
              <h2 style={{ marginBottom: '16px', color: '#262626' }}>Welcome to Requirements Quality Analyzer</h2>
              <p style={{ color: '#595959', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                Select a project from the sidebar to view and analyze its requirements, or create a new project to get started.
              </p>
              <button
                onClick={() => setShowCreateProject(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Create Project Modal */}
      {showCreateProject && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowCreateProject(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Project</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe your project..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateProject(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </>
      )}

      {/* Generate Requirements Modal */}
      {showGenerateRequirements && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowGenerateRequirements(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '600px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Generate Requirements from User Story</h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', borderLeft: '4px solid #52c41a' }}>
              <div style={{ fontSize: '13px', color: '#52c41a', fontWeight: 'bold', marginBottom: '4px' }}>How it works:</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Provide a high-level user story or goal, and AI will generate detailed functional, non-functional, and validation requirements.
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                User Story / High-Level Goal *
              </label>
              <textarea
                rows={4}
                value={generateRequest.userStory}
                onChange={(e) => setGenerateRequest({ ...generateRequest, userStory: e.target.value })}
                placeholder="Example: As a user, I need to log in to my account using email and password..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {generateRequest.userStory.length}/1000 characters
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Additional Context (Optional)
              </label>
              <textarea
                rows={3}
                value={generateRequest.projectContext}
                onChange={(e) => setGenerateRequest({ ...generateRequest, projectContext: e.target.value })}
                placeholder="Additional context about your project, constraints, or specific requirements..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Current project: {selectedProject?.name} - {selectedProject?.description || 'No description'}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowGenerateRequirements(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateRequirements}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#d9d9d9' : '#722ed1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Generating...' : 'Generate Requirements'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Generated Requirements Results Modal */}
      {showGenerationResults && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowGenerationResults(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Generated Requirements ({generatedRequirements.length})</h3>
              <button
                onClick={() => setShowGenerationResults(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>
            
            {generatedRequirements.length > 0 && (
              <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button
                  onClick={handleAddAllGeneratedRequirements}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: loading ? '#d9d9d9' : '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Adding All...' : 'Add All Requirements'}
                </button>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {generatedRequirements.map((genReq, index) => (
                <div key={index} style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h5 style={{ margin: 0 }}>{genReq.title}</h5>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: genReq.type === 'functional' ? '#1890ff' : 
                                         genReq.type === 'non-functional' ? '#faad14' : 
                                         genReq.type === 'validation' ? '#52c41a' : 
                                         genReq.type === 'security' ? '#f5222d' : '#722ed1',
                          color: 'white',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {genReq.type ? genReq.type.replace('-', ' ') : 'GENERAL'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: genReq.priority === 'high' ? '#f5222d' : 
                                         genReq.priority === 'medium' ? '#faad14' : '#52c41a',
                          color: 'white',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {genReq.priority} Priority
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddGeneratedRequirement(genReq)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#52c41a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Add to Project
                    </button>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {genReq.text}
                  </div>
                  
                  <div style={{
                    backgroundColor: '#e6f7ff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <strong>Rationale:</strong> {genReq.rationale}
                  </div>
                </div>
              ))}
            </div>
            
            {generatedRequirements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                <div>No requirements generated</div>
                <div style={{ fontSize: '14px' }}>Try providing a more detailed user story</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowEditProject(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Project</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={editProject.name}
                onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                placeholder="Enter project name..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={editProject.description}
                onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                placeholder="Describe your project..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditProject(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditProject}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#faad14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Update Project
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Requirement Modal */}
      {showAddRequirement && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowAddRequirement(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '500px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Add New Requirement</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Title (Optional)
              </label>
              <input
                type="text"
                value={newRequirement.title}
                onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                placeholder="Brief title for the requirement..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Requirement Text *
              </label>
              <textarea
                rows={4}
                value={newRequirement.text}
                onChange={(e) => setNewRequirement({ ...newRequirement, text: e.target.value })}
                placeholder="The system shall..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {newRequirement.text.length}/2000 characters
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddRequirement(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRequirement}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Requirement
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Requirement Modal */}
      {showEditRequirement && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowEditRequirement(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '500px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Requirement</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Title
              </label>
              <input
                type="text"
                value={editRequirement.title}
                onChange={(e) => setEditRequirement({ ...editRequirement, title: e.target.value })}
                placeholder="Brief title for the requirement..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Requirement Text *
              </label>
              <textarea
                rows={4}
                value={editRequirement.text}
                onChange={(e) => setEditRequirement({ ...editRequirement, text: e.target.value })}
                placeholder="The system shall..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {editRequirement.text.length}/2000 characters
              </div>
            </div>
            
            <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#d48806', fontWeight: 'bold' }}>⚠️ Note:</div>
              <div style={{ fontSize: '12px', color: '#d48806' }}>
                Editing the requirement text will reset its analysis status to "Draft". You'll need to analyze it again.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditRequirement(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditRequirement}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#faad14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Update Requirement
              </button>
            </div>
          </div>
        </>
      )}

      {/* Requirement Details Modal */}
      {showRequirementDetails && selectedRequirement && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowRequirementDetails(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            width: '700px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>
                {selectedRequirement.title || 'Requirement Details'}
              </h3>
              <button
                onClick={() => setShowRequirementDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Requirement Text */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px' }}>Requirement Text:</h4>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                lineHeight: '1.6',
                fontSize: '14px'
              }}>
                {selectedRequirement.text}
              </div>
            </div>
            
            {/* Status and Score */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div>
                <strong>Status:</strong>
                <div style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor: getStatusColor(selectedRequirement.status),
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {selectedRequirement.status}
                </div>
              </div>
              {selectedRequirement.qualityScore && (
                <div>
                  <strong>Quality Score:</strong>
                  <span style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: getScoreColor(selectedRequirement.qualityScore),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {selectedRequirement.qualityScore}%
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => openEditRequirement(selectedRequirement)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#faad14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Edit Requirement
              </button>
              
              {selectedRequirement.status === 'Draft' && (
                <button
                  onClick={() => {
                    handleAnalyzeRequirement(selectedRequirement);
                    setShowRequirementDetails(false);
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: loading ? '#d9d9d9' : '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze Requirement'}
                </button>
              )}
              
              {selectedRequirement.status === 'Analyzed' && (
                <button
                  onClick={() => {
                    handleEnhanceRequirement(selectedRequirement);
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: loading ? '#d9d9d9' : '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Enhancing...' : 'Generate Enhancements'}
                </button>
              )}
            </div>
            
            {/* Analysis Results */}
            {selectedRequirement.analysis && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Analysis Results:</h4>
                {selectedRequirement.analysis.issues.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRequirement.analysis.issues.map((issue, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${issue.severity === 'critical' ? '#f5222d' : 
                                                issue.severity === 'major' ? '#faad14' : '#52c41a'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ textTransform: 'capitalize' }}>{issue.type}</strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: issue.severity === 'critical' ? '#f5222d' : 
                                            issue.severity === 'major' ? '#faad14' : '#52c41a',
                            color: 'white',
                            fontSize: '11px',
                            textTransform: 'uppercase'
                          }}>
                            {issue.severity}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
                          {issue.description}
                        </p>
                        {issue.problematicText && (
                          <div style={{ 
                            backgroundColor: '#fff2f0', 
                            padding: '8px 12px', 
                            borderRadius: '4px',
                            fontSize: '13px',
                            marginBottom: '8px'
                          }}>
                            <strong>Problematic text:</strong> "{issue.problematicText}"
                          </div>
                        )}
                        {issue.suggestion && (
                          <div style={{ 
                            backgroundColor: '#f6ffed', 
                            padding: '8px 12px', 
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}>
                            <strong>Suggestion:</strong> {issue.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    color: '#52c41a', 
                    padding: '16px', 
                    backgroundColor: '#f6ffed', 
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <strong>Great! No quality issues found.</strong>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      This requirement meets quality standards.
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Enhancement Results */}
            {selectedRequirement.enhancements && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Enhancement Suggestions:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedRequirement.enhancements.enhancements.map((enhancement, index) => (
                    <div key={index} style={{
                      border: index === selectedRequirement.enhancements?.recommendedIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '16px',
                      position: 'relative'
                    }}>
                      {index === selectedRequirement.enhancements?.recommendedIndex && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '12px',
                          backgroundColor: '#1890ff',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          RECOMMENDED
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h5 style={{ margin: 0 }}>Version {index + 1}</h5>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: getScoreColor(enhancement.qualityScore),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {enhancement.qualityScore}%
                        </span>
                      </div>

                      <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        {enhancement.text}
                      </div>

                      {enhancement.changes && enhancement.changes.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ fontSize: '13px', color: '#666' }}>Changes Made:</strong>
                          <ul style={{ margin: '4px 0 0 16px', fontSize: '13px' }}>
                            {enhancement.changes.map((change, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancement.improvements && enhancement.improvements.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ fontSize: '13px', color: '#666' }}>Improvements:</strong>
                          <ul style={{ margin: '4px 0 0 16px', fontSize: '13px' }}>
                            {enhancement.improvements.map((improvement, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancement.rationale && (
                        <div style={{
                          backgroundColor: '#e6f7ff',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          marginBottom: '12px'
                        }}>
                          <strong>Rationale:</strong> {enhancement.rationale}
                        </div>
                      )}

                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleApplyEnhancement(index)}
                          disabled={loading}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: loading ? '#d9d9d9' : 
                                            index === selectedRequirement.enhancements?.recommendedIndex ? '#1890ff' : '#52c41a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 'bold'
                          }}
                        >
                          {loading ? 'Applying...' : `Apply Enhancement ${index + 1}`}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDashboard;