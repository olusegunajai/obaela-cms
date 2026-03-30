import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Star, Send, User, MessageCircle } from 'lucide-react';
import { Product } from '../services/productService';
import { reviewService, Review } from '../services/reviewService';
import { auth } from '../firebase';
import { useToast } from './Toast';

interface ProductReviewsProps {
  product: Product;
  onClose: () => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ product, onClose }) => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product.id) {
      const unsubscribe = reviewService.subscribeToReviews(product.id, setReviews);
      return unsubscribe;
    }
  }, [product.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showToast("Please sign in to leave a review.", "error");
      return;
    }

    if (!newReview.text.trim()) {
      showToast("Please enter a review message.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.addReview(product.id!, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        rating: newReview.rating,
        text: newReview.text
      });
      setNewReview({ rating: 5, text: '' });
      showToast("Review added successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to add review.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-paper/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center">
              <MessageCircle className="text-forest w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold serif">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={14} 
                      className={s <= Math.round(averageRating) ? 'fill-gold text-gold' : 'text-gray-300'} 
                    />
                  ))}
                </div>
                <span className="text-xs font-bold opacity-40 uppercase tracking-widest">
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8">
          {/* Review Form */}
          {auth.currentUser ? (
            <form onSubmit={handleSubmit} className="bg-paper p-6 rounded-3xl border border-black/5">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Share your experience</h3>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating: s }))}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      size={24} 
                      className={s <= newReview.rating ? 'fill-gold text-gold' : 'text-gray-300'} 
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={newReview.text}
                onChange={e => setNewReview(prev => ({ ...prev, text: e.target.value }))}
                placeholder="What did you think of this remedy?"
                className="w-full p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-forest bg-white text-sm mb-4"
                rows={3}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-forest text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : (
                  <>
                    <Send size={18} />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-paper p-8 rounded-3xl border border-black/5 text-center">
              <p className="text-earth/60 mb-4">You must be signed in to leave a review.</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12 opacity-30 italic serif text-xl">
                No reviews yet. Be the first to share your wisdom.
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="flex gap-4 p-6 rounded-3xl border border-black/5 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-forest/5 flex items-center justify-center flex-shrink-0">
                    <User className="text-forest/40" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{review.userName}</h4>
                        <div className="flex mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={12} 
                              className={s <= review.rating ? 'fill-gold text-gold' : 'text-gray-300'} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                        {review.createdAt && 'toDate' in review.createdAt 
                          ? (review.createdAt as { toDate: () => Date }).toDate().toLocaleDateString() 
                          : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm text-earth/80 leading-relaxed">{review.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
