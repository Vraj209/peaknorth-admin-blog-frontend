import { useEffect, useState } from "react";
import {
  Plus,
  Lightbulb,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { FirestoreService } from "../lib/firestore";
import type { BlogIdea } from "../types/post";

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

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const ideasData = await FirestoreService.getAllIdeas();
      setIdeas(ideasData);
      console.log("ideasData", ideasData);
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
        topic: formData.topic,
        persona: formData.persona,
        goal: formData.goal,
        targetAudience: formData.targetAudience ? 
        formData.targetAudience.split(",").map((audience) => audience.trim())
         : undefined,
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const unusedIdeas = ideas.filter((idea) => !idea.used);
  const usedIdeas = ideas.filter((idea) => idea.used);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Ideas</h1>
          <p className="mt-2 text-gray-600">
            Manage your blog post ideas for the automation workflow
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Idea
        </button>
      </div>

      {/* Add Idea Form */}
      {showForm && (
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Add New Blog Idea
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700"
                >
                  Topic *
                </label>
                <input
                  type="text"
                  id="topic"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Target Persona *
                </label>
                <input
                  type="text"
                  id="persona"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                className="block text-sm font-medium text-gray-700"
              >
                Goal *
              </label>
              <textarea
                id="goal"
                required
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                className="block text-sm font-medium text-gray-700"
              >
                Target Audience (Optional)
              </label>
              <input
                type="text"
                id="targetAudience"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                placeholder="More specific audience details"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  id="tags"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="react, performance, tutorial (comma separated)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialForm);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Idea"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Lightbulb className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Available Ideas
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {unusedIdeas.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Used Ideas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {usedIdeas.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  High Priority
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    unusedIdeas.filter((idea) => idea.priority === "high")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Ideas */}
      {unusedIdeas.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Available Ideas
            </h2>
            <p className="text-sm text-gray-600">
              These ideas are ready to be used by the automation workflow
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {unusedIdeas.map((idea) => (
              <div key={idea.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Topic: {idea.topic}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          idea.priority
                        )}`}
                      >
                        {idea.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 text-left">
                      <span className="font-medium">Persona:</span>{" "}
                      {idea.persona}
                    </p>
                    <p className="text-sm text-gray-600 mb-3 text-left"><span className="font-medium">Goal:</span> {idea.goal}</p>
                    {idea.targetAudience && (
                      <p className="text-sm text-gray-600 mb-2 text-left">
                        <span className="font-medium">Target Audience:</span>{" "}
                        {idea.targetAudience.join(", ")}
                      </p>
                    )}

                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {idea.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-right">
                      Added {new Date(idea.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button className="ml-4 p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used Ideas */}
      {usedIdeas.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Used Ideas</h2>
            <p className="text-sm text-gray-600">
              These ideas have been turned into blog posts
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {usedIdeas.map((idea) => (
              <div key={idea.id} className="p-6 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-600">
                        {idea.topic}
                      </h3>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500">{idea.persona}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {ideas.length === 0 && (
        <div className="bg-white shadow-sm rounded-lg p-12 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No ideas yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first blog post idea.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
