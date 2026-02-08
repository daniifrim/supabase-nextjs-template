import { createClient } from '@supabase/supabase-js';
import { BlogPost, BlogCategory, CreateBlogPostInput, UpdateBlogPostInput } from '@/lib/types/blog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (for API routes)
export function createServerClient() {
  const serviceKey = process.env.PRIVATE_SUPABASE_SERVICE_KEY!;
  return createClient(supabaseUrl, serviceKey);
}

// Generate a slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

// Ensure slug is unique by appending a number if needed
export async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const { data } = await supabaseClient
    .from('blog_posts')
    .select('slug, id')
    .eq('slug', slug)
    .maybeSingle();

  if (!data || (excludeId && data.id === excludeId)) {
    return slug;
  }

  // Try with numbers appended
  let counter = 1;
  let newSlug = `${slug}-${counter}`;
  
  while (true) {
    const { data: existing } = await supabaseClient
      .from('blog_posts')
      .select('slug, id')
      .eq('slug', newSlug)
      .maybeSingle();

    if (!existing || (excludeId && existing.id === excludeId)) {
      return newSlug;
    }
    counter++;
    newSlug = `${slug}-${counter}`;
  }
}

// Fetch all published posts
export async function getPublishedPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:author_id(email, user_metadata)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:author_id(email, user_metadata)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Fetch all categories
export async function getCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabaseClient
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Create a new blog post
export async function createBlogPost(post: CreateBlogPostInput, authorId: string): Promise<BlogPost> {
  const uniqueSlug = await ensureUniqueSlug(post.slug);
  
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .insert({
      ...post,
      slug: uniqueSlug,
      author_id: authorId,
      published_at: post.status === 'published' ? new Date().toISOString() : post.published_at,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Add categories if provided
  if (post.category_ids && post.category_ids.length > 0) {
    const categoryInserts = post.category_ids.map(category_id => ({
      post_id: data.id,
      category_id,
    }));
    
    await supabaseClient
      .from('blog_post_categories')
      .insert(categoryInserts);
  }
  
  return data;
}

// Update a blog post
export async function updateBlogPost(post: UpdateBlogPostInput): Promise<BlogPost> {
  const updates: Partial<BlogPost> = { ...post };
  
  if (post.slug) {
    updates.slug = await ensureUniqueSlug(post.slug, post.id);
  }
  
  if (post.status === 'published' && !post.published_at) {
    updates.published_at = new Date().toISOString();
  }
  
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .update(updates)
    .eq('id', post.id)
    .select()
    .single();

  if (error) throw error;
  
  // Update categories if provided
  if (post.category_ids !== undefined) {
    // Remove existing categories
    await supabaseClient
      .from('blog_post_categories')
      .delete()
      .eq('post_id', post.id);
    
    // Add new categories
    if (post.category_ids.length > 0) {
      const categoryInserts = post.category_ids.map(category_id => ({
        post_id: post.id,
        category_id,
      }));
      
      await supabaseClient
        .from('blog_post_categories')
        .insert(categoryInserts);
    }
  }
  
  return data;
}

// Delete a blog post
export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Fetch posts by user
export async function getUserPosts(userId: string): Promise<BlogPost[]> {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Search posts
export async function searchPosts(query: string, limit = 10): Promise<BlogPost[]> {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}
