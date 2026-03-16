import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  BookOpen, 
  User, 
  Settings,
  Menu,
  X,
  Leaf,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Placeholder Components
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
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-black/5">
          <Calendar className="w-12 h-12 mb-4 mx-auto text-forest" />
          <h3 className="text-xl font-semibold mb-2">Consultation</h3>
          <p className="text-sm opacity-70">Book your Ifa divination or spiritual reading.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-black/5">
          <ShoppingBag className="w-12 h-12 mb-4 mx-auto text-forest" />
          <h3 className="text-xl font-semibold mb-2">Herbal Store</h3>
          <p className="text-sm opacity-70">Authentic traditional medicines and spiritual items.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-black/5">
          <BookOpen className="w-12 h-12 mb-4 mx-auto text-forest" />
          <h3 className="text-xl font-semibold mb-2">Training</h3>
          <p className="text-sm opacity-70">Learn the ancient wisdom of Ifa and herbalism.</p>
        </div>
      </div>
    </motion.div>
  </div>
);

const Store = () => <div className="p-8">Store Section (Coming Soon)</div>;
const Consultation = () => <div className="p-8">Consultation Booking (Coming Soon)</div>;
const Training = () => <div className="p-8">Training Academy (Coming Soon)</div>;
const Admin = () => <div className="p-8">Admin Dashboard (Coming Soon)</div>;

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
                <Link to="/training" className="text-sm font-medium hover:text-gold transition-colors">Academy</Link>
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
