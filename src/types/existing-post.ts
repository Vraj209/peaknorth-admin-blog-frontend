
import type { BlogPost } from './post';

// Mapping functions to convert between schemas
export function mapExistingPostToBlogPost(existingPost: BlogPost): import('./post').BlogPost {
  return {
    id: existingPost.id,
    scheduledAt: existingPost?.scheduledAt?.getTime?.() || null,
    publishedAt: existingPost?.publishedAt?.getTime?.() || null,
    createdAt: existingPost?.createdAt?.getTime?.() || null,
    updatedAt: existingPost?.updatedAt?.getTime?.() || null,
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
    
    draft_mdx: existingPost.draft_mdx || null,
    
    seo: {
      focusKeyword: existingPost?.seo?.focusKeyword || "",
      keywords: existingPost?.seo?.keywords || [],
      metaDescription: existingPost?.seo?.metaDescription || "",
      metaTitle: existingPost?.seo?.metaTitle || "",
      slug: existingPost?.seo?.slug || "",
    },
    
    featuredImage: existingPost.featuredImage || undefined,
    images: existingPost.images || [],

    wordCount: estimateWordCount(existingPost?.wordCount?.toString() || ""),
    estimatedReadTime: existingPost.estimatedReadTime,
    tags: existingPost.tags || [],
    publicUrl: `https://peaknorth.net/blog/${existingPost?.seo?.slug || ""}`,
  };
}

function estimateWordCount(content: string | null | undefined): number {
  // Handle null/undefined content
  if (!content || typeof content !== 'string') {
    return 0;
  }
  
  // Simple word count estimation from HTML content
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return textContent ? textContent.split(' ').length : 0;
}
