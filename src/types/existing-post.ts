// Type definitions for your existing Firebase blog schema
export interface ExistingBlogPost {
  id: string;
  title: string;
  content: string;
  shortDescription: string;
  slug: string;
  bannerImage: string;
  images: string[];
  tags: string[];
  author: {
    name: string;
    image: string;
  };
  readTime: number;
  isPublished: boolean;
  publishedAt: any; // Firebase Timestamp
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

// Mapping functions to convert between schemas
export function mapExistingPostToBlogPost(existingPost: ExistingBlogPost): import('./post').BlogPost {
  return {
    id: existingPost.id,
    status: existingPost.isPublished ? 'PUBLISHED' : 'DRAFT',
    scheduledAt: null,
    publishedAt: existingPost.publishedAt?.toMillis?.() || null,
    createdAt: existingPost.createdAt?.toMillis?.() || Date.now(),
    updatedAt: existingPost.updatedAt?.toMillis?.() || Date.now(),
    
    brief: {
      topic: existingPost.title,
      persona: "Blog readers", // Default since not in existing schema
      goal: existingPost.shortDescription,
    },
    
    outline: {
      title: existingPost.title,
      introduction: existingPost.shortDescription,
      sections: [], // Would need to parse from content
      conclusion: "",
    },
    
    draft_mdx: existingPost.content || null,
    
    seo: {
      metaTitle: existingPost.title,
      metaDescription: existingPost.shortDescription,
      focusKeyword: existingPost.tags[0] || "",
      keywords: existingPost.tags,
      slug: existingPost.slug,
    },
    
    wordCount: estimateWordCount(existingPost.content),
    estimatedReadTime: existingPost.readTime,
    tags: existingPost.tags,
    publicUrl: `https://peaknorth.com/blog/${existingPost.slug}`,
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
