
import type { BlogPost } from './post';

// Mapping functions to convert between schemas
export function mapExistingPostToBlogPost(existingPost: BlogPost): import('./post').BlogPost {
  return {
    id: existingPost.id,
    scheduledAt: existingPost?.scheduledAt || null,
    publishedAt: existingPost?.publishedAt || null,
    createdAt: existingPost?.createdAt || null,
    updatedAt: existingPost?.updatedAt || null,
    status: existingPost.status,
    brief: {
      goal: existingPost?.brief?.goal || "",
      keyPoints: existingPost?.brief?.keyPoints || [],
      persona: existingPost?.brief?.persona || "",
      topic: existingPost?.brief?.topic || "",
    },
    
    outline: {
      title: existingPost?.outline?.title || "",
      introduction: existingPost?.outline?.introduction || "",
      sections: existingPost?.outline?.sections || [],
      conclusion: existingPost?.outline?.conclusion || "",
      callToAction: existingPost?.outline?.callToAction || "",
    },
    
    draft: {
      mdx: existingPost?.draft?.mdx || "",
      wordCount: existingPost?.draft?.wordCount || 0,
      estimatedReadTime: existingPost?.draft?.estimatedReadTime || 0,
    },
    
    seo: {
      focusKeyword: existingPost?.seo?.focusKeyword || "",
      keywords: existingPost?.seo?.keywords || [],
      metaDescription: existingPost?.seo?.metaDescription || "",
      metaTitle: existingPost?.seo?.metaTitle || "",
      slug: existingPost?.seo?.slug || "",
    },
    
    featuredImage: existingPost.featuredImage || undefined,
    images: existingPost.images || [],

    tags: existingPost.tags || [],
    publicUrl: `https://peaknorth.net/blog/${existingPost?.seo?.slug || ""}`,
  };
}
