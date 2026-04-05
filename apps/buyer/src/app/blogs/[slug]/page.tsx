'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import { useBlogBySlug } from '@/hooks/useBlogs';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const { data: blog, isLoading, isError, error } = useBlogBySlug(slug || '');

  // Log errors for debugging
  if (isError && error) {
    console.error('[BlogDetailPage] Error loading blog:', error);
  }

  if (!slug) {
    return (
      <div className="min-h-screen  bg-gray-50">
        <Navbar onLoginClick={() => setIsLoginOpen(true)} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center py-20">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Invalid blog URL</h3>
            <p className="text-sm text-gray-500">The blog URL is missing or invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <Navbar onLoginClick={() => setIsLoginOpen(true)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Button */}
        <button
          onClick={() => router.push('/blogs')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blogs
        </button>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-64 bg-gray-200 rounded-2xl mt-6" />
            <div className="space-y-2 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 rounded w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Failed to load blog</h3>
            <p className="text-sm text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'Unable to fetch this blog post. Please try again later.'}
            </p>
            <button
              onClick={() => router.push('/blogs')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-lime-600 text-white text-sm font-medium rounded-lg hover:bg-lime-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blogs
            </button>
          </div>
        ) : !blog ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Blog not found</h3>
            <p className="text-sm text-gray-500">The blog post you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-4">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              {blog.author && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {blog.author}
                </span>
              )}
              {blog.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-lime-50 text-lime-700 text-xs font-semibold px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {blog.coverImage && (
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-8">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}

            {blog.content ? (
              <div
                className="prose prose-gray max-w-none prose-headings:font-bold prose-a:text-lime-600 prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            ) : (
              <p className="text-gray-500">No content available for this blog post.</p>
            )}
          </motion.article>
        )}
      </div>
    </div>
  );
}
