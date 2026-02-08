import Link from 'next/link';
import { getPublishedPosts, getCategories } from '@/lib/blog-api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

export const metadata = {
  title: 'Blog',
  description: 'Read our latest articles, tutorials, and updates.',
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getPublishedPosts(20),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
            <p className="text-xl text-muted-foreground">
              Insights, tutorials, and updates from our team
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => (
                  <article key={post.id}>
                    <Link href={`/blog/${post.slug}`}>
                      <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                        {post.featured_image && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={post.featured_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            {post.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                          <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                        </CardHeader>
                        
                        <CardContent>
                          {post.excerpt && (
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            
                            {post.author && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {post.author.user_metadata?.name || post.author.email}
                              </span>
                            )}
                            
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.ceil(post.content.split(' ').length / 200)} min read
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Categories</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">About</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Welcome to our blog! Here we share insights, tutorials, and updates about our product and industry.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
