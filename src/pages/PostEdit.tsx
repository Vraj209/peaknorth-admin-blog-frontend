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
      const apiUrl = `http://localhost:3000/api/v1/posts/${post.id}/`;
        
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ status })
      });

      
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
            <div className="space-y-6">
              {/* Draft Header */}
              <div className="flex items-center justify-between">
                <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Draft Content
                </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Review the generated draft content
                  </p>
                </div>
                {post.draft?.wordCount && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                    {post.draft?.wordCount.toLocaleString()} words
                  </span>
                    {post.draft?.estimatedReadTime && (
                      <p className="text-sm text-gray-500">
                        {post.draft?.estimatedReadTime} min read
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Actions */}
              {post.status === 'DRAFT' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">
                          Draft Ready for Review
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          This draft is ready to be submitted for review.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate('NEEDS_REVIEW')}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {updating && statusAction === 'NEEDS_REVIEW' && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Pending Review
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          This draft is awaiting approval or feedback.
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStatusUpdate('APPROVED')}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {updating && statusAction === 'APPROVED' && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span>
                          {updating && statusAction === 'APPROVED' ? 'Approving...' : 'Approve'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('DRAFT')}
                        disabled={updating}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {updating && statusAction === 'DRAFT' && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span>
                          {updating && statusAction === 'DRAFT' ? 'Rejecting...' : 'Request Changes'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {post.status === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">
                          Draft Approved
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          This draft has been approved and is ready for scheduling.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate('SCHEDULED')}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {updating && statusAction === 'SCHEDULED' && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>
                        {updating && statusAction === 'SCHEDULED' ? 'Scheduling...' : 'Schedule for Publishing'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Draft Content Preview */}
              <div className="border border-gray-200 rounded-lg">
                <div className="border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      Content Preview
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPreviewMode('raw')}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          previewMode === 'raw'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Raw
                      </button>
                      <button
                        onClick={() => setPreviewMode('rendered')}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          previewMode === 'rendered'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 max-h-96 overflow-y-auto">
                  {previewMode === 'raw' ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {post.draft?.mdx}
                </pre>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none"
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
