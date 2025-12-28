import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCreatePlanAsync } from '@/api/hooks';
import type { AsyncPlanJob } from '@/api/softwarePlannerClient';
import type { PlanRequest } from '@/api/softwarePlanner/models/PlanRequest';
import { getDraft, saveDraft, removeDraft } from '@/utils/localStorage';
import { countWords } from '@/utils/textUtils';
import '@/styles/PlannerInputPage.css';

interface FormData {
  description: string;
  model: string;
  system_prompt: string;
}

interface ValidationErrors {
  description?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  QUEUED: {
    label: 'Queued',
    color: '#666666',
    bgColor: '#f5f5f5',
  },
  RUNNING: {
    label: 'In Progress',
    color: '#0066cc',
    bgColor: '#e3f2fd',
  },
  SUCCEEDED: {
    label: 'Completed',
    color: '#388e3c',
    bgColor: '#e8f5e9',
  },
  FAILED: {
    label: 'Failed',
    color: '#d32f2f',
    bgColor: '#ffebee',
  },
};

const MAX_DESCRIPTION_LENGTH = 8192;
const DRAFT_STORAGE_KEY = 'planner-input-draft';

const PlannerInputPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(() => {
    // Try to restore draft from localStorage on mount
    const draft = getDraft<FormData>(DRAFT_STORAGE_KEY);
    return draft || {
      description: '',
      model: '',
      system_prompt: '',
    };
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [submittedPlan, setSubmittedPlan] = useState<AsyncPlanJob | null>(null);
  const [createdAt, setCreatedAt] = useState<string>('');

  const createPlan = useCreatePlanAsync({
    onSuccess: (data) => {
      setSubmittedPlan(data);
      setValidationErrors({});
      setCreatedAt(new Date().toISOString());
      // Clear the draft after successful submission
      removeDraft(DRAFT_STORAGE_KEY);
    },
  });

  // Auto-save form data to localStorage whenever it changes
  useEffect(() => {
    // Only save if form has content and no plan has been submitted
    if (!submittedPlan && (formData.description || formData.model || formData.system_prompt)) {
      saveDraft(DRAFT_STORAGE_KEY, formData);
    }
  }, [formData, submittedPlan]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.description.trim()) {
      errors.description = 'Description is required and cannot be empty';
    } else if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (createPlan.isPending) {
      return;
    }

    const payload: PlanRequest = {
      description: formData.description.trim(),
      model: formData.model.trim() || null,
      system_prompt: formData.system_prompt.trim() || null,
    };

    createPlan.mutate(payload);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status] || {
        label: status,
        color: '#666666',
        bgColor: '#f5f5f5',
      }
    );
  };

  const handleNewPlan = () => {
    setSubmittedPlan(null);
    setCreatedAt('');
    setFormData({
      description: '',
      model: '',
      system_prompt: '',
    });
    setValidationErrors({});
    createPlan.reset();
    // Clear any existing draft when starting a new plan
    removeDraft(DRAFT_STORAGE_KEY);
  };

  const statusConfig = useMemo(
    () => (submittedPlan ? getStatusConfig(submittedPlan.status) : null),
    [submittedPlan]
  );

  return (
    <div className="container">
      <h1>Create Software Plan</h1>
      <p>
        Describe your software project below and our AI will generate a
        comprehensive development plan.
      </p>

      {submittedPlan && statusConfig ? (
        <div className="card mt-lg confirmation-card" role="status">
          <h2>Plan Created Successfully!</h2>

          <div className="plan-metadata">
            <div className="metadata-item">
              <strong>Plan ID:</strong>
              <span className="plan-id">{submittedPlan.job_id}</span>
            </div>

            <div className="metadata-item">
              <strong>Status:</strong>
              <span
                className="status-badge"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </span>
            </div>

            <div className="metadata-item">
              <strong>Created:</strong>
              <span>
                {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/plans" className="btn btn-primary">
              View All Plans
            </Link>
            <Link
              to={`/plans/${submittedPlan.job_id}`}
              className="btn btn-primary"
            >
              View Plan Details
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNewPlan}
            >
              Create Another Plan
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="plan-form mt-lg" noValidate>
          <div className="card">
            <div className="form-group">
              <label htmlFor="description" className="form-label required">
                Project Description
              </label>
              <p className="form-helper-text">
                {`Describe your software project in detail. Include key features, requirements, and constraints. Be specific about what the software should do and any technical requirements. (Required, max ${MAX_DESCRIPTION_LENGTH} characters)`}
              </p>
              <textarea
                id="description"
                name="description"
                className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
                value={formData.description}
                onChange={handleInputChange}
                rows={8}
                placeholder="Example: Build a task management API with user authentication, task CRUD operations, and real-time notifications. Must support REST endpoints, use PostgreSQL database, and include rate limiting..."
                aria-required="true"
                aria-invalid={!!validationErrors.description}
                aria-describedby={
                  validationErrors.description
                    ? 'description-error'
                    : 'description-helper'
                }
                disabled={createPlan.isPending}
              />
              {validationErrors.description && (
                <span
                  id="description-error"
                  className="error-message"
                  role="alert"
                >
                  {validationErrors.description}
                </span>
              )}
              <div className="input-meta">
                <span className="word-count" aria-live="polite">
                  {countWords(formData.description)} words
                </span>
                <span className="character-count">
                  {formData.description.length} / {MAX_DESCRIPTION_LENGTH} characters
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="model" className="form-label">
                Model (Optional)
              </label>
              <p className="form-helper-text">
                Specify a logical model name (e.g., 'gpt-4-turbo',
                'claude-opus'). Leave empty to use the default model.
              </p>
              <input
                type="text"
                id="model"
                name="model"
                className="form-input"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., gpt-4-turbo"
                disabled={createPlan.isPending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="system_prompt" className="form-label">
                Custom System Prompt (Optional)
              </label>
              <p className="form-helper-text">
                {`Override the default system prompt to customize planning behavior. You can adjust the tone, focus areas, or add specific instructions for the AI planner. (Optional, max 32768 characters)`}
              </p>
              <textarea
                id="system_prompt"
                name="system_prompt"
                className="form-textarea"
                value={formData.system_prompt}
                onChange={handleInputChange}
                rows={6}
                placeholder="Example: Focus on microservices architecture. Emphasize security best practices and scalability considerations. Include detailed API documentation requirements..."
                disabled={createPlan.isPending}
              />
              {formData.system_prompt && (
                <div className="input-meta">
                  <span className="word-count" aria-live="polite">
                    {countWords(formData.system_prompt)} words
                  </span>
                  <span className="character-count">
                    {formData.system_prompt.length} / 32768 characters
                  </span>
                </div>
              )}
            </div>

            {createPlan.error && (
              <div className="error-banner" role="alert">
                <strong>Error:</strong> {createPlan.error.message}
                <p className="error-hint">
                  Please review your input and try again. If the problem
                  persists, contact support.
                </p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-submit"
                disabled={createPlan.isPending || !formData.description.trim()}
              >
                {createPlan.isPending ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Creating Plan...
                  </>
                ) : (
                  'Create Plan'
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PlannerInputPage;
