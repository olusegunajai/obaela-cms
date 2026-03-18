import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route, Link } from 'react-router-dom';
import { authService, UserProfile } from './services/authService';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  User, 
  Menu,
  X,
  Leaf,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Auth } from './components/Auth';
import { consultationService, ConsultationType, Consultation as ConsultationData, ConsultationStatus } from './services/consultationService';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { productService, Product } from './services/productService';
import { uploadImage } from './services/cloudinaryService';
import { ShoppingCart, Plus, Trash2, Edit2, Upload, Loader2, CreditCard, Truck, Printer, MessageCircle, Send, X as CloseIcon } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { orderService, OrderStatus, Order } from './services/orderService';
import { courseService, Course, Lesson, Enrollment } from './services/courseService';
import { healerService, Healer } from './services/healerService';
import { geminiService } from './services/geminiService';

// Components
const Home = () => {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  return (
    <div className="p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-5xl font-bold mb-6 gold-text">OBA ELA TRADO</h1>
        <p className="text-xl mb-8 opacity-80">Traditional African Healing & Spiritual Guidance</p>
        
        {!user && (
          <div className="mb-12 p-8 bg-white rounded-3xl border border-black/5 shadow-sm inline-block">
            <h3 className="text-xl font-bold mb-4">Join Our Community</h3>
            <p className="opacity-60 mb-6">Create an account to access our academy, book consultations, and track your orders.</p>
            <div className="flex justify-center">
              <Auth />
            </div>
          </div>
        )}

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
};

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

  const handleCheckoutComplete = async (reference: string, details: { name: string, email: string, phone: string, address: string }) => {
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
    } catch (error: unknown) {
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
const Checkout = ({ total, onComplete, onCancel }: { cart: {product: Product, quantity: number}[], total: number, onComplete: (ref: string, details: { name: string, email: string, phone: string, address: string }) => void, onCancel: () => void }) => {
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
const Admin = () => {
  const [activeTab, setActiveTab] = useState<'consultations' | 'products' | 'orders' | 'users' | 'courses' | 'healers'>('consultations');
  const [allConsultations, setAllConsultations] = useState<ConsultationData[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [healers, setHealers] = useState<Healer[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingHealer, setEditingHealer] = useState<Healer | null>(null);
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

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Herbal Medicine',
    imageUrl: '',
    stock: 10
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
    thumbnailUrl: ''
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    order: 1
  });

  const [healerForm, setHealerForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    availability: '',
    imageUrl: ''
  });

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
        order: editingLesson.order
      });
    }
  }, [editingLesson]);

  useEffect(() => {
    if (selectedCourseForLessons?.id) {
      const unsubscribe = courseService.subscribeToLessons(selectedCourseForLessons.id, setLessons);
      return unsubscribe;
    }
  }, [selectedCourseForLessons]);

  useEffect(() => {
    if (editingHealer) {
      setHealerForm({
        name: editingHealer.name,
        specialty: editingHealer.specialty,
        bio: editingHealer.bio,
        availability: editingHealer.availability,
        imageUrl: editingHealer.imageUrl || ''
      });
    }
  }, [editingHealer]);

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
    }
  }, [editingProduct]);

  useEffect(() => {
    let unsubscribeConsultations = () => {};
    let unsubscribeProducts = () => {};
    let unsubscribeOrders = () => {};
    let unsubscribeUsers = () => {};

    if (userProfile?.role === 'admin' || userProfile?.role === 'super-admin') {
      const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
      unsubscribeConsultations = onSnapshot(q, (snapshot) => {
        setAllConsultations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ConsultationData[]);
      });
      unsubscribeProducts = productService.subscribeToProducts(setProducts);
      unsubscribeOrders = orderService.subscribeToAllOrders(setAllOrders);
      const unsubscribeCourses = courseService.subscribeToCourses(setCourses);
      const unsubscribeHealers = healerService.subscribeToHealers(setHealers);
      
      if (userProfile.role === 'super-admin') {
        unsubscribeUsers = authService.subscribeToAllUsers(setAllUsers);
      }

      return () => {
        unsubscribeConsultations();
        unsubscribeProducts();
        unsubscribeOrders();
        unsubscribeUsers();
        unsubscribeCourses();
        unsubscribeHealers();
      };
    }
  }, [userProfile]);

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await authService.updateUserProfile(uid, data);
      alert("User updated successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update user");
    }
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse?.id) {
        await courseService.updateCourse(editingCourse.id, courseForm);
        alert("Course updated successfully");
        setEditingCourse(null);
      } else {
        await courseService.createCourse(courseForm);
        alert("Course created successfully");
      }
      setCourseForm({ title: '', description: '', instructor: '', price: 0, thumbnailUrl: '' });
    } catch (error) {
      console.error(error);
      alert("Failed to save course");
    }
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons?.id) return;
    try {
      if (editingLesson?.id) {
        await courseService.updateLesson(selectedCourseForLessons.id, editingLesson.id, lessonForm);
        alert("Lesson updated successfully");
        setEditingLesson(null);
      } else {
        await courseService.addLesson(selectedCourseForLessons.id, lessonForm);
        alert("Lesson added successfully");
      }
      setLessonForm({ title: '', content: '', videoUrl: '', order: lessons.length + 1 });
    } catch (error) {
      console.error(error);
      alert("Failed to save lesson");
    }
  };

  const handleSubmitHealer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHealer?.id) {
        await healerService.updateHealer(editingHealer.id, healerForm);
        alert("Healer updated successfully");
        setEditingHealer(null);
      } else {
        await healerService.createHealer(healerForm);
        alert("Healer added successfully");
      }
      setHealerForm({ name: '', specialty: '', bio: '', availability: '', imageUrl: '' });
    } catch (error) {
      console.error(error);
      alert("Failed to save healer");
    }
  };

  const handleDeleteHealer = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this healer?")) {
      try {
        await healerService.deleteHealer(id);
        alert("Healer deleted successfully");
      } catch (error) {
        console.error(error);
        alert("Failed to delete healer");
      }
    }
  };

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
      if (activeTab === 'products') {
        setProductForm(prev => ({ ...prev, imageUrl: url }));
      } else if (activeTab === 'healers') {
        setHealerForm(prev => ({ ...prev, imageUrl: url }));
      }
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'super-admin') {
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
            Academy
          </button>
          <button 
            onClick={() => setActiveTab('healers')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'healers' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
          >
            Healers
          </button>
          {userProfile?.role === 'super-admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
            >
              Users
            </button>
          )}
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
                      </td>
                      <td className="p-4 text-sm">{o.items.length} items</td>
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
      ) : activeTab === 'healers' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/Edit Healer Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {editingHealer ? <Edit2 className="text-forest" /> : <Plus className="text-forest" />}
                  {editingHealer ? 'Edit Healer' : 'Add New Healer'}
                </h3>
                {editingHealer && (
                  <button 
                    onClick={() => setEditingHealer(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
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
                  placeholder="Specialty (e.g. Ifa Divination, Herbalism)" 
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
                  rows={4}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Availability (e.g. Mon-Fri, 9am-5pm)" 
                  value={healerForm.availability}
                  onChange={e => setHealerForm({...healerForm, availability: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <Upload size={14} />
                    Healer Image
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-grow">
                      <input 
                        type="text" 
                        placeholder="Image URL" 
                        value={healerForm.imageUrl}
                        onChange={e => setHealerForm({...healerForm, imageUrl: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest pr-12"
                      />
                      {healerForm.imageUrl && (
                        <img 
                          src={healerForm.imageUrl} 
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
                  {editingHealer ? 'Update Healer' : 'Save Healer'}
                </button>
              </form>
            </div>
          </div>

          {/* Healer List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">Healer</th>
                    <th className="p-4 text-sm font-bold">Specialty</th>
                    <th className="p-4 text-sm font-bold">Availability</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {healers.map((h) => (
                    <tr key={h.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={h.imageUrl || `https://picsum.photos/seed/${h.name}/50/50`} 
                            className="w-10 h-10 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-sm">{h.name}</div>
                            <div className="text-[10px] opacity-50 truncate max-w-[150px]">{h.bio}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{h.specialty}</td>
                      <td className="p-4 text-sm">{h.availability}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingHealer(h)}
                            className="p-2 text-forest hover:bg-forest/5 rounded-full transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteHealer(h.id!)}
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
      ) : activeTab === 'users' ? (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="text-forest" />
              Manage Users & Roles
            </h3>
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5">
                    <th className="p-4 text-sm font-bold">User</th>
                    <th className="p-4 text-sm font-bold">Role</th>
                    <th className="p-4 text-sm font-bold">Level</th>
                    <th className="p-4 text-sm font-bold">Category</th>
                    <th className="p-4 text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.uid} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm">{u.displayName}</div>
                        <div className="text-xs opacity-50">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as UserRole })}
                          className="text-xs p-1 rounded border border-gray-200 outline-none"
                          disabled={u.uid === user?.uid}
                        >
                          <option value="client">Client</option>
                          <option value="admin">Admin</option>
                          <option value="super-admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          min="1" 
                          max="5"
                          value={u.adminLevel || ''}
                          onChange={(e) => handleUpdateUser(u.uid, { adminLevel: Number(e.target.value) })}
                          className="w-16 text-xs p-1 rounded border border-gray-200 outline-none"
                          placeholder="Level"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={u.adminCategory || ''}
                          onChange={(e) => handleUpdateUser(u.uid, { adminCategory: e.target.value })}
                          className="text-xs p-1 rounded border border-gray-200 outline-none"
                          placeholder="Category"
                        />
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => alert("More actions coming soon")}
                          className="text-xs text-forest hover:underline"
                        >
                          Details
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
                  placeholder="Price (₦)" 
                  value={courseForm.price || ''}
                  onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest"
                  required
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
                      <td className="p-4 text-sm font-bold">₦{c.price.toLocaleString()}</td>
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
                      <th className="p-4 text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l) => (
                      <tr key={l.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm">{l.order}</td>
                        <td className="p-4 text-sm font-bold">{l.title}</td>
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

      {/* Hidden Printable Area */}
      {printingConsultation && <PrintableConsultation consultation={printingConsultation} />}
    </div>
  );
};

const Training = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [view, setView] = useState<'catalog' | 'my-academy'>('catalog');

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
    if (!user) return alert("Please login to enroll in courses.");
    setIsEnrolling(true);
    try {
      await courseService.enrollInCourse(user.uid, courseId);
      alert("Successfully enrolled!");
    } catch (error) {
      console.error(error);
      alert("Failed to enroll.");
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
            <div className="aspect-video bg-black">
              <iframe 
                src={activeLesson.videoUrl} 
                className="w-full h-full"
                allowFullScreen
              />
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
                  return (
                    <button 
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className="w-full flex items-center gap-4 p-6 bg-white rounded-2xl border border-black/5 hover:border-gold hover:shadow-md transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                        completed ? 'bg-green-100 text-green-700' : 'bg-forest/10 text-forest'
                      }`}>
                        {completed ? <Sparkles size={18} /> : idx + 1}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold group-hover:text-gold transition-colors">{lesson.title}</h3>
                        <p className="text-xs opacity-50">Lesson {idx + 1}</p>
                      </div>
                      {completed && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Completed</span>}
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

  const displayedCourses = view === 'catalog' 
    ? courses 
    : courses.filter(c => isEnrolled(c.id!));

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Academy</h1>
          <p className="opacity-60 text-lg">Learn the ancient wisdom of Ifa and traditional herbalism.</p>
        </div>
        {user && (
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setView('catalog')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'catalog' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
            >
              Catalog
            </button>
            <button 
              onClick={() => setView('my-academy')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'my-academy' ? 'bg-white shadow-sm text-forest' : 'text-gray-500'}`}
            >
              My Academy ({enrollments.length})
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedCourses.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-black/5 border-dashed">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="opacity-50 italic text-lg">
              {view === 'catalog' ? "No courses available at the moment." : "You haven't enrolled in any courses yet."}
            </p>
            {view === 'my-academy' && (
              <button 
                onClick={() => setView('catalog')}
                className="mt-4 text-forest font-bold hover:underline"
              >
                Browse Catalog
              </button>
            )}
          </div>
        ) : (
          displayedCourses.map(course => (
            <motion.div 
              key={course.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={course.thumbnailUrl || `https://picsum.photos/seed/${course.title}/400/300`} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {isEnrolled(course.id!) && (
                  <div className="absolute top-4 right-4 bg-forest text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Enrolled
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">{course.title}</h3>
                <p className="text-sm opacity-60 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-forest bg-forest/5 px-3 py-1 rounded-full">{course.instructor}</span>
                  <span className="text-gold font-bold">₦{course.price.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
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
            <p className="text-xs uppercase font-bold opacity-50">Healer's Signature</p>
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
    if (!scheduledAt || !questions) return alert("Please fill all fields");
    
    setIsSubmitting(true);
    try {
      await consultationService.createConsultation({
        type,
        scheduledAt,
        questions
      });
      setScheduledAt('');
      setQuestions('');
      alert("Consultation booked successfully!");
    } catch (error: unknown) {
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
    <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                  <h4 className="font-bold text-forest">{b.type}</h4>
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
                <div className="mt-3 pt-3 border-t border-black/5 flex justify-end">
                  <button 
                    onClick={() => handlePrint(b)}
                    className="flex items-center gap-1 text-xs text-forest hover:underline font-bold"
                  >
                    <Printer size={12} />
                    Print Record
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Hidden Printable Area */}
      {printingConsultation && <PrintableConsultation consultation={printingConsultation} />}
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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);

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
              {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin') && (
                <button 
                  onClick={() => {
                    setIsAdminMode(!isAdminMode);
                    if (!isAdminMode) navigate('/admin');
                    else navigate('/');
                  }}
                  className={`p-2 rounded-full transition-all ${isAdminMode ? 'bg-gold text-white' : 'bg-forest text-white hover:bg-opacity-90'}`}
                  title={isAdminMode ? "Switch to User View" : "Switch to Admin View"}
                >
                  <LayoutDashboard size={18} />
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
                <Link to="/consultation" onClick={() => setIsMenuOpen(false)}>Consultation</Link>
                <Link to="/store" onClick={() => setIsMenuOpen(false)}>Store</Link>
                <Link to="/orders" onClick={() => setIsMenuOpen(false)}>Orders</Link>
                <Link to="/training" onClick={() => setIsMenuOpen(false)}>Academy</Link>
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
            <p className="text-sm opacity-50">&copy; 2026 OBA ELA TRADO MEDICAL HEALING LIMITED. All rights reserved.</p>
          </div>
        </footer>
      </div>
  );
}
