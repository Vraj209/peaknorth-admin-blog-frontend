import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FileText,
} from "lucide-react";
import { HybridFirestoreService } from "../lib/hybrid-firestore";
import { formatScheduledTime, getTimeUntilPublish } from "../lib/scheduling";
import type { BlogPost, PostStatus } from "../types/post";

export function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "brief" | "outline" | "draft" | "seo"
  >("brief");

  useEffect(() => {
    if (id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      const postData = await HybridFirestoreService.getPost(postId);
      setPost(postData);
      console.log("postData in post edit:", postData);
      // Set active tab based on available content
      if (postData) {
        if (postData.draft?.mdx) setActiveTab("draft");
        else if (postData?.outline) setActiveTab("outline");
        else if (postData?.brief) setActiveTab("brief");
      }
    } catch (error) {
      console.error("Error loading post:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePostStatus = async (status: PostStatus) => {
    if (!post) return;

    setUpdating(true);
    try {
      await HybridFirestoreService.updatePostStatus(post.id, status);
      setPost({ ...post, status });
    } catch (error) {
      console.error("Error updating post status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "SCHEDULED":
        return "bg-purple-100 text-purple-800";
      case "NEEDS_REVIEW":
        return "bg-orange-100 text-orange-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canApprove = post && ["DRAFT", "NEEDS_REVIEW"].includes(post.status);
  const canReject = post && post.status === "NEEDS_REVIEW";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Post not found</h2>
        <p className="mt-2 text-gray-600">
          The post you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/posts")}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {post.outline?.title || post.brief?.topic || "Untitled Post"}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  post.status
                )}`}
              >
                {post.status.replace("_", " ")}
              </span>
              <span className="text-sm text-gray-500">
                Created {new Date(post.createdAt?.getTime?.() ?? 0).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {post.publicUrl && (
            <a
              href={post.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Live
            </a>
          )}

          {canReject && (
            <button
              onClick={() => updatePostStatus("DRAFT")}
              disabled={updating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {updating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Request Changes
            </button>
          )}

          {canApprove && (
            <button
              onClick={() => updatePostStatus("APPROVED")}
              disabled={updating}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve & Schedule
            </button>
          )}
        </div>
      </div>

      {/* Scheduling Info */}
      {post.scheduledAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Scheduled for{" "}
                {formatScheduledTime(post.scheduledAt?.getTime?.() ?? 0, "America/Toronto")}
              </p>
              <p className="text-sm text-blue-700">
                {(() => {
                  const timeLeft = getTimeUntilPublish(post.scheduledAt?.getTime?.() ?? 0);
                  if (timeLeft.isPast) return "Ready to publish now";
                  return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m remaining`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {post.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{post.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: "brief", name: "Brief", available: !!post.brief },
              { id: "outline", name: "Outline", available: !!post.outline },
              { id: "draft", name: "Draft", available: !!post.draft },
              { id: "seo", name: "SEO", available: !!post.seo },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={!tab.available}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : tab.available
                      ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      : "border-transparent text-gray-300 cursor-not-allowed"
                  }
                `}
              >
                {tab.name}
                {!tab.available && (
                  <span className="ml-1 text-xs">(empty)</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Brief Tab */}
          {activeTab === "brief" && post.brief && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Topic
                </h3>
                <p className="text-gray-700">{post.brief.topic}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Target Persona
                </h3>
                <p className="text-gray-700">{post.brief.persona}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Goal</h3>
                <p className="text-gray-700">{post.brief.goal}</p>
              </div>

              {post.brief.targetAudience && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Target Audience
                  </h3>
                  <p className="text-gray-700">{post.brief.targetAudience}</p>
                </div>
              )}

              {post.brief.keyPoints && post.brief.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Key Points
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {post.brief.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Outline Tab */}
          {activeTab === "outline" && post.outline && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Title
                </h3>
                <p className="text-gray-700 text-xl">{post.outline.title}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Introduction
                </h3>
                <p className="text-gray-700">{post.outline.introduction}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Sections
                </h3>
                <div className="space-y-4">
                  {post.outline.sections.map((section, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gray-200 pl-4"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">
                        {section.heading}
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {section.subPoints.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Conclusion
                </h3>
                <p className="text-gray-700">{post.outline.conclusion}</p>
              </div>

              {post.outline.callToAction && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Call to Action
                  </h3>
                  <p className="text-gray-700">{post.outline.callToAction}</p>
                </div>
              )}
            </div>
          )}

          {/* Draft Tab */}
          {activeTab === "draft" && post.draft?.mdx && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Draft Content
                </h3>
                {post.draft?.wordCount && (
                  <span className="text-sm text-gray-500">
                    {post.draft?.wordCount.toLocaleString()} words
                    {post.draft?.estimatedReadTime &&
                      ` • ${post.draft?.estimatedReadTime} min read`}
                  </span>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {post.draft?.mdx}
                </pre>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === "seo" && post.seo && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Meta Title
                </h3>
                <p className="text-gray-700">{post.seo.metaTitle}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Meta Description
                </h3>
                <p className="text-gray-700">{post.seo.metaDescription}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  URL Slug
                </h3>
                <p className="text-gray-700 font-mono">{post.seo.slug}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Focus Keyword
                </h3>
                <p className="text-gray-700">{post.seo.focusKeyword}</p>
              </div>

              {post.seo.keywords && post.seo.keywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.seo.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {((activeTab === "brief" && !post.brief) ||
            (activeTab === "outline" && !post.outline) ||
            (activeTab === "draft" && !post.draft) ||
            (activeTab === "seo" && !post.seo)) && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No content yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This section will be populated by the automation workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
