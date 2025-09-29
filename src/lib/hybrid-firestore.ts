import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { BlogPost, PostStatus } from '../types/post';
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
      console.log("getAllPosts - Debug:", {
        existingCount: existingPosts.length,
        automationCount: automationPosts.length,
        totalCount: allPosts.length,
        statuses: allPosts.map(p => p.status)
      });
      return allPosts.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
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
    console.log('getExistingPosts - Raw data:', querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Check if this is actually a new format post (has brief, outline, status fields)
      if (data.brief || data.outline || data.status) {
        console.log('Found new format post in old collection:', doc.id);
        // This is actually a new format post, treat it as such
        return { id: doc.id, ...data } as BlogPost;
      }
      
      // This is an old format post, try to map it
      try {
        return mapExistingPostToBlogPost({ ...data, id: doc.id } as BlogPost);
      } catch (error) {
        console.warn('Error mapping existing post:', doc.id, error);
        return {
          id: doc.id,
          status: 'DRAFT' as PostStatus,
          scheduledAt: null,
          publishedAt: null,
          createdAt: new Date(Date.now()),
          updatedAt: new Date(Date.now()),
          brief: null,
          outline: null,
          draft: null,
          seo: null,
          tags: [],
          publicUrl: undefined,
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
    console.log('getAutomationPosts - Raw data:', querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  // Create a new automation post
  static async createPost(postData: Partial<BlogPost>): Promise<string> {
    const now = Date.now();
    const post: Omit<BlogPost, 'id'> = {
      status: 'BRIEF' as PostStatus,
      scheduledAt: null,
      publishedAt: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      brief: null,
      outline: null,
      draft: null,
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
      const data = existingDocSnap.data() as BlogPost;
      return mapExistingPostToBlogPost({ ...data, id: existingDocSnap.id });
    }
    
    return null;
  }

  // Update post (only works for automation posts)
  static async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    const docRef = doc(db, AUTOMATION_POSTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(Date.now())
    });
  }

  // Update post status (only works for automation posts)
  static async updatePostStatus(id: string, status: PostStatus, additionalData?: Partial<BlogPost>): Promise<void> {
    const updates: Partial<BlogPost> = {
      status,
      ...additionalData
    };

    if (status === 'PUBLISHED') {
      updates.publishedAt = new Date(Date.now());
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
    console.log("Debug - Existing posts:", existingPosts.length);
    console.log("Debug - Automation posts:", automationPosts.length);
    console.log("Debug - All posts:", allPosts.length);
    console.log("Debug - Posts with statuses:", allPosts.map(p => ({ id: p.id, status: p.status })));
    return {
      
      total: allPosts.length,
      published: allPosts.filter(p => p.status === 'PUBLISHED').length,
      scheduled: allPosts.filter(p => p.status === 'APPROVED' || p.status === 'SCHEDULED').length,
      needsReview: allPosts.filter(p => p.status === 'NEEDS_REVIEW').length,
      drafts: allPosts.filter(p => ['BRIEF', 'OUTLINE', 'DRAFT'].includes(p.status)).length
    };
  }
}
