import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, ThumbsUp, Send, ChevronLeft, ChevronRight } from "lucide-react";

// Import your central validated Supabase client client instance
import { supabase } from "@/lib/supabase"; 

const AnimatedElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setIsVisible(true); return; }
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { clearTimeout(fallback); setTimeout(() => setIsVisible(true), delay); observer.unobserve(el); }
    }, { threshold: 0.05, rootMargin: "0px 0px 100px 0px" });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className || ""}`}>
      {children}
    </div>
  );
};

function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110">
          <Star className={`h-7 w-7 transition-colors ${(hovered || value) >= n ? "fill-accent text-accent" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg hover:shadow-black/10 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          ))}
        </div>
        <span className="text-gray-500 text-xs">
          {review.created_at ? new Date(review.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : ""}
        </span>
      </div>
      <p className="text-gray-800 text-sm leading-relaxed italic">"{review.review}"</p>
      <div className="flex items-center gap-3 mt-1">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-primary font-black text-xs">{review.name?.[0]?.toUpperCase() || "?"}</span>
        </div>
        <div>
          <p className="text-gray-900 font-bold text-sm">{review.name}</p>
          <p className="text-gray-500 text-xs">{review.location}{review.product_purchased ? ` · ${review.product_purchased}` : ""}</p>
        </div>
      </div>
      {review.admin_reply && (
        <div className="mt-2 bg-gray-100 border border-gray-200 rounded-xl p-3">
          <p className="text-primary text-xs font-bold mb-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> D-Kadris Reply
          </p>
          <p className="text-gray-700 text-sm">{review.admin_reply}</p>
        </div>
      )}
    </div>
  );
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", product_purchased: "", review: "", rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // PAGINATION STATE: Set to 3 items max per view
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Fetch verified reviews from Supabase
  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error("Error fetching reviews from Supabase:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.review || !form.rating) return;
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("reviews")
        .insert([
          {
            name: form.name,
            location: form.location,
            product_purchased: form.product_purchased,
            rating: parseInt(form.rating, 10),
            review: form.review,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setSubmitted(true);
      setShowForm(false);
      setForm({ name: "", location: "", product_purchased: "", review: "", rating: 5 });
      setCurrentPage(1); // Reset back to first page upon a new review entry
      loadReviews();
    } catch (err) {
      console.error("Error creating testimonial review record:", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) 
    : "5.0";

  // CALCULATE ACTIVE PAGE BUNDLES
  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const indexOfLastReview = currentPage * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviewsSlice = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-muted py-32 px-6 border-y border-border/30" id="reviews">
      <div className="max-w-7xl mx-auto">
        <AnimatedElement className="text-center mb-16">
          <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase mb-4 block">Verified Reviews</span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-4 font-serif tracking-tight">Customer Ratings & Reviews</h2>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl font-black text-accent">{avgRating}</span>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-5 w-5 ${n <= Math.round(parseFloat(avgRating)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">{reviews.length} verified review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Real feedback from real customers who wear D-Kadris every day.</p>

          {!submitted ? (
            <Button onClick={() => setShowForm((s) => !s)} className="bg-primary text-primary-foreground font-bold rounded-full px-8 py-3 hover:scale-105 transition-all">
              <Star className="h-4 w-4 mr-2" /> {showForm ? "Close Form" : "Leave a Review"}
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent rounded-full px-6 py-3 font-bold text-sm">
              <ThumbsUp className="h-4 w-4" /> Thank you! Your review has been submitted.
            </div>
          )}
        </AnimatedElement>

        {showForm && (
          <AnimatedElement className="max-w-xl mx-auto mb-12">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
              <h3 className="font-black text-xl mb-6 text-[hsl(var(--background))]">Share Your Experience</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">Your Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="bg-muted border-border text-foreground mt-1" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">Location</Label>
                    <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="bg-muted border-border text-foreground mt-1" placeholder="Lagos, Nigeria" />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Product Purchased</Label>
                  <Input value={form.product_purchased} onChange={(e) => setForm((f) => ({ ...f, product_purchased: e.target.value }))} className="bg-muted border-border text-foreground mt-1" placeholder="e.g. Slim Fit Jeans" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-2 block">Your Rating *</Label>
                  <StarRatingInput value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Your Review *</Label>
                  <Textarea value={form.review} onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))} required className="bg-muted border-border text-foreground mt-1 min-h-[100px]" placeholder="Tell others about your experience with D-Kadris..." />
                </div>
                <Button type="submit" disabled={submitting || !form.rating} className="w-full bg-primary text-primary-foreground font-bold rounded-full py-3 hover:scale-105 transition-all">
                  <Send className="h-4 w-4 mr-2" /> {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </div>
          </AnimatedElement>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* The active sliced reviews mapping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentReviewsSlice.map((r, i) => (
                <AnimatedElement key={r.id || i} delay={i * 60}>
                  <ReviewCard review={r} />
                </AnimatedElement>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-3 text-center py-16 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Be the first to leave a review!</p>
                </div>
              )}
            </div>

            {/* NEW PAGINATION INTERFACE CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12 pt-4">
                <Button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  variant="outline"
                  className="rounded-full w-12 h-12 p-0 border-border bg-card hover:bg-muted text-foreground transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <span className="text-sm font-medium text-muted-foreground tracking-wide font-sans">
                  Page <strong className="text-foreground font-black">{currentPage}</strong> of {totalPages}
                </span>

                <Button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="rounded-full w-12 h-12 p-0 border-border bg-card hover:bg-muted text-foreground transition-all disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
            }
                  
