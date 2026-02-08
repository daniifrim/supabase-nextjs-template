-- Blog System Schema for blog-mami

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}'
);

-- Blog categories table
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog post categories junction table
CREATE TABLE blog_post_categories (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Blog comments table
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
-- Anyone can read published posts
CREATE POLICY "Anyone can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Authenticated users can read their own posts (all statuses)
CREATE POLICY "Users can read own posts" ON blog_posts
  FOR SELECT TO authenticated USING (auth.uid() = author_id);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON blog_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON blog_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON blog_posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can read categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON blog_categories
  FOR ALL TO authenticated USING (true);

-- RLS Policies for blog_post_categories
CREATE POLICY "Anyone can read post categories" ON blog_post_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage post categories" ON blog_post_categories
  FOR ALL TO authenticated USING (true);

-- RLS Policies for blog_comments
CREATE POLICY "Anyone can read approved comments" ON blog_comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can create comments" ON blog_comments
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('General', 'general', 'General blog posts'),
  ('Tutorial', 'tutorial', 'Step-by-step guides and tutorials'),
  ('News', 'news', 'Latest news and updates'),
  ('Tips & Tricks', 'tips-tricks', 'Helpful tips and tricks');
