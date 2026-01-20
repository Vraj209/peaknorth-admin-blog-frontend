import { useEffect, useState } from "react";
import {
  Plus,
  Lightbulb,
  Trash2,
  Filter
} from "lucide-react";
import { FirestoreService } from "../lib/firestore";
import type { BlogIdea, IdeaStatus } from "../types/post";

interface NewIdeaForm {
  topic: string;
  persona: string;
  goal: string;
  targetAudience: string;
  priority: "low" | "medium" | "high";
  tags: string;
}

const initialForm: NewIdeaForm = {
  topic: "",
  persona: "",
  goal: "",
  targetAudience: "",
  priority: "medium",
  tags: "",
};

export function IdeasList() {
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewIdeaForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const ideasData = await FirestoreService.getAllIdeas();
      setIdeas(ideasData);
    } catch (error) {
      console.error("Error loading ideas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const ideaData = {
        status: 'UNUSED' as IdeaStatus,
        topic: formData.topic,
        persona: formData.persona,
        goal: formData.goal,
        targetAudience: formData.targetAudience || undefined,
        priority: formData.priority,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined,
      };

      await FirestoreService.createIdea(ideaData);
      await loadIdeas();
      setFormData(initialForm);
      setShowForm(false);
    } catch (error) {
      console.error("Error creating idea:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (!window.confirm("Are you sure you want to delete this idea?")) {
      return;
    }

    try {
      await FirestoreService.deleteIdea(ideaId);
      await loadIdeas();
    } catch (error) {
      console.error("Error deleting idea:", error);
      alert("Failed to delete idea. Please try again.");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: IdeaStatus) => {
    switch (status) {
      case "UNUSED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "USED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: IdeaStatus) => {
    switch (status) {
      case "UNUSED":
        return "Available";
      case "PROCESSING":
        return "In Progress";
      case "USED":
        return "Used";
      default:
        return status;
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (statusFilter === 'ALL') return true;
    return idea.status === statusFilter;
  });

  const unusedCount = ideas.filter((idea) => idea.status === 'UNUSED').length;
  const processingCount = ideas.filter((idea) => idea.status === 'PROCESSING').length;
  const usedCount = ideas.filter((idea) => idea.status === 'USED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Blog Ideas</h1>
          <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
            Manage your blog post ideas for the automation workflow
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Idea
        </button>
      </div>

      {/* Add Idea Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">
              Add New Blog Idea
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="topic"
                  required
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  placeholder="e.g., How to optimize React performance"
                />
              </div>

              <div>
                <label
                  htmlFor="persona"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  Target Persona <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="persona"
                  required
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                  value={formData.persona}
                  onChange={(e) =>
                    setFormData({ ...formData, persona: e.target.value })
                  }
                  placeholder="e.g., React developers, startup founders"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="goal"
                className="block text-sm font-medium text-gray-900 mb-1.5"
              >
                Goal <span className="text-red-500">*</span>
              </label>
              <textarea
                id="goal"
                required
                rows={3}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value })
                }
                placeholder="What should readers learn or do after reading this post?"
              />
            </div>

            <div>
              <label
                htmlFor="targetAudience"
                className="block text-sm font-medium text-gray-900 mb-1.5"
              >
                Target Audience <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                id="targetAudience"
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                placeholder="More specific audience details"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as any,
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  Tags <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="tags"
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="react, performance, tutorial (comma separated)"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialForm);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Adding..." : "Add Idea"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow">
          <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">
            Available
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-blue-600">
            {unusedCount}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow">
          <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">
            In Progress
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-yellow-600">
            {processingCount}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow">
          <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">
            Used
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-green-600">
            {usedCount}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({ideas.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNUSED')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'UNUSED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Available ({unusedCount})
            </button>
            <button
              onClick={() => setStatusFilter('PROCESSING')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'PROCESSING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              In Progress ({processingCount})
            </button>
            <button
              onClick={() => setStatusFilter('USED')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'USED'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Used ({usedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Ideas List */}
      {filteredIdeas.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">
              {statusFilter === 'ALL' ? 'All Ideas' : 
               statusFilter === 'UNUSED' ? 'Available Ideas' :
               statusFilter === 'PROCESSING' ? 'Ideas In Progress' : 'Used Ideas'}
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mt-0.5">
              {filteredIdeas.length} {filteredIdeas.length === 1 ? 'idea' : 'ideas'} found
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredIdeas.map((idea) => (
              <div key={idea.id} className="p-4 lg:p-6 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm lg:text-base font-semibold text-gray-900">
                        {idea.topic}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                          idea.status
                        )}`}
                      >
                        {getStatusLabel(idea.status)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityColor(
                          idea.priority
                        )}`}
                      >
                        {idea.priority}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 text-left">
                      <span className="font-medium">Persona:</span>{" "}
                      {idea.persona}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600 text-left">
                      <span className="font-medium">Goal:</span> {idea.goal}
                    </p>
                    {idea.targetAudience && (
                      <p className="text-xs lg:text-sm text-gray-600 text-left">
                        <span className="font-medium">Target Audience:</span>{" "}
                        {idea.targetAudience}
                      </p>
                    )}

                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-left">
                        {idea.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-left">
                      Added {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleDelete(idea.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    title="Delete idea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-12 text-center">
          <Lightbulb className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400" />
          <h3 className="mt-3 text-sm lg:text-base font-medium text-gray-900">
            No ideas yet
          </h3>
          <p className="mt-1 text-xs lg:text-sm text-gray-500">
            Get started by adding your first blog post idea.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Idea
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-12 text-center">
          <Filter className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400" />
          <h3 className="mt-3 text-sm lg:text-base font-medium text-gray-900">
            No ideas found
          </h3>
          <p className="mt-1 text-xs lg:text-sm text-gray-500">
            No ideas match the selected filter. Try a different filter.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setStatusFilter('ALL')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors"
            >
              Show All Ideas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
