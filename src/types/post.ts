export type PostStatus = 
  | 'BRIEF' 
  | 'OUTLINE' 
  | 'DRAFT' 
  | 'NEEDS_REVIEW' 
  | 'APPROVED' 
  | 'SCHEDULED' 
  | 'PUBLISHED';

export interface PostBrief {
  goal: string;
  keyPoints: string[];
  persona: string;
  topic: string;
  targetAudience?: string[];
}

export interface PostOutline {
  title: string;
  introduction: string;
  sections: {
    heading: string;
    subPoints: string[];
    keywords: string[];
  }[];
  conclusion: string;
  callToAction?: string;
}

export interface PostSEO {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string[];
  slug: string;
}

export interface PostDraft {
  mdx: string;
  wordCount: number;
  estimatedReadTime: number;
}

export interface BlogPost {
  id: string;
  status: PostStatus;
  scheduledAt: Date | null;  
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  
  // Content stages
  brief: PostBrief | null;
  outline: PostOutline | null;
  draft: PostDraft | null;
  seo: PostSEO | null;
  
  // Images
  featuredImage?: BlogImage;
  images?: BlogImage[];
  
  // Metadata
  tags?: string[];
  ideaId?: string; // Link to the idea that generated this post
  
  // Publishing
  publicUrl?: string;
  
  // Error tracking
  errorMessage?: string;
}

export interface BlogImage {
  url: string;
  storagePath: string;
  filename: string;
  size: number;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface CadenceConfig {
  intervalDays: number;
  publishHour: number; // 0-23, local time
  timezone: string; // e.g., "America/Toronto"
  draftLeadHours: number; // create draft X hours before publish slot
  reminderHours?: number; // send reminder X hours before publish if not approved
}

export interface BlogIdea {
  id: string;
  topic: string;
  persona: string;
  goal: string;
  targetAudience?: string[];
  priority: 'low' | 'medium' | 'high';
  used: boolean;
  createdAt: Date;
  tags?: string[];
}
