import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, User, Eye, ArrowRight, Heart } from 'lucide-react';
import { useState } from 'react';

const CATEGORY_CONFIG = {
  patient_stories: { label: 'Patient Stories', bg: 'from-red-500/10 to-rose-500/5', border: 'border-red-500/20', text: 'text-red-400' },
  healthcare_tips: { label: 'Healthcare Tips', bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
  financial_guides: { label: 'Financial Guides', bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  hospital_reviews: { label: 'Hospital Reviews', bg: 'from-sky-500/10 to-blue-500/5', border: 'border-sky-500/20', text: 'text-sky-400' },
};

export default function BlogCard({ blog }) {
  const [liked, setLiked] = useState(false);
  const config = CATEGORY_CONFIG[blog.category] || {
    label: 'Article',
    bg: 'from-slate-500/10 to-slate-500/5',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link to={`/blog/${blog.slug}`}>
      <motion.div
        whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.1)' }}
        className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-xl p-6 h-full flex flex-col backdrop-blur-sm transition-all duration-300`}
      >
        {/* Header with category and like button */}
        <div className="flex items-start justify-between mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-slate-700/50 text-slate-300`}>
            {config.label}
          </span>
          {blog.featured && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 flex-grow">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {blog.excerpt}
        </p>

        {/* Footer with meta info */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{blog.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(blog.created_at)}</span>
            </div>
          </div>

          {/* Views and read more */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Eye size={14} />
              <span>{blog.views} views</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  setLiked(!liked);
                }}
                whileTap={{ scale: 0.9 }}
                className={`p-1 rounded transition-colors ${
                  liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
                }`}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              </motion.button>
              <motion.div whileHover={{ x: 4 }}>
                <ArrowRight size={16} className="text-emerald-400" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
