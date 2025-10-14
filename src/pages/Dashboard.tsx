import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileEdit,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { HybridFirestoreService } from "../lib/hybrid-firestore";
import { formatScheduledTime, getTimeUntilPublish } from "../lib/scheduling";
import type { BlogPost } from "../types/post";

interface DashboardStats {
  total: number;
  published: number;
  scheduled: number;
  needsReview: number;
  drafts: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [nextScheduled, setNextScheduled] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, postsData] = await Promise.all([
        HybridFirestoreService.getPostStats(),
        HybridFirestoreService.getRecentPosts(5),
      ]);
      setStats(statsData);
      setRecentPosts(postsData);

      // Find next scheduled post
      const scheduled = postsData.find(
        (p) =>
          (p.status === "APPROVED" || p.status === "SCHEDULED") &&
          p.scheduledAt &&
          (p.scheduledAt?.getTime?.() ?? 0) > Date.now()
      );
      setNextScheduled(scheduled || null);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-500 text-white";
      case "APPROVED":
        return "bg-blue-500 text-white";
      case "SCHEDULED":
        return "bg-purple-500 text-white";
      case "NEEDS_REVIEW":
        return "bg-orange-500 text-white";
      case "DRAFT":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
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
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
          Overview of your blog automation system
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 lg:gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-gray-900" />
              </div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Total Posts
              </p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-500" />
              </div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Published</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                {stats.published}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
              </div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                {stats.scheduled}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-orange-500" />
              </div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Needs Review
              </p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                {stats.needsReview}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <FileEdit className="h-5 w-5 lg:h-6 lg:w-6 text-gray-900" />
              </div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                {stats.drafts}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Next Scheduled Post */}
        {nextScheduled && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Next Scheduled Post
              </h2>
            </div>
            <div className="p-4 lg:p-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-sm lg:text-base">
                  {nextScheduled.outline?.title ||
                    nextScheduled.brief?.topic ||
                    "Untitled"}
                </h3>
                <div className="flex items-center text-xs lg:text-sm text-gray-600">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  {nextScheduled.scheduledAt && (
                    <span>
                      {formatScheduledTime(
                        nextScheduled.scheduledAt?.getTime?.() ?? 0,
                        "America/Toronto"
                      )}
                    </span>
                  )}
                </div>
                {nextScheduled.scheduledAt && (
                  <div className="text-xs lg:text-sm text-gray-500">
                    {(() => {
                      const timeLeft = getTimeUntilPublish(
                        nextScheduled.scheduledAt?.getTime?.() ?? 0
                      );
                      if (timeLeft.isPast) return "Ready to publish";
                      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m remaining`;
                    })()}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(
                      nextScheduled.status
                    )}`}
                  >
                    {nextScheduled.status}
                  </span>
                  <Link
                    to={`/posts/${nextScheduled.id}`}
                    className="flex items-center text-gray-900 hover:text-gray-700 text-xs lg:text-sm font-medium"
                  >
                    Review <ArrowRight className="h-3 w-3 lg:h-4 lg:w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Posts */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                Recent Posts
              </h2>
              <Link
                to="/posts"
                className="flex items-center text-gray-900 hover:text-gray-700 text-xs lg:text-sm font-medium"
              >
                View all <ArrowRight className="h-3 w-3 lg:h-4 lg:w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPosts.length === 0 ? (
              <div className="px-4 lg:px-6 py-6 lg:py-8 text-center text-gray-500 text-sm">
                No posts yet. Create your first post to get started.
              </div>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="px-4 lg:px-6 py-3 lg:py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                        {post.outline?.title || post.brief?.topic || "Untitled"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.createdAt?.getTime?.() ?? 0).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>
                      <Link
                        to={`/posts/${post.id}`}
                        className="text-gray-900 hover:text-gray-700 text-xs lg:text-sm"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <Link
              to="/posts"
              className="group relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-4 lg:p-6 text-center hover:border-black hover:bg-gray-50 transition-all"
            >
              <FileText className="mx-auto h-6 w-6 lg:h-8 lg:w-8 text-gray-400 group-hover:text-black transition-colors" />
              <span className="mt-2 block text-xs lg:text-sm font-medium text-gray-900">
                Manage Posts
              </span>
            </Link>

            <Link
              to="/ideas"
              className="group relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-4 lg:p-6 text-center hover:border-black hover:bg-gray-50 transition-all"
            >
              <Lightbulb className="mx-auto h-6 w-6 lg:h-8 lg:w-8 text-gray-400 group-hover:text-black transition-colors" />
              <span className="mt-2 block text-xs lg:text-sm font-medium text-gray-900">
                Add Ideas
              </span>
            </Link>

            <Link
              to="/settings"
              className="group relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-4 lg:p-6 text-center hover:border-black hover:bg-gray-50 transition-all"
            >
              <Calendar className="mx-auto h-6 w-6 lg:h-8 lg:w-8 text-gray-400 group-hover:text-black transition-colors" />
              <span className="mt-2 block text-xs lg:text-sm font-medium text-gray-900">
                Schedule Settings
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
