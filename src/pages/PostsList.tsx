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
} from "lucide-react";
import { HybridFirestoreService } from "../lib/hybrid-firestore";
import { formatScheduledTime, getRelativeTimeString } from "../lib/scheduling";
import type { BlogPost, PostStatus } from "../types/post";

const statusOptions: {
  value: PostStatus | "all";
  label: string;
  color: string;
}[] = [
  { value: "all", label: "All Posts", color: "text-gray-600" },
  { value: "BRIEF", label: "Brief", color: "text-gray-600" },
  { value: "OUTLINE", label: "Outline", color: "text-blue-600" },
  { value: "DRAFT", label: "Draft", color: "text-yellow-600" },
  { value: "NEEDS_REVIEW", label: "Needs Review", color: "text-orange-600" },
  { value: "APPROVED", label: "Approved", color: "text-green-600" },
  { value: "SCHEDULED", label: "Scheduled", color: "text-purple-600" },
  { value: "PUBLISHED", label: "Published", color: "text-green-700" },
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
        return <CheckCircle className="h-4 w-4" />;
      case "APPROVED":
      case "SCHEDULED":
        return <Clock className="h-4 w-4" />;
      case "NEEDS_REVIEW":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: PostStatus) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.color : "text-gray-600";
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
          targetAudience: createForm.targetAudience || undefined,
        },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="mt-2 text-gray-600">
            Manage your blog posts and their automation workflow
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
      <div className="bg-white shadow-sm rounded-lg">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No posts found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {posts.length === 0
                ? "Get started by creating your first blog post."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex items-center space-x-1 ${getStatusColor(
                          post.status
                        )}`}
                      >
                        {getStatusIcon(post.status)}
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {post.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <Link
                        to={`/posts/${post.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-primary-600"
                      >
                        {post.outline?.title ||
                          post.brief?.topic ||
                          "Untitled Post"}
                      </Link>
                      {post.brief?.persona && (
                        <p className="text-sm text-gray-600 mt-1">
                          Target: {post.brief.persona}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {new Date(post.createdAt).toLocaleDateString()}
                      </div>

                      {post.scheduledAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Scheduled {getRelativeTimeString(post.scheduledAt)}
                        </div>
                      )}

                      {post.publishedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Published{" "}
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                      )}

                      {post.wordCount && (
                        <div>{post.wordCount.toLocaleString()} words</div>
                      )}
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {post.publicUrl && (
                      <a
                        href={post.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="View published post"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    <Link
                      to={`/posts/${post.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {post.status === "NEEDS_REVIEW" ? "Review" : "Edit"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredPosts.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Post
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Target Persona *
                </label>
                <input
                  type="text"
                  id="persona"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Goal *
                </label>
                <textarea
                  id="goal"
                  required
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Target Audience (Optional)
                </label>
                <input
                  type="text"
                  id="targetAudience"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
