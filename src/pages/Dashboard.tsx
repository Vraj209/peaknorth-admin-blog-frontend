import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Lightbulb,
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
      console.log("statsData", statsData);
      setRecentPosts(postsData);
      console.log("postsData", postsData);

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
        return "text-green-600 bg-green-50";
      case "APPROVED":
        return "text-blue-600 bg-blue-50";
      case "SCHEDULED":
        return "text-purple-600 bg-purple-50";
      case "NEEDS_REVIEW":
        return "text-orange-600 bg-orange-50";
      case "DRAFT":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your blog automation system
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Posts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total}
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
                  <p className="text-sm font-medium text-gray-500">Published</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.published}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Scheduled</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.scheduled}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Needs Review
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.needsReview}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Drafts</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.drafts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Next Scheduled Post */}
        {nextScheduled && (
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Next Scheduled Post
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">
                  {nextScheduled.outline?.title ||
                    nextScheduled.brief?.topic ||
                    "Untitled"}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
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
                  <div className="text-sm text-gray-500">
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
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      nextScheduled.status
                    )}`}
                  >
                    {nextScheduled.status}
                  </span>
                  <Link
                    to={`/posts/${nextScheduled.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Posts */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Posts
              </h2>
              <Link
                to="/posts"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPosts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No posts yet. Create your first post to get started.
              </div>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {post.outline?.title || post.brief?.topic || "Untitled"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(post.createdAt?.getTime?.() ?? 0).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>
                      <Link
                        to={`/posts/${post.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        View
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
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/posts"
              className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Manage Posts
              </span>
            </Link>

            <Link
              to="/ideas"
              className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Lightbulb className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Add Ideas
              </span>
            </Link>

            <Link
              to="/settings"
              className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Calendar className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Schedule Settings
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
