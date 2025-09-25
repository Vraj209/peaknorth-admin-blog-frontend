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
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { BlogPost, PostStatus, CadenceConfig, BlogIdea } from '../types/post';

const POSTS_COLLECTION = 'posts';
const IDEAS_COLLECTION = 'ideas';
const SETTINGS_COLLECTION = 'settings';

export class FirestoreService {
  // Posts CRUD
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
    
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), post);
    return docRef.id;
  }

  static async getPost(id: string): Promise<BlogPost | null> {
    const docRef = doc(db, POSTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    }
    return null;
  }

  static async updatePost(id: string, updates: Partial<BlogPost>): Promise<void> {
    const docRef = doc(db, POSTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now()
    });
  }

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

  static async getAllPosts(): Promise<BlogPost[]> {
    const q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  static async getPostsByStatus(status: PostStatus): Promise<BlogPost[]> {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  static async getPublishReadyPosts(): Promise<BlogPost[]> {
    const now = Date.now();
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('status', '==', 'APPROVED'),
      where('scheduledAt', '<=', now)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  static async getRecentPosts(limitCount: number = 10): Promise<BlogPost[]> {
    const q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  }

  // Ideas CRUD
  static async createIdea(ideaData: Omit<BlogIdea, 'id' | 'createdAt' | 'used'>): Promise<string> {
    const idea: Omit<BlogIdea, 'id'> = {
      ...ideaData,
      used: false,
      createdAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, IDEAS_COLLECTION), idea);
    return docRef.id;
  }

  static async getUnusedIdeas(): Promise<BlogIdea[]> {
    const q = query(
      collection(db, IDEAS_COLLECTION),
      where('used', '==', false),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogIdea));
  }

  static async markIdeaAsUsed(id: string): Promise<void> {
    const docRef = doc(db, IDEAS_COLLECTION, id);
    await updateDoc(docRef, { used: true });
  }

  static async getAllIdeas(): Promise<BlogIdea[]> {
    const q = query(
      collection(db, IDEAS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogIdea));
  }

  // Settings
  static async getCadenceConfig(): Promise<CadenceConfig | null> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'cadence');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as CadenceConfig;
    }
    return null;
  }

  static async updateCadenceConfig(config: CadenceConfig): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'cadence');
    await updateDoc(docRef, { ...config });
  }

  // Analytics/Stats
  static async getPostStats(): Promise<{
    total: number;
    published: number;
    scheduled: number;
    needsReview: number;
    drafts: number;
  }> {
    const posts = await this.getAllPosts();
    
    return {
      total: posts.length,
      published: posts.filter(p => p.status === 'PUBLISHED').length,
      scheduled: posts.filter(p => p.status === 'APPROVED' || p.status === 'SCHEDULED').length,
      needsReview: posts.filter(p => p.status === 'NEEDS_REVIEW').length,
      drafts: posts.filter(p => ['BRIEF', 'OUTLINE', 'DRAFT'].includes(p.status)).length
    };
  }
}
