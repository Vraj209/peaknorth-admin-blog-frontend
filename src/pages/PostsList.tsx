import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  X,
  Save,
  RefreshCw,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { HybridFirestoreService } from "../lib/hybrid-firestore";
import { getRelativeTimeString } from "../lib/scheduling";
import type { BlogPost, PostStatus } from "../types/post";

const statusOptions: {
  value: PostStatus | "all";
  label: string;
  color: string;
}[] = [
  { value: "all", label: "All Posts", color: "bg-gray-500" },
  { value: "BRIEF", label: "Brief", color: "bg-gray-500" },
  { value: "OUTLINE", label: "Outline", color: "bg-blue-500" },
  { value: "DRAFT", label: "Draft", color: "bg-yellow-500" },
  { value: "NEEDS_REVIEW", label: "Needs Review", color: "bg-orange-500" },
  { value: "APPROVED", label: "Approved", color: "bg-green-500" },
  { value: "SCHEDULED", label: "Scheduled", color: "bg-purple-500" },
  { value: "PUBLISHED", label: "Published", color: "bg-green-600" },
];

export function PostsList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    topic: "",
    persona: "",
    goal: "",
    targetAudience: "",
  });

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, statusFilter]);

  const loadPosts = async () => {
    try {
      const postsData = await HybridFirestoreService.getAllPosts();
      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.outline?.title?.toLowerCase().includes(term) ||
          post.brief?.topic?.toLowerCase().includes(term) ||
          post.brief?.persona?.toLowerCase().includes(term) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    setFilteredPosts(filtered);
  };

  const getStatusIcon = (status: PostStatus) => {
    switch (status) {
      case "PUBLISHED":
        return <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4" />;
      case "APPROVED":
      case "SCHEDULED":
        return <Clock className="h-3 w-3 lg:h-4 lg:w-4" />;
      case "NEEDS_REVIEW":
        return <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4" />;
      default:
        return <FileText className="h-3 w-3 lg:h-4 lg:w-4" />;
    }
  };

  const getStatusColor = (status: PostStatus) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.color : "bg-gray-500";
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const postData = {
        status: "BRIEF" as PostStatus,
        brief: {
          topic: createForm.topic,
          persona: createForm.persona,
          goal: createForm.goal,
          targetAudience: createForm.targetAudience ? createForm.targetAudience.split(",").map((audience) => audience.trim()) : undefined,
          keyPoints: [],
        },
        outline: {
          title: createForm.topic,
          introduction: createForm.goal,
          sections: [],
          conclusion: createForm.goal,
        },
        draft: {
          mdx: "",
          wordCount: 0,
          estimatedReadTime: 0,
        },
        seo: {
          metaTitle: createForm.topic,
          metaDescription: createForm.goal,
          focusKeyword: createForm.topic,
          keywords: [],
          slug: createForm.topic,
        },
        tags: [],
        publicUrl: undefined,
        errorMessage: undefined,
      };

      await HybridFirestoreService.createPost(postData);
      await loadPosts();
      setShowCreateModal(false);
      setCreateForm({ topic: "", persona: "", goal: "", targetAudience: "" });
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setCreating(false);
    }
  };

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Posts</h1>
          <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
            Manage your blog posts and their automation workflow
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 lg:py-2.5 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2 lg:py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as PostStatus | "all")
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3 lg:space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-12 text-center">
            <FileText className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400" />
            <h3 className="mt-3 text-sm lg:text-base font-medium text-gray-900">
              No posts found
            </h3>
            <p className="mt-1 text-xs lg:text-sm text-gray-500">
              {posts.length === 0
                ? "Get started by creating your first blog post."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 hover:border-gray-300 transition-all group text-left"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                <div className="flex-1 min-w-0 space-y-3 text-left">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 text-left">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white ${getStatusColor(
                        post.status
                      )}`}
                    >
                      {getStatusIcon(post.status)}
                      {post.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="text-left">
                    <Link
                      to={`/posts/${post.id}`}
                      className="block text-base lg:text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors line-clamp-2 text-left"
                    >
                      {post.outline?.title ||
                        post.brief?.topic ||
                        "Untitled Post"}
                    </Link>
                    {post.brief?.persona && (
                      <p className="text-xs lg:text-sm text-gray-600 mt-1 text-left">
                        Target: {post.brief.persona}
                      </p>
                    )}
                  </div>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-xs lg:text-sm text-gray-500 text-left">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span className="hidden sm:inline">Created </span>
                      {post.createdAt ? new Date(post.createdAt.getTime()).toLocaleDateString() : 'N/A'}
                    </div>

                    {post.scheduledAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">Scheduled </span>
                        {getRelativeTimeString(post.scheduledAt?.getTime?.() ?? 0)}
                      </div>
                    )}

                    {post.publishedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">Published </span>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    )}

                    {post.draft?.wordCount && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
                        {post.draft?.wordCount.toLocaleString()} words
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 text-left">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col items-center gap-2 lg:gap-3 self-start">
                  {post.publicUrl && (
                    <a
                      href={post.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                      title="View published post"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <Link
                    to={`/posts/${post.id}`}
                    className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    {post.status === "NEEDS_REVIEW" ? "Review" : "Edit"}
                    <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredPosts.length > 0 && (
        <div className="text-xs lg:text-sm text-gray-500 text-center py-2">
          Showing <span className="font-medium text-gray-900">{filteredPosts.length}</span> of <span className="font-medium text-gray-900">{posts.length}</span> posts
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
          <div className="relative my-8 w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                  Create New Post
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreatePost} className="p-4 lg:p-6 space-y-4">
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
                    value={createForm.topic}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, topic: e.target.value })
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
                    value={createForm.persona}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, persona: e.target.value })
                    }
                    placeholder="e.g., React developers, startup founders"
                  />
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
                    value={createForm.goal}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, goal: e.target.value })
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
                    value={createForm.targetAudience}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        targetAudience: e.target.value,
                      })
                    }
                    placeholder="More specific audience details"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
