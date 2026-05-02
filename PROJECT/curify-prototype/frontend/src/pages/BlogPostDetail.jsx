import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Eye, ArrowLeft, Share2, Loader2, AlertCircle, Heart } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORY_CONFIG = {
  patient_stories: { label: 'Patient Stories', bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
  healthcare_tips: { label: 'Healthcare Tips', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  financial_guides: { label: 'Financial Guides', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  hospital_reviews: { label: 'Hospital Reviews', bg: 'bg-sky-500/10', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300' },
};

export default function BlogPostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_URL}/api/blog/${slug}`);
        setBlog(res.data);

        // Load related blogs
        try {
          const relatedRes = await axios.get(`${API_URL}/api/blog/related/${res.data.id}`);
          setRelatedBlogs(relatedRes.data.related_blogs || []);
        } catch (err) {
          console.error('Failed to load related blogs');
        }
      } catch (err) {
        setError('Blog post not found or failed to load.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center pt-24">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader2 size={32} className="text-emerald-400" />
        </motion.div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/blog" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8">
            <ArrowLeft size={20} />
            Back to Blog
          </Link>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[blog.category] || {
    label: 'Article',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-300',
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-8 md:p-10 mb-12"
        >
          {/* Category Badge */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${config.badge}`}>
              {config.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {blog.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-slate-300 mb-8">{blog.excerpt}</p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-slate-400 border-t border-b border-slate-700 py-6">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{blog.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formatDate(blog.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>{blog.views} views</span>
            </div>
          </div>

          {/* Article Actions */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                liked
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              {liked ? 'Liked' : 'Like'}
            </button>
          </div>
        </motion.article>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="prose prose-invert max-w-none mb-12"
        >
          <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700/30 text-slate-200 leading-relaxed space-y-4">
            {blog.content.split('\n').map((line, idx) => {
              if (line.startsWith('##')) {
                return (
                  <h2 key={idx} className="text-2xl font-bold text-white mt-6 mb-3">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('✓')) {
                return (
                  <div key={idx} className="flex items-start gap-3 text-emerald-300">
                    <span className="text-xl mt-0.5">✓</span>
                    <span>{line.replace('✓ ', '')}</span>
                  </div>
                );
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={idx} className="font-bold text-white italic">
                    "{line.replace(/\*\*/g, '')}"
                  </p>
                );
              }
              if (line.trim() === '') {
                return null;
              }
              return <p key={idx}>{line}</p>;
            })}
          </div>
        </motion.div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link key={relatedBlog.id} to={`/blog/${relatedBlog.slug}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all cursor-pointer h-full"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded ${CATEGORY_CONFIG[relatedBlog.category]?.badge}`}>
                        {CATEGORY_CONFIG[relatedBlog.category]?.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-2 line-clamp-2">{relatedBlog.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">{relatedBlog.excerpt}</p>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Calendar size={14} />
                      {formatDate(relatedBlog.created_at)}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
