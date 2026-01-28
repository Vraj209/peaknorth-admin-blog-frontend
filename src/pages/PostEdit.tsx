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
  RotateCcw,
} from "lucide-react";
import { HybridFirestoreService } from "../lib/hybrid-firestore";
import { formatScheduledTime, getTimeUntilPublish } from "../lib/scheduling";
import type { BlogPost, PostStatus } from "../types/post";
import { backendUrl } from "../lib/constant";

export function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'raw' | 'rendered'>('rendered');
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
    setStatusAction(status);
    
    try {
     
      // Try direct API call first
      const apiUrl = `${backendUrl}/api/v1/posts/${post.id}/`;
        
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ status })
      });

      console.log("API response:", response);
      // Get response text first to see what we're actually getting
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = responseText || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Update local state
      setPost({ ...post, status, updatedAt: new Date() });
      
    } catch (error) {
      console.error("Error updating post status:", error);
      // Show error message to user
      alert(`Failed to update post status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
      setStatusAction(null);
    }
  };

  const handleStatusUpdate = async (status: PostStatus) => {
    await updatePostStatus(status);
  };

  // Trigger N8N webhook directly for regeneration
  const handleRegenerate = async () => {
    if (!post) return;

    setUpdating(true);
    setStatusAction('REGENRATE');

    try {
      // Update status to REGENRATE first
      await updatePostStatus('REGENRATE' as PostStatus);

      // Trigger N8N webhook directly`
      const n8nWebhookUrlTesting = import.meta.env.VITE_N8N_REGENERATE_WEBHOOK_URL_TESTING;
      const n8nWebhookUrlProduction = import.meta.env.VITE_N8N_REGENERATE_WEBHOOK_URL_PRODUCTION;

      let n8nWebhookUrl = n8nWebhookUrlTesting;
      if (import.meta.env.NODE_ENV === 'production') {
        n8nWebhookUrl = n8nWebhookUrlProduction;
      }

      if (n8nWebhookUrl) {
        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'post.regenerate',
            postId: post.id,
            post: post,
            timestamp: Date.now(),
          }),
        });

        if (!webhookResponse.ok) {
          console.error('N8N webhook failed:', webhookResponse.status);
        } else {
          console.log('N8N webhook triggered successfully');
        }
      } else {
        console.warn('N8N webhook URL not configured');
      }

    } catch (error) {
      console.error('Error triggering regeneration:', error);
      alert(`Failed to trigger regeneration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
      setStatusAction(null);
    }
  };

  const renderMarkdown = (markdown: string): string => {
    // Simple markdown rendering - convert basic markdown to HTML
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br/>')
      .replace(/^(.*)$/gim, '<p class="mb-4">$1</p>')
      .replace(/<p class="mb-4"><\/p>/gim, '');
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-500 text-white";
      case "UNPUBLISHED":
        return "bg-gray-600 text-white";
      case "APPROVED":
        return "bg-blue-500 text-white";
      case "SCHEDULED":
        return "bg-purple-500 text-white";
      case "NEEDS_REVIEW":
        return "bg-orange-500 text-white";
      case "DRAFT":
        return "bg-yellow-500 text-white";
      case "REGENRATE":
      default:
        return "bg-gray-500 text-white";
    }
  };

  const canApprove = post && ["DRAFT", "NEEDS_REVIEW"].includes(post.status);
  const canReject = post && ["DRAFT", "NEEDS_REVIEW", "REGENRATE"].includes(post.status);
  const canUnpublish = post && ["PUBLISHED", "UNPUBLISHED"].includes(post.status);
  const canRepublish = post && ["UNPUBLISHED"].includes(post.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Post not found</h2>
        <p className="mt-2 text-sm lg:text-base text-gray-600">
          The post you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3 lg:gap-4 flex-1 min-w-0">
          <button
            onClick={() => navigate("/posts")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900 break-words">
              {post.outline?.title || post.brief?.topic || "Untitled Post"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(
                  post.status
                )}`}
              >
                {post.status.replace("_", " ")}
              </span>
              <span className="text-xs lg:text-sm text-gray-500">
                Created {post.createdAt ? new Date(post.createdAt.getTime()).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3 lg:flex-shrink-0">
          {post.publicUrl && (
            <a
              href={post.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 border border-gray-300 text-xs lg:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Live
            </a>
          )}

          {canUnpublish && post.status === "PUBLISHED" && (
            <button
              onClick={() => updatePostStatus("UNPUBLISHED")}
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 border border-red-300 text-xs lg:text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {updating && statusAction === 'UNPUBLISHED' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Unpublish
            </button>
          )}

          {canRepublish && post.status === "UNPUBLISHED" && (
            <button
              onClick={() => updatePostStatus("PUBLISHED")}
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {updating && statusAction === 'PUBLISHED' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Republish
            </button>
          )}

          {canReject && (
            <button
              onClick={() => updatePostStatus("REGENRATE")}
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 border border-gray-300 text-xs lg:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {updating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Regenerate Draft
            </button>
          )}

          {canApprove && (
            <button
              onClick={() => updatePostStatus("APPROVED")}
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {updating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve & Schedule
            </button>
          )}
        </div>
      </div>

      {/* Scheduling Info */}
      {post.scheduledAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
          <div className="flex items-start gap-2 lg:gap-3">
            <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-blue-900">
                Scheduled for{" "}
                {formatScheduledTime(post.scheduledAt?.getTime?.() ?? 0, "America/Toronto")}
              </p>
              <p className="text-xs lg:text-sm text-blue-700 mt-0.5">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
          <div className="flex items-start gap-2 lg:gap-3">
            <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-red-900">Error</p>
              <p className="text-xs lg:text-sm text-red-700 mt-1 break-words">{post.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-6 lg:gap-8 px-4 lg:px-6 min-w-max" aria-label="Tabs">
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
                  py-3 lg:py-4 border-b-2 font-medium text-xs lg:text-sm transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-black text-gray-900"
                      : tab.available
                      ? "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
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

        <div className="p-4 lg:p-6">
          {/* Brief Tab */}
          {activeTab === "brief" && post.brief && (
            <div className="space-y-4 lg:space-y-6 text-left">
              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Topic
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.brief.topic}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Target Persona
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.brief.persona}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">Goal</h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.brief.goal}</p>
              </div>

              {post.brief.targetAudience && (
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                    Target Audience
                  </h3>
                  <p className="text-sm lg:text-base text-gray-700 text-left">{post.brief.targetAudience}</p>
                </div>
              )}

              {post.brief.keyPoints && post.brief.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                    Key Points
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm lg:text-base text-gray-700 text-left">
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
            <div className="space-y-4 lg:space-y-6 text-left">
              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Title
                </h3>
                <p className="text-base lg:text-xl font-medium text-gray-900 text-left">{post.outline.title}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Introduction
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.outline.introduction}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Sections
                </h3>
                <div className="space-y-3 lg:space-y-4 text-left">
                  {post.outline.sections.map((section, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gray-300 pl-3 lg:pl-4 text-left"
                    >
                      <h4 className="text-sm lg:text-base font-medium text-gray-900 mb-2 text-left">
                        {section.heading}
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-xs lg:text-sm text-gray-700 text-left">
                        {section.subPoints.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Conclusion
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.outline.conclusion}</p>
              </div>

              {post.outline.callToAction && (
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                    Call to Action
                  </h3>
                  <p className="text-sm lg:text-base text-gray-700 text-left">{post.outline.callToAction}</p>
                </div>
              )}
            </div>
          )}

          {/* Draft Tab */}
          {activeTab === "draft" && post.draft?.mdx && (
            <div className="space-y-4 lg:space-y-6">
              {/* Draft Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                  Draft Content
                </h3>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">
                    Review the generated draft content
                  </p>
                </div>
                {post.draft?.wordCount && (
                  <div className="text-left sm:text-right">
                    <span className="text-sm lg:text-base font-medium text-gray-900">
                    {post.draft?.wordCount.toLocaleString()} words
                  </span>
                    {post.draft?.estimatedReadTime && (
                      <p className="text-xs lg:text-sm text-gray-500">
                        {post.draft?.estimatedReadTime} min read
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Actions */}
              {post.status === 'DRAFT' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2 lg:gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-medium text-blue-800">
                          Draft Ready for Review
                        </h4>
                        <p className="text-xs lg:text-sm text-blue-700 mt-0.5">
                          This draft is ready to be submitted for review.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate('NEEDS_REVIEW')}
                      disabled={updating}
                      className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    > 
                      {updating && statusAction === 'NEEDS_REVIEW' && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>
                        {updating && statusAction === 'NEEDS_REVIEW' ? 'Submitting...' : 'Submit for Review'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {post.status === 'NEEDS_REVIEW' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 lg:gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-medium text-yellow-800">
                          Pending Review
                        </h4>
                        <p className="text-xs lg:text-sm text-yellow-700 mt-0.5">
                          This draft is awaiting approval or feedback.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleStatusUpdate('APPROVED')}
                        disabled={updating}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {updating && statusAction === 'APPROVED' && (
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span>
                          {updating && statusAction === 'APPROVED' ? 'Approving...' : 'Approved'}
                        </span>
                      </button>
                      <button
                        onClick={handleRegenerate}
                        disabled={updating}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {updating && statusAction === 'REGENRATE' && (
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span>
                          {updating && statusAction === 'REGENRATE' ? 'Regenerating...' : 'Regenerate'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {post.status === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2 lg:gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-green-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-medium text-green-800">
                          Draft Approved
                        </h4>
                        <p className="text-xs lg:text-sm text-green-700 mt-0.5">
                          This draft has been approved and is ready for scheduling.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate('APPROVED')}
                      disabled={updating}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      {updating && statusAction === 'APPROVED' && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>
                        {updating && statusAction === 'APPROVED' ? 'Approving...' : 'Approved for SEO Scheduling'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {post.status === 'REGENRATE' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 lg:gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-medium text-red-800">
                          Draft Regenerated
                        </h4>
                        <p className="text-xs lg:text-sm text-red-700 mt-0.5">
                          This draft has been regenerated and needs to be reviewed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {post.status === 'UNPUBLISHED' && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2 lg:gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs lg:text-sm font-medium text-gray-800">
                          Post Unpublished
                        </h4>
                        <p className="text-xs lg:text-sm text-gray-600 mt-0.5">
                          This post has been unpublished and is no longer visible to the public.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate('PUBLISHED')}
                      disabled={updating}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {updating && statusAction === 'PUBLISHED' && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>
                        {updating && statusAction === 'PUBLISHED' ? 'Republishing...' : 'Republish'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Draft Content Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 px-3 lg:px-4 py-2 lg:py-3 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="text-xs lg:text-sm font-semibold text-gray-900">
                      Content Preview
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewMode('raw')}
                        className={`px-2.5 lg:px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          previewMode === 'raw'
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Raw
                      </button>
                      <button
                        onClick={() => setPreviewMode('rendered')}
                        className={`px-2.5 lg:px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          previewMode === 'rendered'
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 lg:p-4 max-h-96 overflow-y-auto text-left">
                  {previewMode === 'raw' ? (
                <pre className="whitespace-pre-wrap text-xs lg:text-sm text-gray-800 font-mono text-left">
                  {post.draft?.mdx}
                </pre>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none text-xs lg:text-sm text-left"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdown(post.draft?.mdx || '') 
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === "seo" && post.seo && (
            <div className="space-y-4 lg:space-y-6 text-left">
              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Meta Title
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.seo.metaTitle}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Meta Description
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.seo.metaDescription}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  URL Slug
                </h3>
                <p className="text-sm lg:text-base text-gray-700 font-mono break-all text-left">{post.seo.slug}</p>
              </div>

              <div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                  Focus Keyword
                </h3>
                <p className="text-sm lg:text-base text-gray-700 text-left">{post.seo.focusKeyword}</p>
              </div>

              {post.seo.keywords && post.seo.keywords.length > 0 && (
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 text-left">
                    Keywords
                  </h3>
                  <div className="flex flex-wrap gap-1.5 lg:gap-2 text-left">
                    {post.seo.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
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
            <div className="text-center py-8 lg:py-12">
              <FileText className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm lg:text-base font-medium text-gray-900">
                No content yet
              </h3>
              <p className="mt-1 text-xs lg:text-sm text-gray-500">
                This section will be populated by the automation workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
