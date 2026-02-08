import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug } from '@/lib/blog-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const readingTime = Math.ceil(post.content.split(' ').length / 200);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            {post.author && (
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium text-foreground">
                  {post.author.user_metadata?.name || post.author.email}
                </span>
              </span>
            )}

            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readingTime} min read
            </span>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Share */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Share this article:
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: post.title,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
