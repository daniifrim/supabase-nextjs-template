export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  author?: {
    email: string;
    user_metadata: {
      name?: string;
    };
  };
  categories?: BlogCategory[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam';
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  category_ids?: string[];
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  id: string;
}
