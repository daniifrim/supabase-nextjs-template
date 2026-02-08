'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getUserPosts, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost,
  getCategories,
  generateSlug 
} from '@/lib/blog-api';
import { BlogPost, BlogCategory, CreateBlogPostInput } from '@/lib/types/blog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Eye, Save, X } from 'lucide-react';
import { supabaseClient } from '@/lib/blog-api';

export default function BlogAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState<CreateBlogPostInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    tags: [],
    category_ids: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setUser(session.user);
    loadData(session.user.id);
  };

  const loadData = async (userId: string) => {
    const [postsData, categoriesData] = await Promise.all([
      getUserPosts(userId),
      getCategories(),
    ]);
    setPosts(postsData);
    setCategories(categoriesData);
    setLoading(false);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    
    const status = publish ? 'published' : formData.status;
    
    try {
      if (editingPost) {
        await updateBlogPost({
          id: editingPost.id,
          ...formData,
          status,
        });
      } else {
        if (!user) return;
        await createBlogPost({ ...formData, status }, user.id);
      }
      
      setDialogOpen(false);
      setEditingPost(null);
      resetForm();
      if (user) loadData(user.id);
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post. Please try again.');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image: post.featured_image || '',
      status: post.status,
      published_at: post.published_at || undefined,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      tags: post.tags || [],
      category_ids: post.categories?.map(c => c.id) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deleteBlogPost(id);
      if (user) loadData(user.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
      tags: [],
      category_ids: [],
    });
    setTagInput('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Blog Admin</h1>
            <p className="text-muted-foreground">Manage your blog posts</p>
          </div>
          <Button
            onClick={() => {
              setEditingPost(null);
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Posts ({posts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet. Create your first post!</p>
              </div>
            ) : (
              <div className="divide-y">
                {posts.map((post) => (
                  <div key={post.id} className="py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{post.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(post.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /blog/{post.slug}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {post.status === 'published' && (
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Post' : 'New Post'}</DialogTitle>
            </DialogHeader>

            <form className="space-y-6 py-4">
              <Tabs defaultValue="content">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="post-url-slug"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief summary of the post"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content (Markdown) *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your post content in Markdown..."
                      rows={15}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featured_image">Featured Image URL</Label>
                    <Input
                      id="featured_image"
                      value={formData.featured_image || ''}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title || ''}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      placeholder="SEO title (defaults to post title)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description || ''}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="SEO description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add a tag and press Enter"
                      />
                      <Button type="button" onClick={handleAddTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'draft' | 'published' | 'archived') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`cat-${category.id}`}
                            checked={formData.category_ids?.includes(category.id)}
                            onChange={(e) => {
                              const newCategoryIds = e.target.checked
                                ? [...(formData.category_ids || []), category.id]
                                : (formData.category_ids || []).filter(id => id !== category.id);
                              setFormData({ ...formData, category_ids: newCategoryIds });
                            }}
                          />
                          <Label htmlFor={`cat-${category.id}`}>{category.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={!formData.title || !formData.content}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={!formData.title || !formData.content}
                >
                  {editingPost?.status === 'published' ? 'Update' : 'Publish'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
