import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  BookOpen, 
  User, 
  Menu,
  X,
  Leaf,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Auth } from './components/Auth';
import { consultationService, ConsultationType, Consultation as ConsultationData, ConsultationStatus } from './services/consultationService';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { productService, Product } from './services/productService';
import { uploadImage } from './services/cloudinaryService';
import { ShoppingCart, Plus, Trash2, Edit2, Upload, Loader2, CreditCard, Truck } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { orderService, OrderStatus, Order } from './services/orderService';
import { courseService, Course, Lesson } from './services/courseService';
import { healerService, Healer } from './services/healerService';

// Components
const Home = () => (
  <div className="p-8">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto text-center"
    >
      <h1 className="text-5xl font-bold mb-6 gold-text">OBA ELA TRADO</h1>
      <p className="text-xl mb-8 opacity-80">Traditional African Healing & Spiritual Guidance</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/consultation" className="p-6 bg-white rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all">
          <Calendar className="w-12 h-12 mb-4 mx-auto text-forest" />
          <h3 className="text-xl font-semibold mb-2">Consultation</h3>
          <p className="text-sm opacity-70">Book your Ifa divination or spiritual reading.</p>
        </Link>
        <Link to="/store" className="p-6 bg-white rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all">
          <ShoppingBag className="w-12 h-12 mb-4 mx-auto text-forest" />
          <h3 className="text-xl font-semibold mb-2">Herbal Store</h3>
          <p className="text-sm opacity-70">Authentic traditional medicines and spiritual items.</p>
        </Link>
        <Link to="/training" className="p-6 bg-white rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all">
          <BookOpen className="w-12 h-12 mb-4 mx-auto text-forest" />
          <h3 className="text-xl font-semibold mb-2">Training</h3>
          <p className="text-sm opacity-70">Learn the ancient wisdom of Ifa and herbalism.</p>
        </Link>
      </div>
    </motion.div>
  </div>
);

const Store = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = productService.subscribeToProducts(setProducts);
    return unsubscribe;
  }, []);

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

  const handleCheckoutComplete = async (reference: string, details: { name: string; email: string; phone: string; address: string }) => {
    try {
      if (!auth.currentUser) {
        alert("Please sign in to complete your order.");
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
      alert("Order placed successfully! You can track it in the Orders section.");
    } catch (error) {
      console.error(error);
      alert("Failed to save order. Please contact support.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Herbal Store</h1>
          <p className="opacity-60 text-lg">Authentic traditional medicines and spiritual items.</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-4 bg-white rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition-all"
        >
          <ShoppingCart className="text-forest" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-gold text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map(product => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all group"
          >
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img 
                src={product.imageUrl || `https://picsum.photos/seed/${product.name}/400/400`} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-forest">
                ₦{product.price.toLocaleString()}
              </div>
            </div>
            <div className="p-6">
              <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">{product.category}</div>
              <h3 className="text-xl font-bold mb-2">{product.name}</h3>
              <p className="text-sm opacity-60 line-clamp-2 mb-6">{product.description}</p>
              <button 
                onClick={() => addToCart(product)}
                className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add to Cart
              </button>
            </div>
          </motion.div>
        ))}
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
                        <p className="text-sm opacity-60">₦{item.product.price.toLocaleString()} x {item.quantity}</p>
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
                    <span className="text-2xl font-bold text-forest">₦{total.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (!auth.currentUser) {
                        alert("Please sign in to checkout.");
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
    </div>
  );
};
const Checkout = ({ total, onComplete, onCancel }: { cart: {product: Product, quantity: number}[], total: number, onComplete: (ref: string, details: { name: string; email: string; phone: string; address: string }) => void, onCancel: () => void }) => {
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
      alert("Paystack Public Key is missing. Please check environment variables.");
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
            <span className="font-bold">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-forest">
            <span className="font-bold">Total to Pay</span>
            <span className="text-xl font-bold">₦{total.toLocaleString()}</span>
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
                  <div className="text-lg font-bold text-forest">₦{order.totalAmount.toLocaleString()}</div>
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
                        <div className="text-xs opacity-60">₦{item.price.toLocaleString()} x {item.quantity}</div>
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
const Training = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const unsubscribe = courseService.subscribeToCourses(setCourses);
    return unsubscribe;
  }, []);

  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 gold-text">Ifa Training Academy</h1>
        <p className="opacity-60 text-lg max-w-2xl mx-auto">
          Deepen your spiritual knowledge through our structured courses on Ifa wisdom, herbalism, and traditional healing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-20 opacity-50 italic">
            New courses are being prepared. Check back soon!
          </div>
        ) : (
          courses.map(course => (
            <motion.div 
              key={course.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="aspect-video bg-gray-100 relative">
                <img 
                  src={course.thumbnailUrl || `https://picsum.photos/seed/${course.title}/600/400`} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 right-4 bg-forest text-white px-3 py-1 rounded-full text-sm font-bold">
                  ₦{course.price.toLocaleString()}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-sm opacity-60 line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                  <User size={14} />
                  {course.instructor}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const CourseDetail = ({ course, onBack }: { course: Course, onBack: () => void }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (course.id) {
      const unsubscribe = courseService.subscribeToLessons(course.id, (data) => {
        setLessons(data);
        if (data.length > 0 && !activeLesson) {
          setActiveLesson(data[0]);
        }
      });
      return unsubscribe;
    }
  }, [course.id, activeLesson]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-black/5 p-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <X />
          </button>
          <h2 className="text-xl font-bold truncate">{course.title}</h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-black/5"
            >
              <h1 className="text-3xl font-bold mb-6">{activeLesson.title}</h1>
              {activeLesson.videoUrl && (
                <div className="aspect-video bg-black rounded-2xl mb-8 overflow-hidden">
                  <iframe 
                    src={activeLesson.videoUrl.replace('watch?v=', 'embed/')} 
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              <div className="prose prose-forest max-w-none opacity-80 whitespace-pre-wrap">
                {activeLesson.content}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center opacity-50 italic border border-black/5">
              Select a lesson to start learning
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 sticky top-32">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BookOpen className="text-forest" />
              Course Content
            </h3>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-4 rounded-2xl transition-all flex gap-4 items-center ${
                    activeLesson?.id === lesson.id 
                      ? 'bg-forest text-white shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    activeLesson?.id === lesson.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium">{lesson.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const [allConsultations, setAllConsultations] = useState<ConsultationData[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allHealers, setAllHealers] = useState<Healer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultations' | 'products' | 'orders' | 'courses' | 'healers'>('consultations');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Healer Form State
  const [healerForm, setHealerForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    imageUrl: '',
    available: true
  });
  const [editingHealer, setEditingHealer] = useState<Healer | null>(null);

  // Course Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    instructor: 'Oba Ela',
    price: 0,
    thumbnailUrl: ''
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Lesson Form State
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    order: 1
  });
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Herbal Medicine',
    imageUrl: '',
    stock: 10
  });

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        category: editingProduct.category,
        imageUrl: editingProduct.imageUrl || '',
        stock: editingProduct.stock
      });
    } else {
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: 'Herbal Medicine',
        imageUrl: '',
        stock: 10
      });
    }
  }, [editingProduct]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsAdmin(u.email === "dbest4real2009@gmail.com");
      }
    });

    let unsubscribeConsultations = () => {};
    let unsubscribeProducts = () => {};
    let unsubscribeOrders = () => {};
    let unsubscribeCourses = () => {};
    let unsubscribeHealers = () => {};

    if (user && (user.email === "dbest4real2009@gmail.com")) {
      const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
      unsubscribeConsultations = onSnapshot(q, (snapshot) => {
        setAllConsultations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ConsultationData[]);
      });
      unsubscribeProducts = productService.subscribeToProducts(setProducts);
      unsubscribeOrders = orderService.subscribeToAllOrders(setAllOrders);
      unsubscribeCourses = courseService.subscribeToCourses(setAllCourses);
      unsubscribeHealers = healerService.subscribeToHealers(setAllHealers);
    }

    return () => {
      unsubscribeAuth();
      unsubscribeConsultations();
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeCourses();
      unsubscribeHealers();
    };
  }, [user]);

  useEffect(() => {
    if (selectedCourseForLessons?.id) {
      const unsubscribe = courseService.subscribeToLessons(selectedCourseForLessons.id, setCourseLessons);
      return unsubscribe;
    }
  }, [selectedCourseForLessons]);

  const updateStatus = async (id: string, status: ConsultationStatus) => {
    try {
      await consultationService.updateStatus(id, status);
      alert("Status updated");
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(id, status);
      alert("Order status updated");
    } catch (error) {
      console.error(error);
      alert("Failed to update order status");
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct?.id) {
        await productService.updateProduct(editingProduct.id, productForm);
        alert("Product updated successfully");
        setEditingProduct(null);
      } else {
        await productService.createProduct(productForm);
        alert("Product added successfully");
      }
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: 'Herbal Medicine',
        imageUrl: '',
        stock: 10
      });
    } catch (error) {
      console.error(error);
      alert("Failed to save product");
    }
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse?.id) {
        await courseService.updateCourse(editingCourse.id, courseForm);
        alert("Course updated");
        setEditingCourse(null);
      } else {
        await courseService.createCourse(courseForm);
        alert("Course created");
      }
      setCourseForm({ title: '', description: '', instructor: 'Oba Ela', price: 0, thumbnailUrl: '' });
    } catch (error) {
      console.error(error);
      alert("Failed to save course");
    }
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons?.id) return;
    try {
      await courseService.addLesson(selectedCourseForLessons.id, lessonForm);
      alert("Lesson added");
      setLessonForm({ title: '', content: '', videoUrl: '', order: courseLessons.length + 1 });
    } catch (error) {
      console.error(error);
      alert("Failed to add lesson");
    }
  };

  const handleSubmitHealer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHealer?.id) {
        await healerService.updateHealer(editingHealer.id, healerForm);
        alert("Healer updated");
        setEditingHealer(null);
      } else {
        await healerService.createHealer(healerForm);
        alert("Healer added");
      }
      setHealerForm({ name: '', specialty: '', bio: '', imageUrl: '', available: true });
    } catch (error) {
      console.error(error);
      alert("Failed to save healer");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setProductForm(prev => ({ ...prev, imageUrl: url }));
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-12 text-center text-red-500 font-bold">Access Denied. Admin only.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('consultations')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'consultations' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
          >
            Consultations
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'courses' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
          >
            Courses
          </button>
          <button 
            onClick={() => setActiveTab('healers')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'healers' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
          >
            Healers
          </button>
        </div>
      </div>
      
      {activeTab === 'consultations' ? (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-forest" />
              Recent Consultations
            </h3>
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Client</th>
                    <th className="p-4 text-sm font-bold">Type</th>
                    <th className="p-4 text-sm font-bold">Scheduled At</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allConsultations.map((c) => (
                    <tr key={c.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-mono">{c.clientUid.slice(0, 8)}...</td>
                      <td className="p-4 text-sm">
                        <div>{c.type}</div>
                        {c.healerName && (
                          <div className="text-[10px] text-gold font-bold uppercase">Healer: {c.healerName}</div>
                        )}
                      </td>
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
                      <td className="p-4 flex gap-2 items-center">
                        <select 
                          className="text-[10px] p-1 rounded border border-gray-200 outline-none w-24"
                          value={c.healerId || ''}
                          onChange={(e) => {
                            const h = allHealers.find(healer => healer.id === e.target.value);
                            consultationService.updateConsultation(c.id!, { 
                              healerId: h?.id || null, 
                              healerName: h?.name || null 
                            });
                          }}
                        >
                          <option value="">Assign Healer</option>
                          {allHealers.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : activeTab === 'courses' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="text-forest" />
                {editingCourse ? 'Edit Course' : 'Create Course'}
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
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Price (₦)" 
                    value={courseForm.price || ''}
                    onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Instructor" 
                    value={courseForm.instructor}
                    onChange={e => setCourseForm({...courseForm, instructor: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </form>
            </section>

            {selectedCourseForLessons && (
              <section className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-forest" />
                  Add Lesson to {selectedCourseForLessons.title}
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
                  <input 
                    type="text" 
                    placeholder="Video URL (YouTube)" 
                    value={lessonForm.videoUrl}
                    onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  />
                  <textarea 
                    placeholder="Lesson Content" 
                    value={lessonForm.content}
                    onChange={e => setLessonForm({...lessonForm, content: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                    rows={5}
                    required
                  />
                  <button 
                    type="submit"
                    className="w-full py-3 bg-gold text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                  >
                    Add Lesson
                  </button>
                </form>
              </section>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Course</th>
                    <th className="p-4 text-sm font-bold">Price</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCourses.map((c) => (
                    <tr key={c.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm">{c.title}</div>
                        <div className="text-xs opacity-50">{c.instructor}</div>
                      </td>
                      <td className="p-4 text-sm font-bold">₦{c.price.toLocaleString()}</td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => setSelectedCourseForLessons(c)}
                          className="p-2 text-forest hover:bg-forest/5 rounded-full"
                          title="Manage Lessons"
                        >
                          <BookOpen size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingCourse(c)}
                          className="p-2 text-gold hover:bg-gold/5 rounded-full"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {selectedCourseForLessons && (
              <section className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-black/5 font-bold">
                  Lessons for {selectedCourseForLessons.title}
                </div>
                <div className="divide-y divide-black/5">
                  {courseLessons.map((l, idx) => (
                    <div key={l.id} className="p-4 flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <span className="text-xs font-bold opacity-30">{idx + 1}</span>
                        <span className="text-sm font-medium">{l.title}</span>
                      </div>
                      <button 
                        onClick={() => courseService.deleteLesson(selectedCourseForLessons.id!, l.id!)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      ) : activeTab === 'healers' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <section className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="text-forest" />
                {editingHealer ? 'Edit Healer' : 'Add Healer'}
              </h3>
              <form onSubmit={handleSubmitHealer} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Healer Name" 
                  value={healerForm.name}
                  onChange={e => setHealerForm({...healerForm, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Specialty" 
                  value={healerForm.specialty}
                  onChange={e => setHealerForm({...healerForm, specialty: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                <textarea 
                  placeholder="Bio" 
                  value={healerForm.bio}
                  onChange={e => setHealerForm({...healerForm, bio: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  rows={3}
                  required
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={healerForm.available}
                    onChange={e => setHealerForm({...healerForm, available: e.target.checked})}
                    id="healer-available"
                  />
                  <label htmlFor="healer-available" className="text-sm">Available for bookings</label>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                  {editingHealer ? 'Update Healer' : 'Add Healer'}
                </button>
              </form>
            </section>
          </div>
          <div className="lg:col-span-2">
            <section className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Healer</th>
                    <th className="p-4 text-sm font-bold">Specialty</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allHealers.map((h) => (
                    <tr key={h.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm">{h.name}</div>
                      </td>
                      <td className="p-4 text-sm">{h.specialty}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${h.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {h.available ? 'Available' : 'Busy'}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingHealer(h);
                            setHealerForm({
                              name: h.name,
                              specialty: h.specialty,
                              bio: h.bio,
                              imageUrl: h.imageUrl || '',
                              available: h.available
                            });
                          }}
                          className="p-2 text-gold hover:bg-gold/5 rounded-full"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => healerService.deleteHealer(h.id!)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck className="text-forest" />
              Manage Orders
            </h3>
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Customer</th>
                    <th className="p-4 text-sm font-bold">Items</th>
                    <th className="p-4 text-sm font-bold">Total</th>
                    <th className="p-4 text-sm font-bold">Status</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((o) => (
                    <tr key={o.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm">{o.customerName}</div>
                        <div className="text-xs opacity-50">{o.email}</div>
                        <div className="text-xs opacity-50">{o.phone}</div>
                      </td>
                      <td className="p-4 text-sm">
                        {o.items.length} items
                      </td>
                      <td className="p-4 text-sm font-bold">₦{o.totalAmount.toLocaleString()}</td>
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
                {editingProduct && (
                  <button 
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
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
                    placeholder="Price (₦)" 
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Product</th>
                    <th className="p-4 text-sm font-bold">Price</th>
                    <th className="p-4 text-sm font-bold">Stock</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.imageUrl || `https://picsum.photos/seed/${p.name}/50/50`} 
                            className="w-10 h-10 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-sm">{p.name}</div>
                            <div className="text-xs opacity-50">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold">₦{p.price.toLocaleString()}</td>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Consultation = () => {
  const [type, setType] = useState<ConsultationType>(ConsultationType.IFA_DIVINATION);
  const [scheduledAt, setScheduledAt] = useState('');
  const [questions, setQuestions] = useState('');
  const [bookings, setBookings] = useState<ConsultationData[]>([]);
  const [healers, setHealers] = useState<Healer[]>([]);
  const [selectedHealer, setSelectedHealer] = useState<Healer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    
    let unsubscribeConsultations = () => {};
    if (auth.currentUser) {
      unsubscribeConsultations = consultationService.subscribeToUserConsultations(setBookings);
    }

    const unsubscribeHealers = healerService.subscribeToHealers((data) => {
      setHealers(data.filter(h => h.available));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConsultations();
      unsubscribeHealers();
    };
  }, [user]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt || !questions) return alert("Please fill all fields");
    
    setIsSubmitting(true);
    try {
      await consultationService.createConsultation({
        type,
        scheduledAt,
        questions,
        healerId: selectedHealer?.id,
        healerName: selectedHealer?.name
      });
      setScheduledAt('');
      setQuestions('');
      setSelectedHealer(null);
      alert("Consultation booked successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to book consultation.");
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
    <div className="max-w-6xl mx-auto p-8">
      {/* Healers Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <User className="text-forest" />
          Meet Our Traditional Healers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healers.map(h => (
            <div key={h.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-2xl bg-forest/5 flex items-center justify-center mb-4">
                <User className="text-forest" size={28} />
              </div>
              <h4 className="text-lg font-bold text-forest">{h.name}</h4>
              <p className="text-xs font-bold text-gold uppercase mb-3">{h.specialty}</p>
              <p className="text-sm opacity-70 line-clamp-3">{h.bio}</p>
            </div>
          ))}
          {healers.length === 0 && (
            <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm opacity-50 italic">No healers currently available for online booking.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Booking Form */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-black/5"
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="text-gold" />
          Book Consultation
        </h2>
        
        <form onSubmit={handleBooking} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Select Healer (Optional)</label>
            <div className="grid grid-cols-2 gap-4">
              {healers.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHealer(selectedHealer?.id === h.id ? null : h)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedHealer?.id === h.id 
                      ? 'border-forest bg-forest/5 ring-2 ring-forest' 
                      : 'border-gray-200 hover:border-forest/50'
                  }`}
                >
                  <div className="font-bold text-sm">{h.name}</div>
                  <div className="text-[10px] opacity-60">{h.specialty}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Consultation Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as ConsultationType)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none"
            >
              {Object.values(ConsultationType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Preferred Date & Time</label>
            <input 
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Your Questions / Intentions</label>
            <textarea 
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={4}
              placeholder="What would you like to ask Ifa?"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none resize-none"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-forest text-white rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Request Consultation"}
          </button>
        </form>
      </motion.div>

      {/* Booking History */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-2xl font-bold mb-6">Your Bookings</h2>
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="opacity-50 italic">No consultations booked yet.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="p-4 bg-white rounded-2xl border border-black/5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-forest">{b.type}</h4>
                    {b.healerName && (
                      <p className="text-[10px] font-bold text-gold uppercase">With {b.healerName}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                    b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-sm opacity-70 mb-1">
                  {new Date(b.scheduledAt).toLocaleString()}
                </p>
                <p className="text-xs opacity-50 line-clamp-1">{b.questions}</p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  </div>
);
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="bg-white border-b border-black/5 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2">
                <Leaf className="text-forest w-8 h-8" />
                <span className="font-bold text-xl tracking-tight">OBA ELA</span>
              </Link>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                <Link to="/consultation" className="text-sm font-medium hover:text-gold transition-colors">Consultation</Link>
                <Link to="/store" className="text-sm font-medium hover:text-gold transition-colors">Store</Link>
                <Link to="/orders" className="text-sm font-medium hover:text-gold transition-colors">Orders</Link>
                <Link to="/training" className="text-sm font-medium hover:text-gold transition-colors">Academy</Link>
                <Auth />
                <Link to="/admin" className="p-2 bg-forest text-white rounded-full hover:bg-opacity-90 transition-all">
                  <LayoutDashboard size={18} />
                </Link>
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
                <Link to="/consultation" onClick={() => setIsMenuOpen(false)}>Consultation</Link>
                <Link to="/store" onClick={() => setIsMenuOpen(false)}>Store</Link>
                <Link to="/orders" onClick={() => setIsMenuOpen(false)}>Orders</Link>
                <Link to="/training" onClick={() => setIsMenuOpen(false)}>Academy</Link>
                <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin</Link>
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
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-black/5 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm opacity-50">&copy; 2026 OBA ELA TRADO MEDICAL HEALING LIMITED. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
