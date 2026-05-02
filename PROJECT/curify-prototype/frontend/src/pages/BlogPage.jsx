import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, Calendar, User, Eye, ArrowRight, Loader2,
  AlertCircle, Zap, BookOpen, Heart, DollarSign, Hospital
} from 'lucide-react';
import axios from 'axios';
import BlogCard from '../components/BlogCard';
import { DottedSurface } from '../components/ui/DottedSurface';
import { BlogSearchInput } from '../components/ui/BlogSearchInput';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORY_CONFIG = {
  patient_stories: { label: 'Patient Stories', icon: Heart, color: 'from-red-500 to-rose-500' },
  healthcare_tips: { label: 'Healthcare Tips', icon: Zap, color: 'from-amber-500 to-orange-500' },
  financial_guides: { label: 'Financial Guides', icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
  hospital_reviews: { label: 'Hospital Reviews', icon: Hospital, color: 'from-sky-500 to-blue-500' },
};

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalBlogs, setTotalBlogs] = useState(0);

  const ITEMS_PER_PAGE = 9;

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/blog/categories`);
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load blogs
  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          skip: currentPage * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
        };
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;

        const res = await axios.get(`${API_URL}/api/blog`, { params });
        setBlogs(res.data.blogs || []);
        setTotalBlogs(res.data.total || 0);
      } catch (err) {
        setError('Failed to load blog posts. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
  }, [selectedCategory, searchQuery, currentPage]);

  const totalPages = Math.ceil(totalBlogs / ITEMS_PER_PAGE);

  return (
    <div className="relative min-h-screen bg-slate-950 pt-24 pb-12">
      {/* Animated dotted surface background */}
      <DottedSurface className="fixed inset-0" />
      
      {/* Gradient overlay effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={28} className="text-emerald-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white">CURIFY Blog</h1>
          </div>
          <p className="text-slate-400 text-lg">Healthcare insights, patient stories, and financial guidance</p>
        </motion.div>

        {/* Search Bar with Glow Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-7xl mx-auto px-4 mb-10 flex justify-center"
        >
          <BlogSearchInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            onSearch={() => setCurrentPage(0)}
            placeholder="Search blog posts..."
          />
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-7xl mx-auto px-4 mb-12"
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat] || { label: cat, color: 'from-slate-500 to-slate-600' };
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(0);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {config.icon && <config.icon size={16} />}
                  {config.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-7xl mx-auto px-4 mb-10"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <Loader2 size={32} className="text-emerald-400" />
            </motion.div>
          </div>
        ) : (
          <>
            {/* Blog Grid */}
            <div className="max-w-7xl mx-auto px-4 mb-12">
              {blogs.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, staggerChildren: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {blogs.map((blog, idx) => (
                    <motion.div
                      key={blog.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <BlogCard blog={blog} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 text-lg">No blog posts found. Try different search or category.</p>
                </motion.div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2"
              >
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  ← Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(0, currentPage - 2) + i;
                    if (pageNum >= totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  Next →
                </button>
              </motion.div>
            )}

            {/* Info text */}
            <div className="text-center mt-8 text-slate-400">
              Showing {blogs.length > 0 ? currentPage * ITEMS_PER_PAGE + 1 : 0} -{' '}
              {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalBlogs)} of {totalBlogs} posts
            </div>
          </>
        )}
      </div>
    </div>
  );
}
