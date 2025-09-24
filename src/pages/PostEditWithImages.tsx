import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImageUpload, MultiImageUpload } from "../components/ImageUpload";
import { HybridFirestoreService } from "../lib/hybrid-firestore";
import { BlogPost, PostStatus, BlogImage } from "../types/post";
import { formatScheduledTime, getTimeUntilPublish } from "../lib/scheduling";
import { UploadResult, StorageService } from "../lib/storage";

export function PostEditWithImages() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "images" | "seo">(
    "content"
  );

  useEffect(() => {
    if (id) {
      loadPost(id);
    } else {
      setError("No post ID provided");
      setLoading(false);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      setLoading(true);
      const postData = await HybridFirestoreService.getPost(postId);
      if (postData) {
        setPost(postData);
      } else {
        setError("Post not found");
      }
    } catch (err) {
      console.error("Error loading post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const updatePostStatus = async (status: PostStatus) => {
    if (!post) return;

    try {
      setUpdating(true);
      await HybridFirestoreService.updatePostStatus(post.id, status);
      setPost((prev) =>
        prev ? { ...prev, status, updatedAt: Date.now() } : null
      );
    } catch (err) {
      console.error("Error updating post status:", err);
      setError("Failed to update post status");
    } finally {
      setUpdating(false);
    }
  };

  const handleFeaturedImageUpload = async (result: UploadResult) => {
    if (!post) return;

    const featuredImage: BlogImage = {
      url: result.url,
      storagePath: result.path,
      filename: result.filename,
      size: result.size,
      alt: post.outline?.title || "Featured image",
    };

    try {
      setUpdating(true);
      await HybridFirestoreService.updatePost(post.id, {
        featuredImage,
        updatedAt: Date.now(),
      });
      setPost((prev) => (prev ? { ...prev, featuredImage } : null));
    } catch (err) {
      console.error("Error updating featured image:", err);
      setError("Failed to update featured image");
    } finally {
      setUpdating(false);
    }
  };

  const handleContentImagesUpload = async (results: UploadResult[]) => {
    if (!post) return;

    const newImages: BlogImage[] = results.map((result) => ({
      url: result.url,
      storagePath: result.path,
      filename: result.filename,
      size: result.size,
      alt: `Content image - ${result.filename}`,
    }));

    const updatedImages = [...(post.images || []), ...newImages];

    try {
      setUpdating(true);
      await HybridFirestoreService.updatePost(post.id, {
        images: updatedImages,
        updatedAt: Date.now(),
      });
      setPost((prev) => (prev ? { ...prev, images: updatedImages } : null));
    } catch (err) {
      console.error("Error updating content images:", err);
      setError("Failed to update content images");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageRemove = async (
    imageUrl: string,
    isFeature: boolean = false
  ) => {
    if (!post) return;

    try {
      setUpdating(true);

      // Extract storage path from URL and delete from storage
      const storagePath = StorageService.extractPathFromUrl(imageUrl);
      if (storagePath) {
        await StorageService.deleteImage(storagePath);
      }

      if (isFeature) {
        // Remove featured image
        await HybridFirestoreService.updatePost(post.id, {
          featuredImage: null,
          updatedAt: Date.now(),
        });
        setPost((prev) =>
          prev ? { ...prev, featuredImage: undefined } : null
        );
      } else {
        // Remove from content images
        const updatedImages = (post.images || []).filter(
          (img) => img.url !== imageUrl
        );
        await HybridFirestoreService.updatePost(post.id, {
          images: updatedImages,
          updatedAt: Date.now(),
        });
        setPost((prev) => (prev ? { ...prev, images: updatedImages } : null));
      }
    } catch (err) {
      console.error("Error removing image:", err);
      setError("Failed to remove image");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpdate = async (
    imageUrl: string,
    updates: Partial<BlogImage>
  ) => {
    if (!post) return;

    try {
      setUpdating(true);

      // Update featured image
      if (post.featuredImage?.url === imageUrl) {
        const updatedFeaturedImage = { ...post.featuredImage, ...updates };
        await HybridFirestoreService.updatePost(post.id, {
          featuredImage: updatedFeaturedImage,
          updatedAt: Date.now(),
        });
        setPost((prev) =>
          prev ? { ...prev, featuredImage: updatedFeaturedImage } : null
        );
      }

      // Update content images
      const updatedImages = (post.images || []).map((img) =>
        img.url === imageUrl ? { ...img, ...updates } : img
      );

      if (updatedImages.some((img) => img.url === imageUrl)) {
        await HybridFirestoreService.updatePost(post.id, {
          images: updatedImages,
          updatedAt: Date.now(),
        });
        setPost((prev) => (prev ? { ...prev, images: updatedImages } : null));
      }
    } catch (err) {
      console.error("Error updating image:", err);
      setError("Failed to update image");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    const colors = {
      BRIEF: "bg-gray-100 text-gray-800",
      OUTLINE: "bg-blue-100 text-blue-800",
      DRAFT: "bg-yellow-100 text-yellow-800",
      NEEDS_REVIEW: "bg-orange-100 text-orange-800",
      APPROVED: "bg-green-100 text-green-800",
      SCHEDULED: "bg-purple-100 text-purple-800",
      PUBLISHED: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error || "Post not found"}</div>
          <button
            onClick={() => navigate("/posts")}
            className="mt-2 text-red-600 hover:text-red-500 underline"
          >
            Back to Posts
          </button>
        </div>
      </Layout>
    );
  }

  const timeUntil = post.scheduledAt
    ? getTimeUntilPublish(post.scheduledAt)
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {post.outline?.title || post.brief?.topic || "Untitled Post"}
                </h1>
                <div className="mt-2 flex items-center space-x-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      post.status
                    )}`}
                  >
                    {post.status.replace("_", " ")}
                  </span>
                  {post.scheduledAt && (
                    <span className="text-sm text-gray-500">
                      Scheduled:{" "}
                      {formatScheduledTime(post.scheduledAt, "America/Toronto")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                {post.status === "NEEDS_REVIEW" && (
                  <>
                    <button
                      onClick={() => updatePostStatus("APPROVED")}
                      disabled={updating}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve & Schedule
                    </button>
                    <button
                      onClick={() => updatePostStatus("DRAFT")}
                      disabled={updating}
                      className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                  </>
                )}

                {post.status === "APPROVED" &&
                  timeUntil &&
                  !timeUntil.isPast && (
                    <div className="text-sm text-green-600">
                      Publishes in {timeUntil.days}d {timeUntil.hours}h{" "}
                      {timeUntil.minutes}m
                    </div>
                  )}

                <button
                  onClick={() => navigate("/posts")}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Posts
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "content"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "images"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setActiveTab("seo")}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "seo"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              SEO
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Brief */}
            {post.brief && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Brief</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Topic
                    </label>
                    <p className="mt-1 text-gray-900">{post.brief.topic}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Target Persona
                    </label>
                    <p className="mt-1 text-gray-900">{post.brief.persona}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Goal
                    </label>
                    <p className="mt-1 text-gray-900">{post.brief.goal}</p>
                  </div>
                  {post.brief.targetAudience && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Target Audience
                      </label>
                      <p className="mt-1 text-gray-900">
                        {post.brief.targetAudience}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outline */}
            {post.outline && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Outline</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {post.outline.title}
                    </h3>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Introduction
                    </h4>
                    <p className="mt-1 text-gray-600">
                      {post.outline.introduction}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Sections
                    </h4>
                    <div className="mt-2 space-y-3">
                      {post.outline.sections.map((section, index) => (
                        <div
                          key={index}
                          className="pl-4 border-l-2 border-gray-200"
                        >
                          <h5 className="font-medium text-gray-900">
                            {section.heading}
                          </h5>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                            {section.subPoints.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Conclusion
                    </h4>
                    <p className="mt-1 text-gray-600">
                      {post.outline.conclusion}
                    </p>
                  </div>
                  {post.outline.callToAction && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">
                        Call to Action
                      </h4>
                      <p className="mt-1 text-gray-600">
                        {post.outline.callToAction}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Draft Content */}
            {post.draft_mdx && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Draft Content</h2>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border overflow-x-auto">
                    {post.draft_mdx}
                  </pre>
                </div>
                {post.wordCount && (
                  <div className="mt-4 text-sm text-gray-500">
                    Word count: {post.wordCount} | Estimated read time:{" "}
                    {post.estimatedReadTime} minutes
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-6">
            {/* Featured Image */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Featured Image</h2>

              {post.featuredImage ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt || "Featured image"}
                      className="max-w-md h-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() =>
                        handleImageRemove(post.featuredImage!.url, true)
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                      disabled={updating}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={post.featuredImage.alt || ""}
                        onChange={(e) =>
                          handleImageUpdate(post.featuredImage!.url, {
                            alt: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe this image for accessibility"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Caption
                      </label>
                      <input
                        type="text"
                        value={post.featuredImage.caption || ""}
                        onChange={(e) =>
                          handleImageUpdate(post.featuredImage!.url, {
                            caption: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional caption for the image"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <ImageUpload
                  onImageUploaded={handleFeaturedImageUpload}
                  onError={setError}
                  folder="featured-images"
                  className="max-w-md"
                />
              )}
            </div>

            {/* Content Images */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Content Images</h2>

              <MultiImageUpload
                onImagesUploaded={handleContentImagesUpload}
                onError={setError}
                folder="blog-images"
                maxFiles={10}
                existingImages={post.images?.map((img) => img.url) || []}
                onImageRemove={(url) => handleImageRemove(url, false)}
              />

              {/* Existing Images with Metadata */}
              {post.images && post.images.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    Image Details
                  </h3>
                  <div className="space-y-4">
                    {post.images.map((image, index) => (
                      <div
                        key={index}
                        className="flex space-x-4 p-4 border rounded-lg"
                      >
                        <img
                          src={image.url}
                          alt={image.alt || ""}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Alt Text
                            </label>
                            <input
                              type="text"
                              value={image.alt || ""}
                              onChange={(e) =>
                                handleImageUpdate(image.url, {
                                  alt: e.target.value,
                                })
                              }
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Caption
                            </label>
                            <input
                              type="text"
                              value={image.caption || ""}
                              onChange={(e) =>
                                handleImageUpdate(image.url, {
                                  caption: e.target.value,
                                })
                              }
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            {image.filename} •{" "}
                            {StorageService.formatFileSize(image.size)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">SEO Information</h2>
            {post.seo ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Meta Title
                  </label>
                  <p className="mt-1 text-gray-900">{post.seo.metaTitle}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Meta Description
                  </label>
                  <p className="mt-1 text-gray-900">
                    {post.seo.metaDescription}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Focus Keyword
                  </label>
                  <p className="mt-1 text-gray-900">{post.seo.focusKeyword}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Keywords
                  </label>
                  <p className="mt-1 text-gray-900">
                    {post.seo.keywords.join(", ")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  <p className="mt-1 text-gray-900">{post.seo.slug}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                SEO information will be generated when the post is approved.
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
