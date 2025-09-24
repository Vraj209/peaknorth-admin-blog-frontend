import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BlogPost, PostStatus } from '../types/post';
import type { ExistingBlogPost } from '../types/existing-post';
import { mapExistingPostToBlogPost } from '../types/existing-post';

const POSTS_COLLECTION = 'posts';
const AUTOMATION_POSTS_COLLECTION = 'automation_posts'; // New collection for automation posts

export class HybridFirestoreService {
  // Get all posts from both collections
  static async getAllPosts(): Promise<BlogPost[]> {
    try {
      const [existingPosts, automationPosts] = await Promise.all([
        this.getExistingPosts(),
        this.getAutomationPosts()
      ]);
      
      // Combine and sort by creation date
      const allPosts = [...existingPosts, ...automationPosts];
      return allPosts.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  // Get existing blog posts and map them to BlogPost format
  private static async getExistingPosts(): Promise<BlogPost[]> {
    const q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as ExistingBlogPost;
      try {
        return mapExistingPostToBlogPost({ ...data, id: doc.id });
      } catch (error) {
        console.warn('Error mapping existing post:', doc.id, error);
        // Return a minimal post structure if mapping fails
        return {
          id: doc.id,
          status: 'DRAFT' as const,
          scheduledAt: null,
          publishedAt: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          brief: null,
          outline: null,
          draft_mdx: null,
          seo: null,
          wordCount: 0,
          estimatedReadTime: 0,
          tags: [],
          publicUrl: null,
        };
      }
    });
  }

  // Get automation posts (new format)
  private static async getAutomationPosts(): Promise<BlogPost[]> {
    const q = query(
      collection(db, AUTOMATION_POSTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  // Create a new automation post
  static async createPost(postData: Partial<BlogPost>): Promise<string> {
    const now = Date.now();
    const post: Omit<BlogPost, 'id'> = {
      status: 'BRIEF',
      scheduledAt: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      brief: null,
      outline: null,
      draft_mdx: null,
      seo: null,
      ...postData
    };
    
    const docRef = await addDoc(collection(db, AUTOMATION_POSTS_COLLECTION), post);
    return docRef.id;
  }

  // Get a single post (check both collections)
  static async getPost(id: string): Promise<BlogPost | null> {
    // First check automation posts
    const automationDocRef = doc(db, AUTOMATION_POSTS_COLLECTION, id);
    const automationDocSnap = await getDoc(automationDocRef);
    
    if (automationDocSnap.exists()) {
      return { id: automationDocSnap.id, ...automationDocSnap.data() } as BlogPost;
    }

    // Then check existing posts
    const existingDocRef = doc(db, POSTS_COLLECTION, id);
    const existingDocSnap = await getDoc(existingDocRef);
    
    if (existingDocSnap.exists()) {
      const data = existingDocSnap.data() as ExistingBlogPost;
      return mapExistingPostToBlogPost({ ...data, id: existingDocSnap.id });
    }
    
    return null;
  }

  // Update post (only works for automation posts)
  static async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    const docRef = doc(db, AUTOMATION_POSTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now()
    });
  }

  // Update post status (only works for automation posts)
  static async updatePostStatus(id: string, status: PostStatus, additionalData?: Partial<BlogPost>): Promise<void> {
    const updates: Partial<BlogPost> = {
      status,
      ...additionalData
    };

    if (status === 'PUBLISHED') {
      updates.publishedAt = Date.now();
    }

    await this.updatePost(id, updates);
  }

  // Get posts by status (only automation posts have status)
  static async getPostsByStatus(status: PostStatus): Promise<BlogPost[]> {
    const q = query(
      collection(db, AUTOMATION_POSTS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  // Get publish-ready posts
  static async getPublishReadyPosts(): Promise<BlogPost[]> {
    const now = Date.now();
    const q = query(
      collection(db, AUTOMATION_POSTS_COLLECTION),
      where('status', '==', 'APPROVED'),
      where('scheduledAt', '<=', now)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  // Get recent posts
  static async getRecentPosts(limitCount: number = 10): Promise<BlogPost[]> {
    const allPosts = await this.getAllPosts();
    return allPosts.slice(0, limitCount);
  }

  // Get post stats
  static async getPostStats(): Promise<{
    total: number;
    published: number;
    scheduled: number;
    needsReview: number;
    drafts: number;
  }> {
    const [existingPosts, automationPosts] = await Promise.all([
      this.getExistingPosts(),
      this.getAutomationPosts()
    ]);
    
    const allPosts = [...existingPosts, ...automationPosts];
    
    return {
      total: allPosts.length,
      published: allPosts.filter(p => p.status === 'PUBLISHED').length,
      scheduled: allPosts.filter(p => p.status === 'APPROVED' || p.status === 'SCHEDULED').length,
      needsReview: allPosts.filter(p => p.status === 'NEEDS_REVIEW').length,
      drafts: allPosts.filter(p => ['BRIEF', 'OUTLINE', 'DRAFT'].includes(p.status)).length
    };
  }
}
