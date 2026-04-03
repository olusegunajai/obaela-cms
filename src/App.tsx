import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactPlayer from 'react-player';
import { useNavigate, useLocation, Routes, Route, Link, useParams } from 'react-router-dom';
import { authService, UserProfile, UserRole } from './services/authService';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  User, 
  Users,
  Shield,
  FileText,
  Menu,
  X,
  Leaf,
  Sparkles,
  BookOpen,
  Search,
  CreditCard,
  Truck,
  Youtube,
  BarChart3,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Auth } from './components/Auth';
import { consultationService, ConsultationType, Consultation as ConsultationData, ConsultationStatus } from './services/consultationService';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { productService, Product } from './services/productService';
import { uploadImage, uploadVideo } from './services/cloudinaryService';
import { ShoppingCart, Plus, Trash2, Edit2, Upload, Loader2, Printer, MessageCircle, Send, X as CloseIcon, Play, Facebook, Instagram, Twitter, Star } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { orderService, OrderStatus, Order } from './services/orderService';
import { courseService, Course, Lesson, Enrollment } from './services/courseService';
import { babalawoService, Babalawo } from './services/babalawoService';
import { geminiService } from './services/geminiService';
import { videoService, YouTubeVideo } from './services/videoService';
import { staffService, StaffMember } from './services/staffService';
import { seedService } from './services/seedService';
import { pageService, Page } from './services/pageService';
import { themeService, ThemeSettings } from './services/themeService';
import { themes, Theme } from './themes';
import { reviewService, Review } from './services/reviewService';
import { faqService, FAQ } from './services/faqService';
import { useToast } from './components/Toast';
import { useConfirm } from './components/Confirm';
import { ProductReviews } from './components/ProductReviews';
import { CONSULTATION_PRICE } from './constants';
import { useCurrency } from './contexts/CurrencyContext';
import { formatCurrency, CURRENCIES, Currency } from './lib/currency';

// Components
const ProductReviews = ({ productId, productName, onClose }: { productId: string, productName: string, onClose: () => void }) => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = reviewService.subscribeToReviews(productId, setReviews);
    return unsubscribe;
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showToast("Please sign in to leave a review.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.addReview(productId, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        rating,
        text
      });
      setText('');
      setRating(5);
      showToast("Review submitted successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to submit review.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full">
        <X />
      </button>
      
      <h2 className="text-3xl font-bold mb-2 serif">{productName}</h2>
      <p className="text-gold uppercase tracking-[0.2em] text-xs font-bold mb-8 serif italic">Customer Reviews</p>

      {/* Review Form */}
      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="mb-12 bg-paper p-6 rounded-2xl border border-black/5">
          <h3 className="text-lg font-bold mb-4">Leave a Review</h3>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 transition-colors ${star <= rating ? 'text-gold' : 'text-gray-300'}`}
              >
                <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full p-4 rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-forest mb-4 min-h-[100px]"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-gold hover:text-black transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      ) : (
        <div className="mb-12 p-6 bg-paper rounded-2xl border border-black/5 text-center italic opacity-60">
          Please sign in to leave a review.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-8">
        {reviews.length === 0 ? (
          <p className="text-center opacity-50 italic py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-black/5 pb-8 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">{review.userName}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={star <= review.rating ? 'text-gold fill-gold' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm opacity-70 leading-relaxed mb-2">{review.text}</p>
              <div className="text-[10px] opacity-40 uppercase tracking-widest">
                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CustomPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (slug) {
      const fetchPage = async () => {
        setLoading(true);
        const p = await pageService.getPageBySlug(slug);
        if (active) {
          setPage(p);
          setLoading(false);
        }
      };
      fetchPage();
    }
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-gold w-12 h-12" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-8 text-center">
        <h1 className="text-6xl font-bold serif mb-4">404</h1>
        <p className="text-xl opacity-60 mb-8">Sacred knowledge not found at this path.</p>
        <Link to="/" className="px-8 py-3 bg-gold text-black rounded-full font-bold">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <section className="relative py-24 bg-[#0a0502] text-white overflow-hidden">
        <div className="absolute inset-0 atmosphere opacity-40" />
        <div className="max-w-4xl mx-auto px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-light serif mb-4">{page.title}</h1>
          <div className="w-24 h-[1px] bg-gold mx-auto" />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg prose-stone max-w-none"
        >
          <ReactMarkdown>{page.content}</ReactMarkdown>
        </motion.div>
      </div>
    </div>
  );
};

const Home = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [homePage, setHomePage] = useState<Page | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchHome = async () => {
      const page = await pageService.getPageBySlug('home');
      setHomePage(page);
    };
    fetchHome();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-[#0a0502]">
        {/* Atmospheric background—layered gradients */}
        <div className="absolute inset-0 atmosphere" />
        <div className="absolute inset-0 leaf-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0502]/60" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative z-10 text-center px-4 max-w-5xl"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="flex justify-center mb-8"
          >
            <Leaf className="text-gold w-12 h-12" />
          </motion.div>
          <span className="text-gold uppercase tracking-[0.4em] text-sm font-semibold mb-6 block serif italic">Sacred Wisdom & Traditional Healing</span>
          <h1 className="text-6xl md:text-8xl font-light text-white serif mb-8 leading-tight tracking-tight">
            {homePage?.title ? (
              <>
                {homePage.title.split('TRADO')[0]} <br />
                <span className="text-gold italic font-medium">TRADO {homePage.title.split('TRADO')[1]}</span>
              </>
            ) : (
              <>
                OBA ELA <br />
                <span className="text-gold italic font-medium">TRADO MEDICAL</span>
              </>
            )}
          </h1>
          <div className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            {homePage?.content ? (
              <ReactMarkdown>{homePage.content}</ReactMarkdown>
            ) : (
              "Connecting you to the ancestral traditions of Ifa and Orisha. Traditional African healing, spiritual guidance, and the path to your true destiny."
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/consultation" className="px-10 py-4 bg-gold text-black font-bold rounded-full hover:bg-white transition-all duration-500 transform hover:scale-105 shadow-xl shadow-gold/20">
              Book Consultation
            </Link>
            <Link to="/store" className="px-10 py-4 border border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-500 backdrop-blur-sm">
              Explore Store
            </Link>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 opacity-10 text-gold hidden lg:block"
        >
          <Leaf size={120} />
        </motion.div>
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-10 opacity-10 text-gold hidden lg:block"
        >
          <Leaf size={150} />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-gold to-transparent mx-auto" />
        </motion.div>
      </section>

      {/* Wisdom Quote Section */}
      <section className="py-32 bg-paper relative overflow-hidden">
        <div className="absolute inset-0 leaf-overlay opacity-[0.02]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="serif italic text-3xl md:text-5xl text-earth/90 leading-relaxed mb-12"
          >
            "Ifa is the light that guides the soul through the darkness of uncertainty. Through the sacred Odu, we find our way back to the source of our destiny."
          </motion.div>
          <div className="w-24 h-[1px] bg-gold mx-auto mb-6" />
          <p className="text-gold font-bold tracking-[0.3em] uppercase text-xs">OBA ELA TRADO • SACRED TRADITION</p>
        </div>
      </section>

      {/* Services Bento Grid */}
      <section className="py-32 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-paper to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <span className="text-forest font-bold tracking-widest uppercase text-[10px] mb-4 block">Our Sacred Offerings</span>
            <h2 className="text-4xl md:text-6xl serif mb-6">Harmonizing Soul & Body</h2>
            <p className="text-earth/60 max-w-xl mx-auto text-lg font-light">Explore our range of traditional services designed to restore balance and harmony to your life.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Consultation Card */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 bg-paper rounded-[3rem] p-12 flex flex-col md:flex-row gap-12 items-center border border-black/5 spiritual-glow"
            >
              <div className="flex-1">
                <div className="w-20 h-20 bg-forest/10 rounded-3xl flex items-center justify-center mb-8">
                  <Calendar className="text-forest w-10 h-10" />
                </div>
                <h3 className="text-4xl serif mb-6">Spiritual Consultations</h3>
                <p className="text-earth/70 mb-10 text-lg leading-relaxed font-light">
                  Direct guidance from the Orishas through Ifa divination. Our consultations provide clarity on health, relationships, career, and spiritual growth.
                </p>
                <Link to="/consultation" className="inline-flex items-center gap-3 px-8 py-3 bg-forest text-white rounded-full font-bold hover:bg-gold hover:text-black transition-all group">
                  Book a session <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://picsum.photos/seed/ifa/800/800" 
                  alt="Ifa Divination" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Store Card */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 bg-earth text-white rounded-[3rem] p-12 flex flex-col justify-between border border-black/5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 leaf-overlay opacity-10 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8">
                  <ShoppingBag className="text-white w-10 h-10" />
                </div>
                <h3 className="text-4xl serif mb-6">Herbal Store</h3>
                <p className="text-white/70 mb-10 text-lg leading-relaxed font-light">
                  Authentic traditional medicines, spiritual soaps, and consecrated items prepared with ancient knowledge.
                </p>
              </div>
              <Link to="/store" className="relative z-10 inline-flex items-center gap-3 text-gold font-bold text-lg hover:text-white transition-colors group">
                Shop Items <ShoppingCart size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Academy Card */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 bg-earth text-white rounded-[2rem] p-10 flex flex-col justify-between border border-black/5"
            >
              <div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="text-white w-8 h-8" />
                </div>
                <h3 className="text-3xl serif mb-4">Ilé-Àkọ́ni-lọ́gbọ́n</h3>
                <p className="text-white/70 mb-8 leading-relaxed">
                  Learn the sacred arts of Ifa, herbalism, and traditional healing through our comprehensive training programs.
                </p>
              </div>
              <Link to="/training" className="text-gold font-bold flex items-center gap-2 hover:gap-4 transition-all">
                Start Learning <Plus size={16} />
              </Link>
            </motion.div>

            {/* Gallery Card */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 bg-paper rounded-[2rem] p-10 flex flex-col md:flex-row-reverse gap-10 items-center border border-black/5"
            >
              <div className="flex-1">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Youtube className="text-red-500 w-8 h-8" />
                </div>
                <h3 className="text-3xl serif mb-4">Video Teachings</h3>
                <p className="text-earth/70 mb-8 leading-relaxed">
                  Watch OBA ELA share profound insights into the Orisha traditions and the secrets of traditional medicine.
                </p>
                <Link to="/gallery" className="text-gold font-bold flex items-center gap-2 hover:gap-4 transition-all">
                  Watch Now <Play size={16} />
                </Link>
              </div>
              <div className="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black">
                 <img 
                  src="https://picsum.photos/seed/temple/600/400" 
                  alt="Temple" 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Immersive Temple Section */}
      <section className="py-32 bg-[#0a0502] text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-gold uppercase tracking-widest text-sm mb-6 block serif">The Tradition</span>
              <h2 className="text-5xl md:text-6xl serif mb-8">A Sanctuary for the Soul</h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                OBA ELA TRADO is more than a healing center; it is a bridge between the physical and spiritual worlds. We preserve the ancient wisdom of the Yoruba people, bringing the power of the Orishas to those seeking truth and healing.
              </p>
              <ul className="space-y-4 mb-12">
                {['Authentic Ifa Lineage', 'Traditional Herbal Knowledge', 'Spiritual Empowerment', 'Community Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/80">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/consultation" className="inline-block px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gold transition-all">
                Visit the Temple
              </Link>
            </motion.div>
            
            <div className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                <img 
                  src="https://picsum.photos/seed/shrine/800/1000" 
                  alt="Sacred Temple" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gold/20 rounded-full blur-3xl z-0" />
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-forest/20 rounded-full blur-3xl z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / Join Section */}
      {!user && (
        <section className="py-24 bg-paper">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-xl border border-black/5">
              <h3 className="text-4xl serif mb-6">Join the Sacred Circle</h3>
              <p className="text-earth/60 mb-10 text-lg">
                Create an account to access our Ilé-Àkọ́ni-lọ́gbọ́n, track your spiritual journey, and receive updates from OBA ELA.
              </p>
              <div className="flex justify-center">
                <Auth />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const Store = () => {
  const { showToast } = useToast();
  const { currency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, fetchProducts]);

  const PAGE_SIZE = 8;

  const fetchProducts = useCallback(async (isFirstLoad = false, category = selectedCategory, featured = showFeaturedOnly) => {
    if (isLoading || (!isFirstLoad && !hasMore)) return;
    
    setIsLoading(true);
    try {
      const result = await productService.getProducts(
        PAGE_SIZE, 
        isFirstLoad ? undefined : (lastVisible || undefined), 
        category, 
        featured
      );
      
      if (isFirstLoad) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }
      
      setLastVisible(result.lastVisible || null);
      setHasMore(result.products.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to load products.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, lastVisible, selectedCategory, showFeaturedOnly, showToast]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await productService.getAllCategories();
        setCategories(['All', ...cats]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(true, selectedCategory, showFeaturedOnly);
  }, [selectedCategory, showFeaturedOnly, fetchProducts]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckoutComplete = async (reference: string, details: { name: string, email: string, phone: string, address: string }) => {
    try {
      if (!auth.currentUser) {
        showToast("Please sign in to complete your order.", "error");
        return;
      }

      const orderData = {
        clientUid: auth.currentUser.uid,
        customerName: details.name,
        email: details.email,
        phone: details.phone,
        address: details.address,
        items: cart.map(item => ({
          productId: item.product.id!,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.imageUrl
        })),
        totalAmount: total,
        status: OrderStatus.PAID,
        paymentReference: reference
      };

      await orderService.createOrder(orderData);
      
      // Update stock for each product
      for (const item of cart) {
        await productService.updateProduct(item.product.id!, {
          stock: Math.max(0, item.product.stock - item.quantity)
        });
      }

      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      showToast("Order placed successfully! You can track it in the Orders section.", "success");
    } catch (error: unknown) {
      console.error(error);
      showToast("Failed to save order. Please contact support.", "error");
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-paper">
      {/* Store Header */}
      <section className="relative py-32 bg-[#0a0502] text-white overflow-hidden">
        <div className="absolute inset-0 atmosphere opacity-50" />
        <div className="absolute inset-0 leaf-overlay opacity-5" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6 justify-center md:justify-start"
            >
              <div className="h-[1px] w-12 bg-gold" />
              <span className="text-gold uppercase tracking-[0.4em] text-xs font-bold serif italic">Sacred Remedies</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-light serif mb-6 tracking-tight">Herbal Store</h1>
            <p className="text-white/70 text-xl max-w-xl font-light leading-relaxed">
              Authentic traditional medicines, spiritual soaps, and consecrated items prepared with ancient ancestral knowledge.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-8 bg-gold text-black rounded-full shadow-[0_0_50px_rgba(212,175,55,0.3)] hover:bg-white transition-all duration-500 group"
            >
              <ShoppingCart className="w-8 h-8" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-lg border-2 border-gold animate-bounce">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </section>

      <div className="p-8 max-w-7xl mx-auto py-24">
        {/* Search and Filter Bar */}
        <div className="mb-16 flex flex-col md:flex-row gap-8 items-center justify-between bg-white p-8 rounded-[2rem] shadow-sm border border-black/5">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/40 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search remedies..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-paper rounded-2xl outline-none focus:ring-2 focus:ring-gold/20 transition-all font-light"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-6 justify-center">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-forest text-white shadow-lg shadow-forest/20' 
                      : 'bg-paper text-earth/60 hover:bg-earth/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="h-8 w-[1px] bg-black/10 hidden md:block" />
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`flex items-center gap-3 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                showFeaturedOnly 
                  ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                  : 'bg-paper text-earth/60 hover:bg-earth/10'
              }`}
            >
              <Star size={14} className={showFeaturedOnly ? 'fill-black' : ''} />
              Featured
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
          {filteredProducts.map((product, index) => (
            <motion.div 
              key={product.id}
              ref={index === filteredProducts.length - 1 ? lastProductElementRef : null}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] border border-black/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all group spiritual-glow"
            >
              <div className="aspect-square bg-paper relative overflow-hidden">
                <img 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.name}/600/600`} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-5 py-2 rounded-full text-sm font-bold text-forest shadow-sm border border-black/5">
                  {formatCurrency(product.price, currency)}
                </div>
                {product.featured && (
                  <div className="absolute top-6 left-6 bg-gold text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <Star size={12} className="fill-black" />
                    Featured
                  </div>
                )}
                {product.stock <= 5 && product.stock > 0 && !product.featured && (
                  <div className="absolute top-6 left-6 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Low Stock
                  </div>
                )}
                {product.stock <= 5 && product.stock > 0 && product.featured && (
                  <div className="absolute top-16 left-6 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Low Stock
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] flex items-center justify-center">
                    <span className="bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-[0.2em] text-xs shadow-2xl">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-10">
                <div className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-4 serif italic">{product.category}</div>
                <h3 className="text-2xl font-bold mb-4 serif group-hover:text-forest transition-colors leading-tight">{product.name}</h3>
                <p className="text-sm text-earth/60 line-clamp-2 mb-10 leading-relaxed font-light">{product.description}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="flex-grow py-5 bg-forest text-white rounded-2xl font-bold hover:bg-earth hover:text-white transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-forest/10"
                  >
                    <Plus size={20} />
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => setSelectedProductForReviews(product)}
                    className="p-5 bg-paper text-forest rounded-2xl font-bold hover:bg-gold hover:text-black transition-all duration-500 flex items-center justify-center border border-black/5"
                    title="View Reviews"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading Indicator for Infinite Scroll */}
        {isLoading && (
          <div className="mt-20 flex justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-forest" />
          </div>
        )}

        {/* Fallback Load More Button if Observer fails or for accessibility */}
        {!isLoading && hasMore && (
          <div className="mt-20 flex justify-center">
            <button
              onClick={() => fetchProducts()}
              className="px-12 py-4 bg-white border border-black/10 text-earth font-bold rounded-full hover:bg-gold hover:text-black hover:border-gold transition-all duration-500 flex items-center gap-3 shadow-xl"
            >
              "Load More Sacred Items"
            </button>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Your Basket</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12 opacity-50 italic">Your basket is empty</div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 items-center">
                      <img 
                        src={item.product.imageUrl || `https://picsum.photos/seed/${item.product.name}/100/100`} 
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow">
                        <h4 className="font-bold">{item.product.name}</h4>
                        <p className="text-sm opacity-60">{formatCurrency(item.product.price, currency)} x {item.quantity}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id!)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-8 pt-8 border-t border-black/5">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-forest">{formatCurrency(total, currency)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (!auth.currentUser) {
                        showToast("Please sign in to checkout.", "info");
                        return;
                      }
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-4 bg-gold text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                  >
                    Checkout Now
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-lg"
            >
              <Checkout 
                cart={cart} 
                total={total} 
                onCancel={() => setIsCheckoutOpen(false)}
                onComplete={handleCheckoutComplete}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProductForReviews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForReviews(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full flex justify-center"
            >
              <ProductReviews 
                productId={selectedProductForReviews.id!} 
                productName={selectedProductForReviews.name}
                onClose={() => setSelectedProductForReviews(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
const Checkout = ({ total, onComplete, onCancel }: { cart: {product: Product, quantity: number}[], total: number, onComplete: (ref: string, details: { name: string, email: string, phone: string, address: string }) => void, onCancel: () => void }) => {
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: total * 100, // Paystack amount is in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaystackSuccessAction = (reference: { reference: string }) => {
    onComplete(reference.reference, { name, email, phone, address });
  };

  const handlePaystackCloseAction = () => {
    setIsProcessing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.publicKey) {
      showToast("Paystack Public Key is missing. Please check environment variables.", "error");
      return;
    }
    setIsProcessing(true);
    initializePayment({
      onSuccess: handlePaystackSuccessAction,
      onClose: handlePaystackCloseAction
    });
  };

  return (
    <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="text-forest" />
        Checkout Details
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
            required
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
            required
          />
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
            required
          />
          <textarea 
            placeholder="Delivery Address" 
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
            rows={3}
            required
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="opacity-60">Subtotal</span>
            <span className="font-bold">{formatCurrency(total, currency)}</span>
          </div>
          <div className="flex justify-between items-center text-forest">
            <span className="font-bold">Total to Pay</span>
            <span className="text-xl font-bold">{formatCurrency(total, currency)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isProcessing}
            className="flex-1 py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : 'Pay with Paystack'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Orders = () => {
  const { currency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    let unsubscribeOrders = () => {};

    if (auth.currentUser) {
      unsubscribeOrders = orderService.subscribeToUserOrders(auth.currentUser.uid, setOrders);
    }

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, []);

  if (!user) return <div className="p-12 text-center opacity-50">Please sign in to view your orders.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Truck className="text-forest" />
        Order Tracking
      </h2>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-black/5 opacity-50 italic">
            You haven't placed any orders yet.
          </div>
        ) : (
          orders.map(order => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm"
            >
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</div>
                  <div className="font-mono text-sm">{order.id}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-forest/10 text-forest'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</div>
                  <div className="text-sm">{order.createdAt?.toDate().toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total</div>
                  <div className="text-lg font-bold text-forest">{formatCurrency(order.totalAmount, currency)}</div>
                </div>
              </div>

              <div className="border-t border-black/5 pt-4">
                <div className="text-sm font-bold mb-3">Items</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl">
                      <img 
                        src={item.imageUrl || `https://picsum.photos/seed/${item.name}/50/50`} 
                        className="w-10 h-10 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-sm font-bold">{item.name}</div>
                        <div className="text-xs opacity-60">{formatCurrency(item.price, currency)} x {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
const Admin = () => {
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'consultations' | 'products' | 'orders' | 'users' | 'courses' | 'babalawos' | 'videos' | 'staff' | 'accounting' | 'pages' | 'theme' | 'faqs' | 'media'>('consultations');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [allConsultations, setAllConsultations] = useState<ConsultationData[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lastVisibleProduct, setLastVisibleProduct] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    displayName: '',
    role: 'client' as UserRole
  });

  const handleCreateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate a temporary UID for pre-registration
      const tempUid = 'user_' + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'users', tempUid), {
        uid: tempUid,
        ...newUserForm,
        adminLevel: 0,
        hasPremiumAccess: false,
        createdAt: serverTimestamp()
      });
      showToast("User profile created successfully", "success");
      setNewUserForm({ email: '', displayName: '', role: 'client' });
    } catch (error) {
      console.error(error);
      showToast("Failed to create user profile", "error");
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons] = useState<Lesson[]>([]);
  const [babalawos, setBabalawos] = useState<Babalawo[]>([]);
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General',
    order: 1,
    isPublished: true
  });
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingBabalawo, setEditingBabalawo] = useState<Babalawo | null>(null);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [printingConsultation, setPrintingConsultation] = useState<ConsultationData | null>(null);

  const handlePrint = (consultation: ConsultationData) => {
    setPrintingConsultation(consultation);
    setTimeout(() => {
      window.print();
      setPrintingConsultation(null);
    }, 100);
  };

  const fetchAdminProducts = useCallback(async (isFirstLoad = false) => {
    if (isLoadingProducts || (!isFirstLoad && !hasMoreProducts)) return;
    setIsLoadingProducts(true);
    try {
      const result = await productService.getProducts(
        10, 
        isFirstLoad ? undefined : (lastVisibleProduct || undefined)
      );
      if (isFirstLoad) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }
      setLastVisibleProduct(result.lastVisible || null);
      setHasMoreProducts(result.products.length === 10);
    } catch (error) {
      console.error(error);
      showToast("Failed to load products", "error");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isLoadingProducts, hasMoreProducts, lastVisibleProduct, showToast]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchAdminProducts(true);
    }
  }, [activeTab, fetchAdminProducts]);

  const [selectedConsultations, setSelectedConsultations] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedFaqs, setSelectedFaqs] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedStaffDepartment, setSelectedStaffDepartment] = useState('All');
  const [selectedStaffStatus, setSelectedStaffStatus] = useState('All');

  const handleBulkDeleteConsultations = async () => {
    showConfirm("Bulk Delete", `Are you sure you want to delete ${selectedConsultations.length} consultations?`, async () => {
      try {
        await Promise.all(selectedConsultations.map(id => deleteDoc(doc(db, 'consultations', id))));
        setSelectedConsultations([]);
        showToast("Consultations deleted successfully", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete consultations", "error");
      }
    });
  };

  const handleBulkUpdateConsultationStatus = async (status: string) => {
    try {
      await Promise.all(selectedConsultations.map(id => updateDoc(doc(db, 'consultations', id), { status })));
      setSelectedConsultations([]);
      showToast("Consultations updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update consultations", "error");
    }
  };

  const handleBulkDeleteProducts = async () => {
    showConfirm("Bulk Delete", `Are you sure you want to delete ${selectedProducts.length} products?`, async () => {
      try {
        await Promise.all(selectedProducts.map(id => productService.deleteProduct(id)));
        setSelectedProducts([]);
        showToast("Products deleted successfully", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete products", "error");
      }
    });
  };

  const handleBulkUpdateOrderStatus = async (status: string) => {
    try {
      await Promise.all(selectedOrders.map(id => orderService.updateOrderStatus(id, status as OrderStatus)));
      setSelectedOrders([]);
      showToast("Orders updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update orders", "error");
    }
  };

  const handleBulkDeleteFaqs = async () => {
    showConfirm("Bulk Delete", `Are you sure you want to delete ${selectedFaqs.length} FAQs?`, async () => {
      try {
        await Promise.all(selectedFaqs.map(id => faqService.deleteFAQ(id)));
        setSelectedFaqs([]);
        showToast("FAQs deleted successfully", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete FAQs", "error");
      }
    });
  };

  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);
  const [isVisualEditor, setIsVisualEditor] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{url: string, type: 'image' | 'video', name: string}[]>([]);
  const [pageForm, setPageForm] = useState<Partial<Page>>({
    title: '',
    slug: '',
    content: '',
    isPublished: false
  });
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', currentTheme.options.primaryColor);
    root.style.setProperty('--secondary', currentTheme.options.accentColor);
    root.style.setProperty('--accent', currentTheme.options.secondaryColor);
    root.style.setProperty('--bg', currentTheme.options.backgroundColor);
    root.style.setProperty('--text', currentTheme.options.textColor);
    root.style.setProperty('--font-serif-family', currentTheme.options.fontFamily);
    root.style.setProperty('--radius', currentTheme.options.borderRadius);
    root.style.setProperty('--glass-opacity', currentTheme.options.glassOpacity);
  }, [currentTheme]);

  const toggleMenuAccess = (uid: string, tabId: string) => {
    const u = allUsers.find(user => user.uid === uid);
    if (!u) return;
    const currentMenu = u.permissions?.menuAccess || [];
    const newMenu = currentMenu.includes(tabId) 
      ? currentMenu.filter(id => id !== tabId)
      : [...currentMenu, tabId];
    authService.updateUserProfile(uid, { 
      permissions: { ...(u.permissions || { contentAccess: [] }), menuAccess: newMenu } 
    });
  };

  const toggleContentAccess = (uid: string, contentType: string) => {
    const u = allUsers.find(user => user.uid === uid);
    if (!u) return;
    const currentContent = u.permissions?.contentAccess || [];
    const newContent = currentContent.includes(contentType) 
      ? currentContent.filter(type => type !== contentType)
      : [...currentContent, contentType];
    authService.updateUserProfile(uid, { 
      permissions: { ...(u.permissions || { menuAccess: [] }), contentAccess: newContent } 
    });
  };

  const handleBulkUpdateFaqStatus = async (isPublished: boolean) => {
    try {
      await Promise.all(selectedFaqs.map(id => faqService.updateFAQ(id, { isPublished })));
      setSelectedFaqs([]);
      showToast("FAQs updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update FAQs", "error");
    }
  };

  const handleBulkDeleteStaff = async () => {
    showConfirm("Bulk Delete", `Are you sure you want to delete ${selectedStaff.length} staff members?`, async () => {
      try {
        await Promise.all(selectedStaff.map(id => staffService.deleteStaff(id)));
        setSelectedStaff([]);
        showToast("Staff members deleted successfully", "success");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete staff members", "error");
      }
    });
  };

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Herbal Medicine',
    imageUrl: '',
    stock: 10,
    featured: false
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'General',
    instructor: '',
    price: 0,
    thumbnailUrl: ''
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    audioUrl: '',
    requiredLevel: 0,
    order: 1
  });

  const [babalawoForm, setBabalawoForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    availability: '',
    imageUrl: ''
  });

  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtubeId: '',
    thumbnailUrl: '',
    requiredLevel: 0
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    department: '',
    status: 'active' as 'active' | 'inactive',
    profileVideoUrl: ''
  });

  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  const [themePrompt, setThemePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profile = await authService.getUserProfile(u.uid);
        setUserProfile(profile);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (editingCourse) {
      setCourseForm({
        title: editingCourse.title,
        description: editingCourse.description,
        category: editingCourse.category || 'General',
        instructor: editingCourse.instructor,
        price: editingCourse.price,
        thumbnailUrl: editingCourse.thumbnailUrl || ''
      });
    }
  }, [editingCourse]);

  useEffect(() => {
    if (editingLesson) {
      setLessonForm({
        title: editingLesson.title,
        content: editingLesson.content,
        videoUrl: editingLesson.videoUrl || '',
        audioUrl: editingLesson.audioUrl || '',
        requiredLevel: editingLesson.requiredLevel || 0,
        order: editingLesson.order
      });
    }
  }, [editingLesson]);

  useEffect(() => {
    const unsubscribe = pageService.subscribeToPages(setPages);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = themeService.subscribeToTheme((settings) => {
      setCurrentTheme({
        id: 'custom',
        name: 'Custom Theme',
        options: settings
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = faqService.subscribeToFAQs(setFaqs);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (editingPage) {
      setPageForm({
        slug: editingPage.slug,
        title: editingPage.title,
        content: editingPage.content,
        isPublished: editingPage.isPublished
      });
    }
  }, [editingPage]);


  const handleDeletePage = async (id: string) => {
    showConfirm(
      "Delete Page",
      "Are you sure you want to delete this page? This action cannot be undone.",
      async () => {
        try {
          await pageService.deletePage(id);
          showToast("Page deleted successfully", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete page", "error");
        }
      }
    );
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt) return;
    setIsGeneratingTheme(true);
    try {
      const newThemeSettings = await themeService.generateThemeAI(themePrompt);
      const newTheme: Theme = {
        id: 'ai-generated',
        name: 'AI Generated',
        options: newThemeSettings
      };
      setCurrentTheme(newTheme);
      showToast("Theme generated! Click 'Save Theme' to apply it.", "success");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to generate theme", "error");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!currentTheme) return;
    try {
      await themeService.saveTheme(currentTheme.options);
      showToast("Theme saved and applied successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to save theme", "error");
    }
  };

  const handleSubmitFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq?.id) {
        await faqService.updateFAQ(editingFaq.id, faqForm);
        showToast("FAQ updated successfully", "success");
        setEditingFaq(null);
      } else {
        await faqService.addFAQ(faqForm);
        showToast("FAQ added successfully", "success");
      }
      setFaqForm({ question: '', answer: '', category: 'General', order: faqs.length + 1, isPublished: true });
    } catch (error) {
      console.error(error);
      showToast("Failed to save FAQ", "error");
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    showConfirm(
      "Delete FAQ",
      "Are you sure you want to delete this FAQ?",
      async () => {
        try {
          await faqService.deleteFAQ(id);
          showToast("FAQ deleted successfully", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete FAQ", "error");
        }
      }
    );
  };

  useEffect(() => {
    if (editingFaq) {
      setFaqForm({
        question: editingFaq.question,
        answer: editingFaq.answer,
        category: editingFaq.category,
        order: editingFaq.order,
        isPublished: editingFaq.isPublished
      });
    }
  }, [editingFaq]);

  useEffect(() => {
    if (editingBabalawo) {
      setBabalawoForm({
        name: editingBabalawo.name,
        specialty: editingBabalawo.specialty,
        bio: editingBabalawo.bio,
        availability: editingBabalawo.availability,
        imageUrl: editingBabalawo.imageUrl || ''
      });
    }
  }, [editingBabalawo]);

  useEffect(() => {
    if (editingVideo) {
      setVideoForm({
        title: editingVideo.title,
        description: editingVideo.description,
        youtubeId: editingVideo.youtubeId,
        thumbnailUrl: editingVideo.thumbnailUrl || '',
        requiredLevel: editingVideo.requiredLevel || 0
      });
    }
  }, [editingVideo]);

  useEffect(() => {
    if (editingStaff) {
      setStaffForm({
        name: editingStaff.name,
        role: editingStaff.role,
        email: editingStaff.email,
        phone: editingStaff.phone,
        department: editingStaff.department,
        status: editingStaff.status,
        profileVideoUrl: editingStaff.profileVideoUrl || ''
      });
    }
  }, [editingStaff]);

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        category: editingProduct.category,
        imageUrl: editingProduct.imageUrl || '',
        stock: editingProduct.stock,
        featured: editingProduct.featured || false
      });
    }
  }, [editingProduct]);

  useEffect(() => {
    let unsubscribeConsultations = () => {};
    let unsubscribeOrders = () => {};
    let unsubscribeUsers = () => {};

    if (userProfile?.role === 'admin' || userProfile?.role === 'super-admin') {
      const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
      unsubscribeConsultations = onSnapshot(q, (snapshot) => {
        setAllConsultations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ConsultationData[]);
      });
      unsubscribeOrders = orderService.subscribeToAllOrders(setAllOrders);
      const unsubscribeCourses = courseService.subscribeToCourses(setCourses);
      const unsubscribeBabalawos = babalawoService.subscribeToBabalawos(setBabalawos);
      const unsubscribeVideos = videoService.subscribeToVideos(setAllVideos);
      const unsubscribeStaff = staffService.subscribeToStaff(setAllStaff);
      
      if (userProfile.role === 'super-admin') {
        unsubscribeUsers = authService.subscribeToAllUsers(setAllUsers);
      }

      return () => {
        unsubscribeConsultations();
        unsubscribeOrders();
        unsubscribeUsers();
        unsubscribeCourses();
        unsubscribeBabalawos();
        unsubscribeVideos();
        unsubscribeStaff();
      };
    }
  }, [userProfile]);

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await authService.updateUserProfile(uid, data);
      showToast("User updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update user", "error");
    }
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse?.id) {
        await courseService.updateCourse(editingCourse.id, courseForm);
        showToast("Course updated successfully", "success");
        setEditingCourse(null);
      } else {
        await courseService.createCourse(courseForm);
        showToast("Course created successfully", "success");
      }
      setCourseForm({ title: '', description: '', instructor: '', price: 0, thumbnailUrl: '' });
    } catch (error) {
      console.error(error);
      showToast("Failed to save course", "error");
    }
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons?.id) return;
    try {
      if (editingLesson?.id) {
        await courseService.updateLesson(selectedCourseForLessons.id, editingLesson.id, lessonForm);
        showToast("Lesson updated successfully", "success");
        setEditingLesson(null);
      } else {
        await courseService.addLesson(selectedCourseForLessons.id, lessonForm);
        showToast("Lesson added successfully", "success");
      }
      setLessonForm({ title: '', content: '', videoUrl: '', audioUrl: '', requiredLevel: 0, order: lessons.length + 1 });
    } catch (error) {
      console.error(error);
      showToast("Failed to save lesson", "error");
    }
  };

  const handleSubmitBabalawo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBabalawo?.id) {
        await healerService.updateHealer(editingBabalawo.id, babalawoForm);
        showToast("Babaláwo updated successfully", "success");
        setEditingBabalawo(null);
      } else {
        await healerService.createHealer(babalawoForm);
        showToast("Babaláwo added successfully", "success");
      }
      setBabalawoForm({ name: '', specialty: '', bio: '', availability: '', imageUrl: '' });
    } catch (error) {
      console.error(error);
      showToast("Failed to save babaláwo", "error");
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideo?.id) {
        await videoService.updateVideo(editingVideo.id, videoForm);
        showToast("Video updated successfully", "success");
        setEditingVideo(null);
      } else {
        await videoService.addVideo(videoForm);
        showToast("Video added successfully", "success");
      }
      setVideoForm({ title: '', description: '', youtubeId: '', thumbnailUrl: '', requiredLevel: 0 });
    } catch (error) {
      console.error(error);
      showToast("Failed to save video", "error");
    }
  };

  const handleDeleteVideo = async (id: string) => {
    showConfirm(
      "Delete Video",
      "Are you sure you want to delete this video?",
      async () => {
        try {
          await videoService.deleteVideo(id);
          showToast("Video deleted successfully", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete video", "error");
        }
      }
    );
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff?.id) {
        await staffService.updateStaff(editingStaff.id, staffForm);
        showToast("Staff updated successfully", "success");
        setEditingStaff(null);
      } else {
        await staffService.addStaff(staffForm);
        showToast("Staff added successfully", "success");
      }
      setStaffForm({ name: '', role: '', email: '', phone: '', department: '', status: 'active', profileVideoUrl: '' });
    } catch (error) {
      console.error(error);
      showToast("Failed to save staff", "error");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    showConfirm(
      "Delete Staff",
      "Are you sure you want to delete this staff member?",
      async () => {
        try {
          await staffService.deleteStaff(id);
          showToast("Staff deleted successfully", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete staff", "error");
        }
      }
    );
  };

  const handleDeleteBabalawo = async (id: string) => {
    showConfirm(
      "Delete Babaláwo",
      "Are you sure you want to delete this babaláwo?",
      async () => {
        try {
          await healerService.deleteHealer(id);
          showToast("Babaláwo deleted successfully", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete babaláwo", "error");
        }
      }
    );
  };

  const updateStatus = async (id: string, status: ConsultationStatus) => {
    try {
      await consultationService.updateStatus(id, status);
      showToast("Status updated", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update status", "error");
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(id, status);
      showToast("Order status updated", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update order status", "error");
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct?.id) {
        await productService.updateProduct(editingProduct.id, productForm);
        showToast("Product updated successfully", "success");
        setEditingProduct(null);
      } else {
        await productService.createProduct(productForm);
        showToast("Product added successfully", "success");
      }
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: 'Herbal Medicine',
        imageUrl: '',
        stock: 10,
        featured: false
      });
    } catch (error) {
      console.error(error);
      showToast("Failed to save product", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    showConfirm(
      "Delete Product",
      "Are you sure you want to delete this product?",
      async () => {
        try {
          await productService.deleteProduct(id);
          showToast("Product deleted successfully", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete product", "error");
        }
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      if (activeTab === 'products') {
        setProductForm(prev => ({ ...prev, imageUrl: url }));
      } else if (activeTab === 'healers') {
        setHealerForm(prev => ({ ...prev, imageUrl: url }));
      }
      showToast("Image uploaded successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to upload image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStaffVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadVideo(file);
      setStaffForm(prev => ({ ...prev, profileVideoUrl: url }));
      showToast("Video uploaded successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to upload video", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const menuItems = [
    { id: 'consultations', label: 'Consultations', icon: Calendar },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: Truck },
    { id: 'courses', label: 'Ilé-Àkọ́ni-lọ́gbọ́n', icon: BookOpen },
    { id: 'babalawos', label: 'Babaláwos', icon: User },
    { id: 'videos', label: 'Videos', icon: Youtube },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'faqs', label: 'FAQs', icon: MessageCircle },
    { id: 'media', label: 'Media Manager', icon: Upload },
    { id: 'accounting', label: 'Accounting', icon: CreditCard },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'theme', label: 'Theme AI', icon: Sparkles },
  ];

  const filteredMenuItems = userProfile?.role === 'super-admin'
    ? [...menuItems, { id: 'users', label: 'Users', icon: Shield }]
    : menuItems.filter(item => userProfile?.permissions?.menuAccess?.includes(item.id));

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'super-admin') {
    return <div className="p-12 text-center text-red-500 font-bold">Access Denied. Admin only.</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-gray-50/50">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-black/5 transition-all duration-300 flex flex-col sticky top-20 h-[calc(100vh-80px)] z-30`}
      >
        <div className="p-4 flex justify-between items-center border-b border-black/5">
          {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest text-forest/50">Management</span>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-forest"
          >
            <BarChart3 size={20} className={isSidebarOpen ? '' : 'rotate-90'} />
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-forest text-white shadow-lg shadow-forest/20' 
                    : 'hover:bg-forest/5 text-gray-500 hover:text-forest'
                }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <motion.div 
                    layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/5">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Exit Admin</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold serif">{menuItems.find(m => m.id === activeTab)?.label}</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your {menuItems.find(m => m.id === activeTab)?.label.toLowerCase()} and system settings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-forest/10 rounded-full flex items-center justify-center">
                <Shield size={16} className="text-forest" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-40">Access Level</div>
                <div className="text-xs font-bold text-forest uppercase">{userProfile?.role}</div>
              </div>
            </div>
          </div>
        </div>
      
      {activeTab === 'consultations' ? (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-forest" />
                Recent Consultations
              </h3>
              {selectedConsultations.length > 0 && (
                <div className="flex items-center gap-4 bg-forest/5 px-4 py-2 rounded-2xl border border-forest/10 animate-in fade-in slide-in-from-top-2">
                  <span className="text-sm font-bold text-forest">{selectedConsultations.length} Selected</span>
                  <div className="h-4 w-[1px] bg-forest/20" />
                  <select 
                    onChange={(e) => handleBulkUpdateConsultationStatus(e.target.value)}
                    className="bg-transparent text-xs font-bold text-forest outline-none cursor-pointer"
                    value=""
                  >
                    <option value="" disabled>Update Status</option>
                    {Object.values(ConsultationStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleBulkDeleteConsultations}
                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button 
                    onClick={() => setSelectedConsultations([])}
                    className="text-xs font-bold opacity-40 hover:opacity-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-forest focus:ring-forest"
                        checked={selectedConsultations.length === allConsultations.length && allConsultations.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedConsultations(allConsultations.map(c => c.id!));
                          else setSelectedConsultations([]);
                        }}
                      />
                    </th>
                    <th className="p-4 text-sm font-bold">Client</th>
                    <th className="p-4 text-sm font-bold">Type</th>
                    <th className="p-4 text-sm font-bold">Scheduled At</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allConsultations.map((c) => (
                    <tr key={c.id} className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${selectedConsultations.includes(c.id!) ? 'bg-forest/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-forest focus:ring-forest"
                          checked={selectedConsultations.includes(c.id!)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedConsultations([...selectedConsultations, c.id!]);
                            else setSelectedConsultations(selectedConsultations.filter(id => id !== c.id));
                          }}
                        />
                      </td>
                      <td className="p-4 text-sm font-mono">{c.clientUid.slice(0, 8)}...</td>
                      <td className="p-4 text-sm">{c.type}</td>
                      <td className="p-4 text-sm">{new Date(c.scheduledAt).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                          c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          c.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => updateStatus(c.id!, ConsultationStatus.CONFIRMED)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => updateStatus(c.id!, ConsultationStatus.COMPLETED)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Complete
                        </button>
                        <button 
                          onClick={() => handlePrint(c)}
                          className="p-1 text-forest hover:bg-forest/5 rounded"
                          title="Print Record"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Truck className="text-forest" />
                Manage Orders
              </h3>
              {selectedOrders.length > 0 && (
                <div className="flex items-center gap-4 bg-forest/5 px-4 py-2 rounded-2xl border border-forest/10 animate-in fade-in slide-in-from-top-2">
                  <span className="text-sm font-bold text-forest">{selectedOrders.length} Selected</span>
                  <div className="h-4 w-[1px] bg-forest/20" />
                  <select 
                    onChange={(e) => handleBulkUpdateOrderStatus(e.target.value)}
                    className="bg-transparent text-xs font-bold text-forest outline-none cursor-pointer"
                    value=""
                  >
                    <option value="" disabled>Update Status</option>
                    {Object.values(OrderStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setSelectedOrders([])}
                    className="text-xs font-bold opacity-40 hover:opacity-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-forest focus:ring-forest"
                        checked={selectedOrders.length === allOrders.length && allOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedOrders(allOrders.map(o => o.id!));
                          else setSelectedOrders([]);
                        }}
                      />
                    </th>
                    <th className="p-4 text-sm font-bold">Customer</th>
                    <th className="p-4 text-sm font-bold">Items</th>
                    <th className="p-4 text-sm font-bold">Total</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((o) => (
                    <tr key={o.id} className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${selectedOrders.includes(o.id!) ? 'bg-forest/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-forest focus:ring-forest"
                          checked={selectedOrders.includes(o.id!)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedOrders([...selectedOrders, o.id!]);
                            else setSelectedOrders(selectedOrders.filter(id => id !== o.id));
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm">{o.customerName}</div>
                        <div className="text-xs opacity-50">{o.email}</div>
                      </td>
                      <td className="p-4 text-sm">{o.items.length} items</td>
                      <td className="p-4 text-sm font-bold">{formatCurrency(o.totalAmount, currency)}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-forest/10 text-forest'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id!, e.target.value as OrderStatus)}
                          className="text-xs p-1 rounded border border-gray-200 outline-none"
                        >
                          {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : activeTab === 'babalawos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit Babalawo Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {editingBabalawo ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                  {editingBabalawo ? 'Edit Babaláwo' : 'Add New Babaláwo'}
                </h3>
                {editingBabalawo && (
                  <button 
                    onClick={() => setEditingBabalawo(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmitBabalawo} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Babaláwo Name" 
                  value={babalawoForm.name}
                  onChange={e => setBabalawoForm({...babalawoForm, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Specialty (e.g. Ifa Divination, Herbalism)" 
                  value={babalawoForm.specialty}
                  onChange={e => setBabalawoForm({...babalawoForm, specialty: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <textarea 
                  placeholder="Bio" 
                  value={babalawoForm.bio}
                  onChange={e => setBabalawoForm({...babalawoForm, bio: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  rows={4}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Availability (e.g. Mon-Fri, 9am-5pm)" 
                  value={babalawoForm.availability}
                  onChange={e => setBabalawoForm({...babalawoForm, availability: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <Upload size={14} />
                    Babaláwo Image
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-grow">
                      <input 
                        type="text" 
                        placeholder="Image URL" 
                        value={babalawoForm.imageUrl}
                        onChange={e => setBabalawoForm({...babalawoForm, imageUrl: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest pr-12"
                      />
                      {babalawoForm.imageUrl && (
                        <img 
                          src={babalawoForm.imageUrl} 
                          className="absolute right-2 top-2 w-8 h-8 rounded object-cover border border-gray-200"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <label className={`cursor-pointer p-3 rounded-xl border border-dashed border-gray-300 hover:border-forest hover:bg-forest/5 transition-all flex items-center justify-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploading ? <Loader2 className="animate-spin text-forest" /> : <Plus className="text-forest" />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className={`w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editingBabalawo ? 'Update Babaláwo' : 'Save Babaláwo'}
                </button>
              </form>
            </div>
          </div>

          {/* Babalawo List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Babaláwo</th>
                    <th className="p-4 text-sm font-bold">Specialty</th>
                    <th className="p-4 text-sm font-bold">Availability</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {babalawos.map((b) => (
                    <tr key={b.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={b.imageUrl || `https://picsum.photos/seed/${b.name}/50/50`} 
                            className="w-10 h-10 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-sm">{b.name}</div>
                            <div className="text-[10px] opacity-50 truncate max-w-[150px]">{b.bio}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{b.specialty}</td>
                      <td className="p-4 text-sm">{b.availability}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingBabalawo(b)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBabalawo(b.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'videos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit Video Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                {editingVideo ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </h3>
              <form onSubmit={handleSubmitVideo} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Video Title" 
                  value={videoForm.title}
                  onChange={e => setVideoForm({...videoForm, title: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <textarea 
                  placeholder="Description" 
                  value={videoForm.description}
                  onChange={e => setVideoForm({...videoForm, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  rows={3}
                  required
                />
                <input 
                  type="text" 
                  placeholder="YouTube Video ID (e.g., dQw4w9WgXcQ)" 
                  value={videoForm.youtubeId}
                  onChange={e => setVideoForm({...videoForm, youtubeId: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Custom Thumbnail URL (Optional)" 
                  value={videoForm.thumbnailUrl}
                  onChange={e => setVideoForm({...videoForm, thumbnailUrl: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-50">Required Access Level</label>
                  <select 
                    value={videoForm.requiredLevel}
                    onChange={e => setVideoForm({...videoForm, requiredLevel: Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest bg-white"
                  >
                    <option value={0}>Public (Everyone)</option>
                    <option value={1}>Clients (Logged In)</option>
                    <option value={2}>Admins Only</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  {editingVideo ? 'Update Video' : 'Save Video'}
                </button>
                {editingVideo && (
                  <button 
                    type="button"
                    onClick={() => setEditingVideo(null)}
                    className="w-full py-2 text-sm text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Video List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Video</th>
                    <th className="p-4 text-sm font-bold">Access</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allVideos.map((v) => (
                    <tr key={v.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/default.jpg`} 
                            className="w-16 h-10 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-sm">{v.title}</div>
                            <div className="text-xs opacity-50 line-clamp-1">{v.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          v.requiredLevel === 2 ? 'bg-red-100 text-red-600' : 
                          v.requiredLevel === 1 ? 'bg-blue-100 text-blue-600' : 
                          'bg-green-100 text-green-600'
                        }`}>
                          {v.requiredLevel === 2 ? 'Admin' : v.requiredLevel === 1 ? 'Client' : 'Public'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono">{v.youtubeId}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingVideo(v)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteVideo(v.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'staff' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit Staff Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                {editingStaff ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                {editingStaff ? 'Edit Staff' : 'Add New Staff'}
              </h3>
              <form onSubmit={handleSubmitStaff} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={staffForm.name}
                  onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Role" 
                  value={staffForm.role}
                  onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={staffForm.email}
                  onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Phone" 
                  value={staffForm.phone}
                  onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Department" 
                  value={staffForm.department}
                  onChange={e => setStaffForm({...staffForm, department: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <select 
                  value={staffForm.status}
                  onChange={e => setStaffForm({...staffForm, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <Play size={14} />
                    Profile Video
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-grow">
                      <input 
                        type="text" 
                        placeholder="Video URL" 
                        value={staffForm.profileVideoUrl}
                        onChange={e => setStaffForm({...staffForm, profileVideoUrl: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                    <label className={`cursor-pointer p-3 rounded-xl border border-dashed border-gray-300 hover:border-forest hover:bg-forest/5 transition-all flex items-center justify-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploading ? <Loader2 className="animate-spin text-forest" /> : <Upload size={18} className="text-forest" />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="video/*"
                        onChange={handleStaffVideoUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Upload a video file or paste a URL directly.</p>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff'}
                </button>
                {editingStaff && (
                  <button 
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="w-full py-2 text-sm text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Staff List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-black/5 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h4 className="font-bold">Staff Directory</h4>
                  {selectedStaff.length > 0 && (
                    <div className="flex items-center gap-2 bg-forest/10 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-forest">{selectedStaff.length} Selected</span>
                      <button 
                        onClick={handleBulkDeleteStaff}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Selected"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-black/5 outline-none focus:ring-2 focus:ring-forest bg-gray-50 text-xs"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                    />
                  </div>
                  <select 
                    className="text-xs p-2 rounded-xl border border-black/5 outline-none bg-gray-50 font-bold"
                    value={selectedStaffDepartment}
                    onChange={(e) => setSelectedStaffDepartment(e.target.value)}
                  >
                    <option value="All">All Depts</option>
                    {[...new Set(allStaff.map(s => s.department).filter(Boolean))].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select 
                    className="text-xs p-2 rounded-xl border border-black/5 outline-none bg-gray-50 font-bold"
                    value={selectedStaffStatus}
                    onChange={(e) => setSelectedStaffStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-forest focus:ring-forest"
                        checked={selectedStaff.length === allStaff.length && allStaff.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaff(allStaff.map(s => s.id!));
                          } else {
                            setSelectedStaff([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 text-sm font-bold">Staff</th>
                    <th className="p-4 text-sm font-bold">Role/Dept</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allStaff.filter(s => {
                    const matchesSearch = s.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
                                         s.role.toLowerCase().includes(staffSearch.toLowerCase()) ||
                                         s.department?.toLowerCase().includes(staffSearch.toLowerCase());
                    const matchesDept = selectedStaffDepartment === 'All' || s.department === selectedStaffDepartment;
                    const matchesStatus = selectedStaffStatus === 'All' || s.status === selectedStaffStatus;
                    return matchesSearch && matchesDept && matchesStatus;
                  }).map((s) => (
                    <tr key={s.id} className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${selectedStaff.includes(s.id!) ? 'bg-forest/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-forest focus:ring-forest"
                          checked={selectedStaff.includes(s.id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaff(prev => [...prev, s.id!]);
                            } else {
                              setSelectedStaff(prev => prev.filter(id => id !== s.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {s.profileVideoUrl ? (
                            <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest">
                              <Play size={14} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <User size={14} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm">{s.name}</div>
                            <div className="text-xs opacity-50">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold">{s.role}</div>
                        <div className="text-xs opacity-50">{s.department}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                          s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingStaff(s)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteStaff(s.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'faqs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit FAQ Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {editingFaq ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                  {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                </h3>
                {editingFaq && (
                  <button 
                    onClick={() => setEditingFaq(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmitFAQ} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Question" 
                  value={faqForm.question}
                  onChange={e => setFaqForm({...faqForm, question: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <textarea 
                  placeholder="Answer" 
                  value={faqForm.answer}
                  onChange={e => setFaqForm({...faqForm, answer: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  rows={4}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Category" 
                    value={faqForm.category}
                    onChange={e => setFaqForm({...faqForm, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  />
                  <input 
                    type="number" 
                    placeholder="Order" 
                    value={faqForm.order}
                    onChange={e => setFaqForm({...faqForm, order: parseInt(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={faqForm.isPublished}
                    onChange={e => setFaqForm({...faqForm, isPublished: e.target.checked})}
                    className="w-4 h-4 text-forest focus:ring-forest border-gray-300 rounded"
                  />
                  <span className="text-sm font-bold text-gray-600">Published</span>
                </label>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  {editingFaq ? 'Update FAQ' : 'Save FAQ'}
                </button>
              </form>
            </div>
          </div>

          {/* FAQ List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h4 className="font-bold">FAQs</h4>
                  {selectedFaqs.length > 0 && (
                    <div className="flex items-center gap-2 bg-forest/10 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-forest">{selectedFaqs.length} Selected</span>
                      <button 
                        onClick={handleBulkDeleteFaqs}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Selected"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleBulkUpdateFaqStatus(true)}
                        className="p-1 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                        title="Publish Selected"
                      >
                        <Upload size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={async () => {
                    showConfirm(
                      "Seed FAQs",
                      "This will add 50 initial FAQs if they don't exist. Continue?",
                      async () => {
                        await seedService.seedFaqs();
                        showToast("Seeding complete!", "success");
                      }
                    );
                  }}
                  className="text-[10px] bg-gold/10 text-gold px-2 py-1 rounded-lg font-bold hover:bg-gold/20 transition-all"
                >
                  Seed 50 FAQs
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-forest focus:ring-forest"
                        checked={selectedFaqs.length === faqs.length && faqs.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFaqs(faqs.map(f => f.id!));
                          } else {
                            setSelectedFaqs([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 text-sm font-bold">Question</th>
                    <th className="p-4 text-sm font-bold">Category</th>
                    <th className="p-4 text-sm font-bold">Order</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((f) => (
                    <tr key={f.id} className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${selectedFaqs.includes(f.id!) ? 'bg-forest/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-forest focus:ring-forest"
                          checked={selectedFaqs.includes(f.id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFaqs(prev => [...prev, f.id!]);
                            } else {
                              setSelectedFaqs(prev => prev.filter(id => id !== f.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4 text-sm font-bold">{f.question}</td>
                      <td className="p-4 text-sm">{f.category}</td>
                      <td className="p-4 text-sm">{f.order}</td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                          f.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {f.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingFaq(f)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFAQ(f.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'media' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold serif">Media Manager</h3>
            <label className="bg-forest text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all cursor-pointer flex items-center gap-2">
              <Upload size={20} />
              Upload Media
              <input type="file" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const url = file.type.startsWith('video/') ? await uploadVideo(file) : await uploadImage(file);
                  setMediaFiles(prev => [...prev, { url, type: file.type.startsWith('video/') ? 'video' : 'image', name: file.name }]);
                  showToast("Media uploaded successfully!", "success");
                } catch (error) {
                  console.error(error);
                  showToast("Failed to upload media", "error");
                } finally {
                  setIsUploading(false);
                }
              }} />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaFiles.map((file, idx) => (
              <div key={idx} className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-black/5">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/10">
                    <Play className="text-forest" size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(file.url);
                      showToast("URL copied to clipboard!", "success");
                    }}
                    className="p-2 bg-white text-forest rounded-full hover:scale-110 transition-transform"
                    title="Copy URL"
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="p-2 bg-white text-red-500 rounded-full hover:scale-110 transition-transform"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[10px] truncate">
                  {file.name}
                </div>
              </div>
            ))}
            {mediaFiles.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                No media files uploaded yet.
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'accounting' ? (
        <div className="space-y-8">
          {/* Accounting Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
              <h4 className="text-2xl font-bold text-forest">
                {formatCurrency(
                  allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0) +
                  allConsultations.reduce((sum, c) => sum + (c.status === 'completed' ? CONSULTATION_PRICE : 0), 0),
                  currency
                )}
              </h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Store Revenue</p>
              <h4 className="text-2xl font-bold text-forest">
                {formatCurrency(allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0), currency)}
              </h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Consultation Revenue</p>
              <h4 className="text-2xl font-bold text-forest">
                {formatCurrency(allConsultations.reduce((sum, c) => sum + (c.status === 'completed' ? CONSULTATION_PRICE : 0), 0), currency)}
              </h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Orders Value</p>
              <h4 className="text-2xl font-bold text-gold">
                {formatCurrency(allOrders.reduce((sum, o) => sum + (o.status === 'pending' ? o.totalAmount : 0), 0), currency)}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="text-forest" />
                Recent Transactions
              </h3>
              <div className="space-y-4">
                {[...allOrders, ...allConsultations]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-black/5 last:border-0">
                      <div>
                        <p className="text-sm font-bold">{'items' in t ? 'Store Order' : 'Consultation'}</p>
                        <p className="text-xs opacity-50">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-forest">
                          {formatCurrency(('totalAmount' in t ? t.totalAmount : CONSULTATION_PRICE), currency)}
                        </p>
                        <p className={`text-[10px] font-bold uppercase ${
                          t.status === 'cancelled' ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {t.status}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <LayoutDashboard className="text-forest" />
                Revenue Breakdown
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Store Products</span>
                    <span className="font-bold">{formatCurrency(allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0), currency)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-forest" 
                      style={{ width: `${(allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0) / (allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0) + allConsultations.reduce((sum, c) => sum + (c.status === 'completed' ? CONSULTATION_PRICE : 0), 0)) * 100) || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Consultations</span>
                    <span className="font-bold">{formatCurrency(allConsultations.reduce((sum, c) => sum + (c.status === 'completed' ? CONSULTATION_PRICE : 0), 0), currency)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold" 
                      style={{ width: `${(allConsultations.reduce((sum, c) => sum + (c.status === 'completed' ? CONSULTATION_PRICE : 0), 0) / (allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0) + allConsultations.reduce((sum, c) => sum + (c.status === 'completed' ? CONSULTATION_PRICE : 0), 0)) * 100) || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'pages' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold serif">Page Management</h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsVisualEditor(!isVisualEditor)}
                className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  isVisualEditor ? 'bg-forest text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <LayoutDashboard size={18} />
                {isVisualEditor ? 'Visual Editor' : 'Code Editor'}
              </button>
              <button 
                onClick={() => {
                  setPageForm({ title: '', slug: '', content: '', isPublished: false });
                  setEditingPage(null);
                  setIsPageModalOpen(true);
                }}
                className="bg-forest text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                New Page
              </button>
            </div>
          </div>

          {isVisualEditor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map(page => (
                <div key={page.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-forest/5 text-forest rounded-2xl">
                      <FileText size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingPage(page);
                          setPageForm({ title: page.title, slug: page.slug, content: page.content, isPublished: page.isPublished });
                          setIsPageModalOpen(true);
                        }}
                        className="p-2 text-forest hover:bg-forest/5 rounded-full"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeletePage(page.id!)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-1">{page.title}</h4>
                  <p className="text-xs text-gray-400 mb-4">/{page.slug}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      page.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button className="text-forest text-sm font-bold hover:underline">Preview</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-black/5">
                  <tr>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-400">Page Title</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-400">Slug</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {pages.map(page => (
                    <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold">{page.title}</td>
                      <td className="p-4 text-gray-500">/{page.slug}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          page.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {page.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingPage(page);
                              setPageForm({ title: page.title, slug: page.slug, content: page.content, isPublished: page.isPublished });
                              setIsPageModalOpen(true);
                            }}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeletePage(page.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'theme' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold serif">Theme Settings</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-forest/40" size={16} />
                <input 
                  type="text" 
                  placeholder="Describe a theme..." 
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/5 outline-none focus:ring-2 focus:ring-forest bg-white text-sm"
                  value={themePrompt}
                  onChange={(e) => setThemePrompt(e.target.value)}
                />
              </div>
              <button 
                onClick={handleGenerateTheme}
                disabled={isGeneratingTheme || !themePrompt}
                className="bg-forest text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingTheme ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                AI Generate
              </button>
              <button 
                onClick={handleSaveTheme}
                className="bg-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                Save Theme
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {themes.map(theme => (
              <div 
                key={theme.id} 
                onClick={() => setCurrentTheme(theme)}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  currentTheme.id === theme.id ? 'border-forest shadow-xl' : 'border-black/5 hover:border-forest/30'
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold">{theme.name}</h4>
                  {currentTheme.id === theme.id && (
                    <div className="bg-forest text-white p-1 rounded-full">
                      <Shield size={12} />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: theme.options.primaryColor }} />
                    <span className="text-xs font-medium text-gray-500">Primary</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: theme.options.accentColor }} />
                    <span className="text-xs font-medium text-gray-500">Accent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-black/5" style={{ backgroundColor: theme.options.secondaryColor }} />
                    <span className="text-xs font-medium text-gray-500">Background</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-black/5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Font: {theme.options.fontFamily.split(',')[0]}</span>
                    <span>Radius: {theme.options.borderRadius}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h4 className="text-lg font-bold mb-6">Custom Theme Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Primary Color</label>
                <input 
                  type="color" 
                  value={currentTheme.options.primaryColor}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, primaryColor: e.target.value } }))}
                  className="w-full h-12 rounded-xl border-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Accent Color</label>
                <input 
                  type="color" 
                  value={currentTheme.options.accentColor}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, accentColor: e.target.value } }))}
                  className="w-full h-12 rounded-xl border-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Secondary Color</label>
                <input 
                  type="color" 
                  value={currentTheme.options.secondaryColor}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, secondaryColor: e.target.value } }))}
                  className="w-full h-12 rounded-xl border-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Background Color</label>
                <input 
                  type="color" 
                  value={currentTheme.options.backgroundColor}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, backgroundColor: e.target.value } }))}
                  className="w-full h-12 rounded-xl border-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Text Color</label>
                <input 
                  type="color" 
                  value={currentTheme.options.textColor}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, textColor: e.target.value } }))}
                  className="w-full h-12 rounded-xl border-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Font Family</label>
                <select 
                  value={currentTheme.options.fontFamily}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, fontFamily: e.target.value } }))}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-forest"
                >
                  <option value="Inter, sans-serif">Inter (Sans)</option>
                  <option value="'Cormorant Garamond', serif">Cormorant Garamond (Serif)</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Glass Opacity</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={currentTheme.options.glassOpacity}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, glassOpacity: e.target.value } }))}
                  className="w-full h-12 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Border Radius</label>
                <select 
                  value={currentTheme.options.borderRadius}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, borderRadius: e.target.value } }))}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-forest"
                >
                  <option value="0">None</option>
                  <option value="0.25rem">Small</option>
                  <option value="0.75rem">Medium</option>
                  <option value="1.5rem">Large</option>
                  <option value="3rem">Full</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Sidebar Style</label>
                <select 
                  value={currentTheme.options.sidebarStyle}
                  onChange={(e) => setCurrentTheme(prev => ({ ...prev, options: { ...prev.options, sidebarStyle: e.target.value as 'light' | 'dark' | 'glass' } }))}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-forest"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="glass">Glass</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <User className="text-forest" />
                Manage Users & Access
              </h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/5 outline-none focus:ring-2 focus:ring-forest bg-white"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <section className="mb-12">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Pre-register User Profile</h4>
              <form onSubmit={handleCreateUserProfile} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase mb-2 opacity-50">Email</label>
                  <input 
                    type="email" 
                    placeholder="user@example.com" 
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    required
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2 opacity-50">Display Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    required
                    value={newUserForm.displayName}
                    onChange={e => setNewUserForm({...newUserForm, displayName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2 opacity-50">Role</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest bg-white"
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  Create Profile
                </button>
              </form>
            </section>

            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">User</th>
                    <th className="p-4 text-sm font-bold">Role</th>
                    <th className="p-4 text-sm font-bold">Admin Level</th>
                    <th className="p-4 text-sm font-bold">Premium Access</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest text-xs font-bold">
                              {u.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm">{u.displayName}</div>
                            <div className="text-xs opacity-50">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as UserRole })}
                          className="text-xs p-2 rounded-lg border border-gray-200 outline-none bg-white"
                          disabled={u.uid === user?.uid}
                        >
                          <option value="client">Client</option>
                          <option value="admin">Admin</option>
                          <option value="super-admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1" 
                            max="5"
                            value={u.adminLevel || ''}
                            onChange={(e) => handleUpdateUser(u.uid, { adminLevel: Number(e.target.value) })}
                            className="w-16 text-xs p-2 rounded-lg border border-gray-200 outline-none"
                            placeholder="Level"
                          />
                          <input 
                            type="text" 
                            value={u.adminCategory || ''}
                            onChange={(e) => handleUpdateUser(u.uid, { adminCategory: e.target.value })}
                            className="text-xs p-2 rounded-lg border border-gray-200 outline-none"
                            placeholder="Category"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={u.hasPremiumAccess || false}
                            onChange={(e) => handleUpdateUser(u.uid, { hasPremiumAccess: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
                          <span className="ml-3 text-xs font-medium text-gray-500">
                            {u.hasPremiumAccess ? 'Granted' : 'Revoked'}
                          </span>
                        </label>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedUserForPermissions(u)}
                            className="p-2 text-gold hover:bg-gold/5 rounded-full transition-colors"
                            title="Manage Permissions"
                          >
                            <Shield size={18} />
                          </button>
                          <button 
                            onClick={() => setSelectedUserForDetails(u)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full transition-colors"
                            title="View Details"
                          >
                            <User size={18} />
                          </button>
                          <button 
                            onClick={() => setUserToDelete(u.uid)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete User Profile"
                            disabled={u.uid === user?.uid}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* User Permissions Modal */}
          {selectedUserForPermissions && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setSelectedUserForPermissions(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Shield className="text-forest" />
                  Manage Permissions
                </h3>
                <p className="text-sm text-gray-500 mb-8">User: <span className="font-bold text-black">{selectedUserForPermissions.displayName}</span> ({selectedUserForPermissions.role})</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Menu Access</h4>
                    <div className="space-y-2">
                      {menuItems.map(item => (
                        <label key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <item.icon size={16} className="text-forest" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-forest focus:ring-forest border-gray-300 rounded"
                            checked={selectedUserForPermissions.permissions?.menuAccess?.includes(item.id) || selectedUserForPermissions.role === 'super-admin'}
                            disabled={selectedUserForPermissions.role === 'super-admin'}
                            onChange={() => toggleMenuAccess(selectedUserForPermissions.uid, item.id)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Content Access</h4>
                    <div className="space-y-2">
                      {['products', 'consultations', 'orders', 'faqs', 'staff', 'academy', 'accounting'].map(type => (
                        <label key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <span className="text-sm font-medium capitalize">{type}</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-forest focus:ring-forest border-gray-300 rounded"
                            checked={selectedUserForPermissions.permissions?.contentAccess?.includes(type) || selectedUserForPermissions.role === 'super-admin'}
                            disabled={selectedUserForPermissions.role === 'super-admin'}
                            onChange={() => toggleContentAccess(selectedUserForPermissions.uid, type)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserForPermissions(null)}
                  className="w-full mt-8 py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  Save & Close
                </button>
              </motion.div>
            </div>
          )}

          {/* User Details Modal */}
          {selectedUserForDetails && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setSelectedUserForDetails(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-forest" />
                  User Profile Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">UID</span>
                    <span className="text-sm font-mono">{selectedUserForDetails.uid}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Email</span>
                    <span className="text-sm">{selectedUserForDetails.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Display Name</span>
                    <span className="text-sm">{selectedUserForDetails.displayName}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Role</span>
                    <span className="text-sm capitalize">{selectedUserForDetails.role}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Admin Level</span>
                    <span className="text-sm">{selectedUserForDetails.adminLevel || 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Premium Access</span>
                    <span className="text-sm">{selectedUserForDetails.hasPremiumAccess ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Created At</span>
                    <span className="text-sm">
                      {selectedUserForDetails.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserForDetails(null)}
                  className="w-full mt-8 py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {userToDelete && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-4 text-red-600">Delete User Profile?</h3>
                <p className="text-gray-600 mb-8">
                  Are you sure you want to delete this user profile? This action cannot be undone. 
                  Note: This only deletes the profile data from Firestore, not their authentication account.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (userToDelete === user?.uid) {
                        showToast("You cannot delete yourself.", "error");
                        setUserToDelete(null);
                        return;
                      }
                      try {
                        await authService.deleteUserProfile(userToDelete);
                        showToast("User profile deleted successfully", "success");
                        setUserToDelete(null);
                      } catch (error) {
                        console.error(error);
                        showToast("Failed to delete user profile", "error");
                      }
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      ) : activeTab === 'courses' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit Course Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                {editingCourse ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <form onSubmit={handleSubmitCourse} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Course Title" 
                  value={courseForm.title}
                  onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <textarea 
                  placeholder="Description" 
                  value={courseForm.description}
                  onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  rows={3}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Instructor Name" 
                  value={courseForm.instructor}
                  onChange={e => setCourseForm({...courseForm, instructor: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="number" 
                  placeholder={`Price (${CURRENCIES[currency].symbol})`} 
                  value={courseForm.price || ''}
                  onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Category" 
                  value={courseForm.category}
                  onChange={e => setCourseForm({...courseForm, category: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                />
                <input 
                  type="text" 
                  placeholder="Thumbnail URL" 
                  value={courseForm.thumbnailUrl}
                  onChange={e => setCourseForm({...courseForm, thumbnailUrl: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                />
                <button 
                  type="submit" 
                  className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  {editingCourse ? 'Update Course' : 'Save Course'}
                </button>
                {editingCourse && (
                  <button 
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="w-full py-2 text-sm text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>

              {selectedCourseForLessons && (
                <div className="mt-12 pt-8 border-t border-black/5">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BookOpen className="text-forest" />
                    Manage Lessons
                  </h3>
                  <form onSubmit={handleSubmitLesson} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Lesson Title" 
                      value={lessonForm.title}
                      onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                      required
                    />
                    <textarea 
                      placeholder="Content" 
                      value={lessonForm.content}
                      onChange={e => setLessonForm({...lessonForm, content: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                      rows={3}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Video URL (Embed)" 
                      value={lessonForm.videoUrl}
                      onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    />
                    <input 
                      type="text" 
                      placeholder="Audio URL (Direct link to .mp3, .wav, etc.)" 
                      value={lessonForm.audioUrl}
                      onChange={e => setLessonForm({...lessonForm, audioUrl: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    />
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-50">Required Access Level</label>
                      <select 
                        value={lessonForm.requiredLevel}
                        onChange={e => setLessonForm({...lessonForm, requiredLevel: Number(e.target.value)})}
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest bg-white"
                      >
                        <option value={0}>Public (Everyone)</option>
                        <option value={1}>Clients (Logged In)</option>
                        <option value={2}>Admins Only</option>
                      </select>
                    </div>
                    <input 
                      type="number" 
                      placeholder="Order" 
                      value={lessonForm.order}
                      onChange={e => setLessonForm({...lessonForm, order: Number(e.target.value)})}
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                      required
                    />
                    <button 
                      type="submit" 
                      className="w-full py-3 bg-gold text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                    >
                      {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                    </button>
                    {editingLesson && (
                      <button 
                        type="button"
                        onClick={() => setEditingLesson(null)}
                        className="w-full py-2 text-sm text-red-500 hover:underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Course & Lesson List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Course</th>
                    <th className="p-4 text-sm font-bold">Instructor</th>
                    <th className="p-4 text-sm font-bold">Price</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${selectedCourseForLessons?.id === c.id ? 'bg-forest/5' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-sm">{c.title}</div>
                        <div className="text-xs opacity-50 truncate max-w-[200px]">{c.description}</div>
                      </td>
                      <td className="p-4 text-sm">{c.instructor}</td>
                      <td className="p-4 text-sm font-bold">{formatCurrency(c.price, currency)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedCourseForLessons(c)}
                            className="p-2 text-gold hover:bg-gold/5 rounded-full"
                            title="Manage Lessons"
                          >
                            <BookOpen size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingCourse(c)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => courseService.deleteCourse(c.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCourseForLessons && (
              <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-black/5 font-bold text-sm">
                  Lessons for: {selectedCourseForLessons.title}
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-black/5">
                      <th className="p-4 text-sm font-bold">Order</th>
                      <th className="p-4 text-sm font-bold">Title</th>
                      <th className="p-4 text-sm font-bold">Access</th>
                      <th className="p-4 text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l) => (
                      <tr key={l.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm">{l.order}</td>
                        <td className="p-4 text-sm font-bold">{l.title}</td>
                        <td className="p-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            l.requiredLevel === 2 ? 'bg-red-100 text-red-600' : 
                            l.requiredLevel === 1 ? 'bg-blue-100 text-blue-600' : 
                            'bg-green-100 text-green-600'
                          }`}>
                            {l.requiredLevel === 2 ? 'Admin' : l.requiredLevel === 1 ? 'Client' : 'Public'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingLesson(l)}
                              className="p-2 text-forest hover:bg-forest/5 rounded-full"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => courseService.deleteLesson(selectedCourseForLessons.id!, l.id!)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit Product Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {editingProduct ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <div className="flex gap-2">
                  {!editingProduct && (
                    <button 
                      onClick={async () => {
                        showConfirm(
                          "Seed Products",
                          "This will add Jagunlabi Bitters and other initial products if they don't exist. Continue?",
                          async () => {
                            await seedService.seedProducts();
                            showToast("Seeding complete!", "success");
                          }
                        );
                      }}
                      className="text-[10px] bg-gold/10 text-gold px-2 py-1 rounded-lg font-bold hover:bg-gold/20 transition-all"
                    >
                      Seed Initial Data
                    </button>
                  )}
                  {editingProduct && (
                    <button 
                      onClick={() => setEditingProduct(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Product Name" 
                  value={productForm.name}
                  onChange={e => setProductForm({...productForm, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <textarea 
                  placeholder="Description" 
                  value={productForm.description}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  rows={3}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder={`Price (${CURRENCIES[currency].symbol})`} 
                    value={productForm.price || ''}
                    onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Stock" 
                    value={productForm.stock || ''}
                    onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    required
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Category" 
                  value={productForm.category}
                  onChange={e => setProductForm({...productForm, category: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <Upload size={14} />
                    Product Image
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-grow">
                      <input 
                        type="text" 
                        placeholder="Image URL" 
                        value={productForm.imageUrl}
                        onChange={e => setProductForm({...productForm, imageUrl: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest pr-12"
                      />
                      {productForm.imageUrl && (
                        <img 
                          src={productForm.imageUrl} 
                          className="absolute right-2 top-2 w-8 h-8 rounded object-cover border border-gray-200"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <label className={`cursor-pointer p-3 rounded-xl border border-dashed border-gray-300 hover:border-forest hover:bg-forest/5 transition-all flex items-center justify-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploading ? <Loader2 className="animate-spin text-forest" /> : <Plus className="text-forest" />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Upload a file or paste a URL directly.</p>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="featured"
                    checked={productForm.featured}
                    onChange={e => setProductForm({...productForm, featured: e.target.checked})}
                    className="w-4 h-4 text-forest focus:ring-forest border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="text-sm font-bold text-gray-700 cursor-pointer">
                    Featured Product
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className={`w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </form>
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h4 className="font-bold">Products</h4>
                  {selectedProducts.length > 0 && (
                    <div className="flex items-center gap-2 bg-forest/10 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-forest">{selectedProducts.length} Selected</span>
                      <button 
                        onClick={handleBulkDeleteProducts}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Selected"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-forest focus:ring-forest"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(products.map(p => p.id!));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 text-sm font-bold">Product</th>
                    <th className="p-4 text-sm font-bold">Price</th>
                    <th className="p-4 text-sm font-bold">Stock</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${selectedProducts.includes(p.id!) ? 'bg-forest/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-forest focus:ring-forest"
                          checked={selectedProducts.includes(p.id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, p.id!]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== p.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.imageUrl || `https://picsum.photos/seed/${p.name}/50/50`} 
                            className="w-10 h-10 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                              {p.name}
                              {p.featured && <Star size={12} className="text-gold fill-gold" />}
                            </div>
                            <div className="text-xs opacity-50">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold">{formatCurrency(p.price, currency)}</td>
                      <td className="p-4 text-sm">{p.stock}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingProduct(p)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMoreProducts && (
                <div className="p-4 border-t border-black/5 flex justify-center">
                  <button 
                    onClick={() => fetchAdminProducts()}
                    disabled={isLoadingProducts}
                    className="text-xs font-bold text-forest hover:underline flex items-center gap-2"
                  >
                    {isLoadingProducts ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    Load More Products
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Area */}
      {printingConsultation && <PrintableConsultation consultation={printingConsultation} />}
      </div>
    </div>
  );
};

const Training = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [view, setView] = useState<'catalog' | 'my-training'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(courses.map(c => c.category || 'General'))];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubscribeCourses = courseService.subscribeToCourses(setCourses);
    
    let unsubscribeEnrollments = () => {};
    if (auth.currentUser) {
      unsubscribeEnrollments = courseService.subscribeToEnrollments(auth.currentUser.uid, setEnrollments);
    }

    return () => {
      unsubscribeAuth();
      unsubscribeCourses();
      unsubscribeEnrollments();
    };
  }, [user]);

  useEffect(() => {
    if (selectedCourse?.id) {
      const unsubscribeLessons = courseService.subscribeToLessons(selectedCourse.id, setLessons);
      
      let unsubscribeCompletions = () => {};
      if (user) {
        unsubscribeCompletions = courseService.subscribeToCompletions(user.uid, selectedCourse.id, setCompletions);
      }

      return () => {
        unsubscribeLessons();
        unsubscribeCompletions();
      };
    }
  }, [selectedCourse, user]);

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.courseId === courseId);
  };

  const isLessonCompleted = (lessonId: string) => {
    return completions.includes(lessonId);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      showToast("Please login to enroll in courses.", "error");
      return;
    }
    setIsEnrolling(true);
    try {
      await courseService.enrollInCourse(user.uid, courseId);
      showToast("Successfully enrolled!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to enroll.", "error");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!user || !selectedCourse) return;
    try {
      await courseService.completeLesson(user.uid, selectedCourse.id!, lessonId);
    } catch (error) {
      console.error(error);
    }
  };

  if (activeLesson) {
    const completed = isLessonCompleted(activeLesson.id!);
    const userLevel = userProfile?.role === 'super-admin' || userProfile?.role === 'admin' ? 2 : userProfile ? 1 : 0;
    const hasAccess = (activeLesson.requiredLevel || 0) <= userLevel;

    return (
      <div className="max-w-6xl mx-auto p-8">
        <button 
          onClick={() => setActiveLesson(null)}
          className="mb-6 flex items-center gap-2 text-forest font-bold hover:underline"
        >
          <X size={18} /> Back to Lessons
        </button>
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
          {activeLesson.videoUrl && (
            <div className="aspect-video bg-black relative">
              {hasAccess ? (
                <ReactPlayer 
                  url={activeLesson.videoUrl} 
                  width="100%"
                  height="100%"
                  controls
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload'
                      }
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 p-8 text-center">
                  <X size={48} className="mb-4 text-red-500" />
                  <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                  <p className="opacity-60 max-w-md">This lesson requires a higher access level. Please contact support if you believe this is an error.</p>
                </div>
              )}
            </div>
          )}
          {activeLesson.audioUrl && (
            <div className="p-8 bg-gray-50 border-b border-black/5">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Music size={16} /> Audio Lesson
              </h4>
              {hasAccess ? (
                <audio controls className="w-full">
                  <source src={activeLesson.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                  <Lock size={16} /> Audio content is restricted.
                </div>
              )}
            </div>
          )}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{activeLesson.title}</h1>
                <p className="opacity-60">Lesson Content</p>
              </div>
              <button 
                onClick={() => handleCompleteLesson(activeLesson.id!)}
                disabled={completed}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  completed 
                    ? 'bg-green-100 text-green-700 cursor-default' 
                    : 'bg-forest text-white hover:bg-opacity-90'
                }`}
              >
                {completed ? (
                  <>
                    <Sparkles size={18} />
                    Completed
                  </>
                ) : (
                  "Mark as Completed"
                )}
              </button>
            </div>
            <div className="prose max-w-none opacity-80 whitespace-pre-wrap">
              {activeLesson.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    const enrolled = isEnrolled(selectedCourse.id!);
    const progress = lessons.length > 0 ? (completions.length / lessons.length) * 100 : 0;

    return (
      <div className="max-w-6xl mx-auto p-8">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="mb-6 flex items-center gap-2 text-forest font-bold hover:underline"
        >
          <X size={18} /> Back to Courses
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden sticky top-24">
              <img 
                src={selectedCourse.thumbnailUrl || `https://picsum.photos/seed/${selectedCourse.title}/400/300`} 
                className="w-full aspect-video object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">{selectedCourse.title}</h1>
                <p className="text-sm opacity-60 mb-4">Instructor: {selectedCourse.instructor}</p>
                <p className="text-sm opacity-80 mb-6">{selectedCourse.description}</p>
                
                {enrolled && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span>Course Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-forest transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!enrolled ? (
                  <button 
                    onClick={() => handleEnroll(selectedCourse.id!)}
                    disabled={isEnrolling}
                    className="w-full py-3 bg-gold text-white rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    {isEnrolling ? "Enrolling..." : "Enroll in Course"}
                  </button>
                ) : (
                  <div className="p-3 bg-forest/10 text-forest rounded-xl text-center font-bold text-sm">
                    You are enrolled
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Course Lessons</h2>
            <div className="space-y-4">
              {!enrolled ? (
                <div className="p-12 bg-white rounded-3xl border border-black/5 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gold opacity-20" />
                  <h3 className="text-xl font-bold mb-2">Lessons are Locked</h3>
                  <p className="opacity-60 mb-6">Enroll in this course to access all lessons and spiritual wisdom.</p>
                  {!user && <div className="flex justify-center"><Auth /></div>}
                </div>
              ) : lessons.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-black/5 text-center opacity-50 italic">
                  No lessons available for this course yet.
                </div>
              ) : (
                lessons.map((lesson, idx) => {
                  const completed = isLessonCompleted(lesson.id!);
                  const userLevel = userProfile?.role === 'super-admin' || userProfile?.role === 'admin' ? 2 : userProfile ? 1 : 0;
                  const hasAccess = (lesson.requiredLevel || 0) <= userLevel;

                  return (
                    <button 
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full flex items-center gap-4 p-6 bg-white rounded-2xl border border-black/5 hover:border-gold hover:shadow-md transition-all text-left group ${!hasAccess ? 'opacity-75' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                        completed ? 'bg-green-100 text-green-700' : !hasAccess ? 'bg-gray-100 text-gray-400' : 'bg-forest/10 text-forest'
                      }`}>
                        {completed ? <Sparkles size={18} /> : !hasAccess ? <Lock size={16} /> : idx + 1}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold group-hover:text-gold transition-colors">{lesson.title}</h3>
                        <p className="text-xs opacity-50">Lesson {idx + 1} {lesson.requiredLevel && lesson.requiredLevel > 0 && `• ${lesson.requiredLevel === 2 ? 'Admin' : 'Client'} Only`}</p>
                      </div>
                      {completed && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Completed</span>}
                      {!hasAccess && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locked</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayedCourses = (view === 'catalog' 
    ? courses 
    : courses.filter(c => isEnrolled(c.id!))
  ).filter(c => selectedCategory === 'All' || c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-paper">
      <section className="relative py-24 bg-[#0a0502] text-white overflow-hidden">
        <div className="absolute inset-0 atmosphere opacity-50" />
        <div className="absolute inset-0 leaf-overlay opacity-5" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-6"
          >
            <BookOpen className="text-gold w-12 h-12" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-light serif mb-6 tracking-tight">Ancient Wisdom Ilé-Àkọ́ni-lọ́gbọ́n</h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Learn the sacred arts of Ifa, traditional herbalism, and spiritual healing from master practitioners.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto p-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-black/5 shadow-sm">
            <button 
              onClick={() => setView('catalog')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${view === 'catalog' ? 'bg-forest shadow-lg shadow-forest/20 text-white' : 'text-earth/60 hover:text-earth'}`}
            >
              Course Catalog
            </button>
            {user && (
              <button 
                onClick={() => setView('my-training')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${view === 'my-training' ? 'bg-forest shadow-lg shadow-forest/20 text-white' : 'text-earth/60 hover:text-earth'}`}
              >
                My Ilé-Àkọ́ni-lọ́gbọ́n ({enrollments.length})
              </button>
            )}
          </div>

          {view === 'catalog' && (
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-gold text-white shadow-lg' 
                      : 'bg-white text-earth/60 border border-black/5 hover:border-gold'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          
          {user && view === 'my-training' && (
            <div className="flex items-center gap-3 px-6 py-3 bg-gold/10 rounded-2xl border border-gold/20">
              <Sparkles className="text-gold w-5 h-5" />
              <span className="text-sm font-bold text-gold uppercase tracking-widest">Student of Wisdom</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {displayedCourses.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-black/5 border-dashed spiritual-glow">
              <BookOpen className="w-20 h-20 mx-auto mb-6 text-gray-200" />
              <p className="opacity-50 italic text-xl font-light serif">
                {view === 'catalog' ? "The scrolls are being prepared. Check back soon." : "Your spiritual journey is waiting to begin."}
              </p>
              {view === 'my-training' && (
                <button 
                  onClick={() => setView('catalog')}
                  className="mt-8 px-8 py-4 bg-forest text-white rounded-2xl font-bold hover:bg-gold hover:text-black transition-all duration-500 shadow-xl shadow-forest/10"
                >
                  Browse Catalog
                </button>
              )}
            </div>
          ) : (
            displayedCourses.map(course => (
              <motion.div 
                key={course.id}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer group spiritual-glow"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src={course.thumbnailUrl || `https://picsum.photos/seed/${course.title}/400/300`} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-forest shadow-xl">
                      {course.instructor}
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 serif group-hover:text-forest transition-colors duration-300">{course.title}</h3>
                  <p className="text-sm opacity-60 mb-8 line-clamp-2 leading-relaxed font-light">{course.description}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-black/5">
                    <div className="flex items-center gap-2 text-forest font-bold">
                      <PlayCircle size={18} />
                      <span className="text-xs uppercase tracking-widest">Start Learning</span>
                    </div>
                    {isEnrolled(course.id!) && (
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        <Check className="text-green-600 w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PrintableConsultation = ({ consultation }: { consultation: ConsultationData }) => {
  return (
    <div id="printable-area" className="hidden print:block font-serif">
      <div className="text-center border-b-2 border-forest pb-6 mb-8">
        <h1 className="text-4xl font-bold text-forest uppercase tracking-widest mb-2">OBA ELA TRADO</h1>
        <p className="text-sm italic opacity-70">Traditional African Healing & Spiritual Guidance</p>
        <div className="mt-4 text-xs opacity-50">
          <p>Lagos, Nigeria | +234 800 000 0000</p>
          <p>www.oba-ela-trado.com</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <div>
            <h2 className="text-xl font-bold text-forest">{consultation.type}</h2>
            <p className="text-sm opacity-60">Record ID: {consultation.id}</p>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase text-xs tracking-wider px-3 py-1 bg-forest/10 rounded-full inline-block">
              {consultation.status}
            </p>
            <p className="text-sm mt-1">{new Date(consultation.scheduledAt).toLocaleString()}</p>
          </div>
        </div>

        <section>
          <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-forest">Client Intentions / Questions</h3>
          <div className="bg-white p-4 rounded border border-gray-100 italic text-gray-700 leading-relaxed">
            "{consultation.questions}"
          </div>
        </section>

        {consultation.results && (
          <section>
            <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-forest">Consultation Result / Guidance</h3>
            <div className="bg-white p-6 rounded border border-gray-100 text-gray-800 leading-relaxed whitespace-pre-wrap">
              {consultation.results}
            </div>
          </section>
        )}

        <div className="mt-20 pt-10 border-t border-gray-200 grid grid-cols-2 gap-10">
          <div className="text-center">
            <div className="w-40 h-px bg-gray-400 mx-auto mb-2"></div>
            <p className="text-xs uppercase font-bold opacity-50">Babalawo's Signature</p>
          </div>
          <div className="text-center">
            <div className="w-40 h-px bg-gray-400 mx-auto mb-2"></div>
            <p className="text-xs uppercase font-bold opacity-50">Date of Record</p>
            <p className="text-[10px] opacity-40">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-[10px] opacity-30 italic">
        This is an official spiritual record from Oba Ela Trado. All information is confidential.
      </div>
    </div>
  );
};

const Consultation = () => {
  const { showToast } = useToast();
  const [type, setType] = useState<ConsultationType>(ConsultationType.IFA_DIVINATION);
  const [scheduledAt, setScheduledAt] = useState('');
  const [questions, setQuestions] = useState('');
  const [bookings, setBookings] = useState<ConsultationData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [printingConsultation, setPrintingConsultation] = useState<ConsultationData | null>(null);

  const handlePrint = (consultation: ConsultationData) => {
    setPrintingConsultation(consultation);
    setTimeout(() => {
      window.print();
      setPrintingConsultation(null);
    }, 100);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    
    let unsubscribeConsultations = () => {};
    if (auth.currentUser) {
      unsubscribeConsultations = consultationService.subscribeToUserConsultations(setBookings);
    }

    return () => {
      unsubscribeAuth();
      unsubscribeConsultations();
    };
  }, [user]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt || !questions) {
      showToast("Please fill all fields", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await consultationService.createConsultation({
        type,
        scheduledAt,
        questions
      });
      setScheduledAt('');
      setQuestions('');
      showToast("Consultation booked successfully!", "success");
    } catch (error: unknown) {
      console.error(error);
      showToast("Failed to book consultation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Login to Book a Consultation</h2>
        <p className="opacity-70 mb-6">You need an account to track your spiritual guidance requests.</p>
        <div className="flex justify-center"><Auth /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <section className="relative py-24 bg-[#0a0502] text-white overflow-hidden">
        <div className="absolute inset-0 atmosphere opacity-50" />
        <div className="absolute inset-0 leaf-overlay opacity-5" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-6"
          >
            <Sparkles className="text-gold w-12 h-12" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-light serif mb-6 tracking-tight">Divine Consultation</h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Seek guidance from the Orishas and align your path with your true destiny through sacred Ifa divination.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto p-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Booking Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-12 rounded-[3rem] shadow-sm border border-black/5 spiritual-glow"
        >
          <h2 className="text-3xl font-bold mb-8 serif flex items-center gap-3">
            <Calendar className="text-forest" />
            Book Your Session
          </h2>
          
          <form onSubmit={handleBooking} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-earth/60">Consultation Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as ConsultationType)}
                className="w-full p-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-forest outline-none bg-paper/50 transition-all font-medium"
              >
                {Object.values(ConsultationType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-earth/60">Preferred Date & Time</label>
              <input 
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full p-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-forest outline-none bg-paper/50 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-earth/60">Your Questions / Intentions</label>
              <textarea 
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                rows={5}
                placeholder="What would you like to ask Ifa? Share your intentions for this sacred session..."
                className="w-full p-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-forest outline-none bg-paper/50 transition-all resize-none font-medium leading-relaxed"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-forest text-white rounded-2xl font-bold hover:bg-gold hover:text-black transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-forest/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {isSubmitting ? "Processing..." : "Confirm Booking Request"}
            </button>
          </form>
        </motion.div>

        {/* Booking History */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-12 rounded-[3rem] shadow-sm border border-black/5 spiritual-glow h-fit"
        >
          <h2 className="text-3xl font-bold mb-8 serif flex items-center gap-3">
            <History className="text-forest" />
            Your Sacred Records
          </h2>
          <div className="space-y-6">
            {bookings.length === 0 ? (
              <div className="py-12 text-center opacity-50 italic font-light serif">
                No consultations booked yet. Your journey begins with a single step.
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="p-6 bg-paper/30 rounded-[2rem] border border-black/5 hover:border-forest/20 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-forest serif text-lg">{b.type}</h4>
                      <p className="text-xs opacity-50 font-medium uppercase tracking-widest mt-1">
                        {new Date(b.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm opacity-70 mb-6 line-clamp-2 italic font-light leading-relaxed">"{b.questions}"</p>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handlePrint(b)}
                      className="flex items-center gap-2 text-xs text-forest hover:text-gold transition-colors font-bold uppercase tracking-widest"
                    >
                      <Printer size={14} />
                      Print Record
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Hidden Printable Area */}
      {printingConsultation && <PrintableConsultation consultation={printingConsultation} />}
    </div>
  );
};

const Gallery = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    const unsubscribe = videoService.subscribeToVideos(setVideos);
    return unsubscribe;
  }, []);

  const userLevel = userProfile?.role === 'super-admin' || userProfile?.role === 'admin' ? 2 : userProfile ? 1 : 0;
  const filteredVideos = videos.filter(v => (v.requiredLevel || 0) <= userLevel);

  return (
    <div className="min-h-screen bg-paper">
      <section className="relative py-24 bg-[#0a0502] text-white overflow-hidden">
        <div className="absolute inset-0 atmosphere opacity-50" />
        <div className="absolute inset-0 leaf-overlay opacity-5" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-6"
          >
            <PlayCircle className="text-gold w-12 h-12" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-light serif mb-6 tracking-tight">Sacred Teachings</h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Explore our collection of spiritual insights, traditional healing demonstrations, and sacred wisdom from OBA ELA.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto p-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredVideos.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-black/5 border-dashed spiritual-glow">
              <Youtube className="w-20 h-20 mx-auto mb-6 text-gray-200" />
              <p className="opacity-50 italic text-xl font-light serif">The sacred archives are currently being digitized. Check back soon.</p>
            </div>
          ) : (
            filteredVideos.map(video => (
              <motion.div 
                key={video.id}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer group spiritual-glow"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 text-forest flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      <Play size={32} fill="currentColor" />
                    </div>
                  </div>
                  {video.requiredLevel && video.requiredLevel > 0 && (
                    <div className="absolute top-6 right-6 px-4 py-2 bg-gold/90 backdrop-blur-md text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-xl">
                      {video.requiredLevel === 2 ? 'Admin' : 'Client'} Only
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 serif group-hover:text-forest transition-colors duration-300">{video.title}</h3>
                  <p className="text-sm opacity-60 line-clamp-2 leading-relaxed font-light">{video.description}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full overflow-hidden spiritual-glow"
            >
              <div className="aspect-video bg-black relative">
                <ReactPlayer 
                  url={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                  width="100%"
                  height="100%"
                  controls
                  playing
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload'
                      }
                    }
                  }}
                />
              </div>
              <div className="p-10 flex justify-between items-start bg-paper/50">
                <div>
                  <h2 className="text-3xl font-bold mb-3 serif text-forest">{selectedVideo.title}</h2>
                  <p className="opacity-60 text-lg font-light leading-relaxed max-w-2xl">{selectedVideo.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="p-4 hover:bg-forest/10 rounded-2xl transition-all duration-300 text-forest"
                >
                  <X size={32} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model", text: string }[]>([
    { role: "model", text: "Greetings! I am your spiritual guide for OBA ELA TRADO. How may I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await geminiService.askQuestion(userMsg, history);
    setMessages(prev => [...prev, { role: "model", text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-black/5 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-forest text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Spiritual Guide</h3>
                  <p className="text-[10px] opacity-70">Powered by OBA ELA Wisdom</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-forest text-white rounded-tr-none' 
                      : 'bg-white border border-black/5 text-gray-800 rounded-tl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-black/5 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-black/5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your question..."
                className="flex-grow p-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-forest text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-forest rotate-90' : 'bg-forest text-white hover:scale-110'
        }`}
      >
        {isOpen ? <CloseIcon /> : <MessageCircle />}
      </button>
    </div>
  );
};

const StaffDirectory = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    const unsubscribe = staffService.subscribeToStaff(setStaff);
    return unsubscribe;
  }, []);

  const departments = ['All', ...new Set(staff.map(s => s.department).filter(Boolean))];
  
  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === 'All' || s.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-paper pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="text-5xl serif mb-6 text-forest">Our Sacred Team</h2>
          <p className="text-earth/60 max-w-2xl mx-auto text-lg">
            Meet the dedicated individuals who serve the OBA ELA community with wisdom, compassion, and tradition.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 mb-12 flex flex-wrap gap-6 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-black/5 outline-none focus:ring-2 focus:ring-forest bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select 
              className="px-6 py-4 rounded-2xl border border-black/5 outline-none focus:ring-2 focus:ring-forest bg-gray-50 text-sm font-bold"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select 
              className="px-6 py-4 rounded-2xl border border-black/5 outline-none focus:ring-2 focus:ring-forest bg-gray-50 text-sm font-bold"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStaff.map((s) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                {s.profileVideoUrl ? (
                  <ReactPlayer 
                    url={s.profileVideoUrl}
                    width="100%"
                    height="100%"
                    playing={false}
                    light={true}
                    playIcon={<div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><Play className="text-forest translate-x-0.5" /></div>}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User size={64} />
                  </div>
                )}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-bold text-forest shadow-sm border border-black/5 uppercase tracking-widest">
                  {s.department}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-1">{s.name}</h3>
                <p className="text-forest font-medium mb-4">{s.role}</p>
                <div className="flex flex-col gap-2 text-sm text-earth/60">
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    {s.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    {s.phone}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-24">
            <Users size={64} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-2xl font-bold opacity-50">No staff members found matching your criteria.</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeSettings | null>(null);
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    const unsubscribe = themeService.subscribeToTheme(setCurrentTheme);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = pageService.subscribeToPages(setPages);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentTheme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', currentTheme.primaryColor);
      root.style.setProperty('--secondary', currentTheme.accentColor);
      root.style.setProperty('--accent', currentTheme.secondaryColor);
      root.style.setProperty('--bg', currentTheme.backgroundColor);
      root.style.setProperty('--text', currentTheme.textColor);
      root.style.setProperty('--font-serif-family', currentTheme.fontFamily);
      root.style.setProperty('--radius', currentTheme.borderRadius);
      root.style.setProperty('--glass-opacity', currentTheme.glassOpacity);
    }
  }, [currentTheme]);

  useEffect(() => {
    authService.testConnection();
    if (userProfile?.role === 'admin' || userProfile?.role === 'super-admin') {
      seedService.seedProducts();
      seedService.seedPages();
    }
  }, [userProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await authService.ensureUserProfile(user);
        setUserProfile(profile);
        
        // If admin/super-admin, show prompt if not already in admin mode
        if (profile.role === 'admin' || profile.role === 'super-admin') {
          if (location.pathname === '/') {
            setShowAdminPrompt(true);
          }
        } else {
          // Regular users redirect to home or dashboard if they were on admin
          if (location.pathname.startsWith('/admin')) {
            navigate('/');
          }
        }
      } else {
        setUserProfile(null);
        setIsAdminMode(false);
        setShowAdminPrompt(false);
      }
    });
    return unsubscribe;
  }, [navigate, location.pathname]);

  const handleAdminChoice = (asAdmin: boolean) => {
    setIsAdminMode(asAdmin);
    setShowAdminPrompt(false);
    if (asAdmin) {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminMode && (
        <div className="bg-gold text-black py-1 px-4 text-[10px] font-bold uppercase tracking-widest text-center z-[101] relative">
          Admin Mode Active • <button onClick={() => { setIsAdminMode(false); navigate('/'); }} className="underline hover:no-underline">Exit to Site</button>
        </div>
      )}
      {/* Admin Mode Prompt */}
      <AnimatePresence>
        {showAdminPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <LayoutDashboard className="w-16 h-16 mx-auto mb-6 text-forest" />
              <h2 className="text-2xl font-bold mb-4">Welcome back, {userProfile?.displayName}</h2>
              <p className="opacity-60 mb-8">How would you like to view the site today?</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAdminChoice(true)}
                  className="py-4 bg-forest text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                >
                  Admin Dashboard
                </button>
                <button 
                  onClick={() => handleAdminChoice(false)}
                  className="py-4 bg-gray-100 text-forest rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  User View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                <Leaf className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight serif leading-none">OBA ELA</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Trado Medical</span>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10">
              <Link to="/staff" className="text-sm font-semibold hover:text-gold transition-colors tracking-wide">
                Staff Directory
              </Link>
              {pages.filter(p => p.isPublished && p.slug !== 'home').map(p => (
                <Link 
                  key={p.id} 
                  to={['academy', 'store', 'consultation', 'gallery', 'orders'].includes(p.slug) ? `/${p.slug === 'academy' ? 'training' : p.slug}` : `/p/${p.slug}`} 
                  className="text-sm font-semibold hover:text-gold transition-colors tracking-wide"
                >
                  {p.title === 'Academy' ? 'Ilé-Àkọ́ni-lọ́gbọ́n' : p.title}
                </Link>
              ))}
              
              {/* Currency Switcher */}
              <div className="flex items-center gap-2 bg-paper px-3 py-1.5 rounded-full border border-black/5">
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Currency</span>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                >
                  {Object.values(CURRENCIES).map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-[1px] bg-black/10 mx-2" />
              <Auth />
              {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin') && (
                <button 
                  onClick={() => {
                    setIsAdminMode(!isAdminMode);
                    if (!isAdminMode) navigate('/admin');
                    else navigate('/');
                  }}
                  className={`p-2.5 rounded-xl transition-all ${isAdminMode ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'bg-forest text-white hover:bg-opacity-90 shadow-lg shadow-forest/20'}`}
                  title={isAdminMode ? "Switch to User View" : "Switch to Admin View"}
                >
                  <LayoutDashboard size={20} />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed inset-0 bg-white z-40 md:hidden pt-20 px-6"
            >
              <div className="flex flex-col gap-6 text-2xl font-semibold">
                <Link to="/staff" onClick={() => setIsMenuOpen(false)}>Staff Directory</Link>
                {pages.filter(p => p.isPublished && p.slug !== 'home').map(p => (
                  <Link 
                    key={p.id} 
                    to={['academy', 'store', 'consultation', 'gallery', 'orders'].includes(p.slug) ? `/${p.slug === 'academy' ? 'training' : p.slug}` : `/p/${p.slug}`} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {p.title === 'Academy' ? 'Ilé-Àkọ́ni-lọ́gbọ́n' : p.title}
                  </Link>
                ))}
                {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin') && (
                  <Link to="/admin" onClick={() => { setIsMenuOpen(false); setIsAdminMode(true); }}>Admin</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/training" element={<Training />} />
            <Route path="/staff" element={<StaffDirectory />} />
            <Route path="/gallery" element={<Gallery userProfile={userProfile} />} />
            <Route path="/p/:slug" element={<CustomPage />} />
            <Route 
              path="/admin" 
              element={
                (userProfile?.role === 'admin' || userProfile?.role === 'super-admin') 
                  ? <Admin /> 
                  : <Home />
              } 
            />
          </Routes>
        </main>

        <ChatBot />

        {/* Footer */}
        <footer className="bg-white border-t border-black/5 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center gap-6 mb-8">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-full hover:bg-forest hover:text-white transition-all duration-300 shadow-sm border border-black/5">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-full hover:bg-forest hover:text-white transition-all duration-300 shadow-sm border border-black/5">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-full hover:bg-forest hover:text-white transition-all duration-300 shadow-sm border border-black/5">
                <Twitter size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-full hover:bg-forest hover:text-white transition-all duration-300 shadow-sm border border-black/5">
                <Youtube size={20} />
              </a>
            </div>
            <p className="text-sm opacity-50">&copy; 2026 OBA ELA TRADO MEDICAL HEALING LIMITED. All rights reserved.</p>
            {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin') && (
              <button 
                onClick={() => { setIsAdminMode(true); navigate('/admin'); }}
                className="mt-4 text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
              >
                Admin Dashboard
              </button>
            )}
          </div>
        </footer>
      </div>
  );
}
