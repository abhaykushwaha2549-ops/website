import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '@/lib/api';
import { SplineScene } from '@/components/ui/spline';
import { Spotlight } from '@/components/ui/spotlight';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Monitor,
  Tv,
  Download,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  ArrowLeft,
  Clock,
  RefreshCw,
  Check,
  QrCode,
  Star,
  ChevronDown,
} from 'lucide-react';

// ─────────────────────────────────────────────
// DEVICE TYPE CONFIG (must match server)
// ─────────────────────────────────────────────
const deviceTypeConfig = {
  android: {
    label: 'Android Mobile',
    description: 'Take Lightinmotion everywhere. Optimised for all Android phones and tablets.',
    icon: Smartphone,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    textColor: 'text-emerald-400',
  },
  iphone: {
    label: 'iPhone / iOS',
    description: 'Beautifully crafted for iPhone and iPad. Smooth, fast, and native.',
    icon: Smartphone,
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    textColor: 'text-indigo-400',
  },
  tv: {
    label: 'TV App',
    description: 'Optimised for the big screen. Android TV, Fire TV, and more.',
    icon: Tv,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    textColor: 'text-violet-400',
  },
  desktop: {
    label: 'Desktop App',
    description: 'Full-featured experience for Windows, macOS, and Linux.',
    icon: Monitor,
    color: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    textColor: 'text-sky-400',
  },
} as const;

type DeviceType = keyof typeof deviceTypeConfig;

interface ApiFile {
  id: string;
  name: string;
  originalName: string;
  filename: string;
  deviceType: DeviceType;
  size: number;
  sizeFormatted: string;
  uploadedAt: string;
}

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimised performance across all platforms with minimal resource usage.',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'End-to-end encryption and secure download channels for your safety.',
  },
  {
    icon: Globe,
    title: 'Cross Platform',
    description: 'One seamless experience across mobile, TV, and desktop devices.',
  },
];

const navLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'Downloads', href: '#downloads' },
  { label: 'Features', href: '#features' },
];

interface ApiStats {
  totalDownloads: number;
  totalFiles: number;
  platforms: number;
}

// Animated number counter — counts up smoothly to the target value
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

// Format large numbers: 1500 → "1.5K", 1200000 → "1.2M"
function formatDownloadCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+';
  return n.toString();
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [files, setFiles] = useState<ApiFile[]>(() => {
    try {
      const cached = localStorage.getItem('lim_files');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingFiles, setLoadingFiles] = useState(() => {
    try {
      const cached = localStorage.getItem('lim_files');
      return cached ? false : true;
    } catch {
      return true;
    }
  });
  const [fetchError, setFetchError] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [stats, setStats] = useState<ApiStats>(() => {
    try {
      const cached = localStorage.getItem('lim_stats');
      return cached ? JSON.parse(cached) : { totalDownloads: 0, totalFiles: 0, platforms: 0 };
    } catch {
      return { totalDownloads: 0, totalFiles: 0, platforms: 0 };
    }
  });

  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('lim_user_email');
    } catch {
      return null;
    }
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<'approved' | 'pending' | 'rejected' | 'none' | null>(null);
  const [userPlan, setUserPlan] = useState<number | null>(() => {
    try {
      const plan = localStorage.getItem('lim_user_plan');
      return plan ? Number(plan) : null;
    } catch {
      return null;
    }
  });
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Checkout states
  const [checkoutPlan, setCheckoutPlan] = useState<number | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'details' | 'payment' | 'submitting' | 'done' | 'code'>('plans');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutScreenshot, setCheckoutScreenshot] = useState<File | null>(null);
  const [uploadingScreenshotProgress, setUploadingScreenshotProgress] = useState(0);
  const [plansQrs, setPlansQrs] = useState<Record<number, string | null>>({ 49: null, 109: null, 149: null });
  const [subGateTab, setSubGateTab] = useState<'subscribe' | 'access'>('subscribe');
  const [accessEmailInput, setAccessEmailInput] = useState('');

  // Product Code states
  const [productCodeInput, setProductCodeInput] = useState('');
  const [productCodeEmail, setProductCodeEmail] = useState('');
  const [verifyingProductCode, setVerifyingProductCode] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewUploadProgress, setReviewUploadProgress] = useState(0);
  const [selectedReviewZoomImage, setSelectedReviewZoomImage] = useState<string | null>(null);

  // Animate the download count
  const animatedDownloads = useCountUp(stats.totalDownloads);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch available files from backend
  useEffect(() => {
    fetch(`${API_BASE}/api/files`)
      .then((r) => r.json())
      .then((data: ApiFile[]) => {
        if (Array.isArray(data)) {
          setFiles(data);
          localStorage.setItem('lim_files', JSON.stringify(data));
        }
        setFetchError(false);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoadingFiles(false));
  }, []);

  // Fetch live download stats
  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/api/stats`)
        .then((r) => r.json())
        .then((s: ApiStats) => {
          if (s && typeof s.totalDownloads === 'number') {
            setStats(s);
            localStorage.setItem('lim_stats', JSON.stringify(s));
          }
        })
        .catch(() => {});
    load();
    // Refresh every 30 seconds so the count stays live
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch plan QRs
  useEffect(() => {
    fetch(`${API_BASE}/api/plans`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => setPlansQrs(data))
      .catch(() => {});
  }, []);

  const checkSubscription = async (emailToCheck: string, showNotificationError = false) => {
    if (!emailToCheck.trim()) {
      alert('Please enter a valid email address.');
      return;
    }
    setCheckingSubscription(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/check?email=${encodeURIComponent(emailToCheck.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data.status);
        if (data.status === 'approved') {
          setUserPlan(data.plan);
          localStorage.setItem('lim_user_email', emailToCheck.trim());
          localStorage.setItem('lim_user_plan', data.plan.toString());
        } else {
          setUserPlan(null);
          localStorage.removeItem('lim_user_plan');
          if (data.status === 'none') {
            if (showNotificationError) alert('No subscription found for this email.');
          } else {
            localStorage.setItem('lim_user_email', emailToCheck.trim());
          }
        }
      } else {
        if (showNotificationError) alert('Failed to check subscription status.');
      }
    } catch {
      if (showNotificationError) alert('Failed to check subscription status.');
    }
    setCheckingSubscription(false);
  };

  useEffect(() => {
    if (verifiedEmail) {
      checkSubscription(verifiedEmail);
    } else {
      setSubscriptionStatus('none');
    }
  }, [verifiedEmail]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
    setLoadingReviews(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewEmail || !reviewContent) {
      alert('Name, Email, and Content are required!');
      return;
    }

    setSubmittingReview(true);
    setReviewUploadProgress(0);

    let storagePath: string | null = null;

    try {
      if (reviewImage) {
        let isSupabase = false;
        try {
          const checkRes = await fetch(`${API_BASE}/api/plans`);
          if (checkRes.ok) {
            const data = await checkRes.json();
            const firstVal = Object.values(data)[0];
            if (firstVal && (firstVal as string).includes('backblazeb2.com')) {
              isSupabase = true;
            }
          }
        } catch {}

        if (isSupabase) {
          const initRes = await fetch(`${API_BASE}/api/reviews/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: reviewImage.name,
              contentType: reviewImage.type,
            }),
          });

          if (!initRes.ok) throw new Error('Failed to initialize review image upload');
          const initData = await initRes.json();
          storagePath = initData.storagePath;

          const xhr = new XMLHttpRequest();
          xhr.open('PUT', initData.uploadUrl, true);
          xhr.setRequestHeader('Content-Type', reviewImage.type);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setReviewUploadProgress((event.loaded / event.total) * 100);
            }
          };

          const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve(true);
              else reject(new Error('B2 upload failed'));
            };
            xhr.onerror = () => reject(new Error('Network error during B2 upload'));
          });

          xhr.send(reviewImage);
          await uploadPromise;
        } else {
          const formData = new FormData();
          formData.append('file', reviewImage);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}/api/reviews/upload-local`, true);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setReviewUploadProgress((event.loaded / event.total) * 100);
            }
          };

          const uploadPromise = new Promise<string>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const resData = JSON.parse(xhr.responseText);
                  resolve(resData.storagePath);
                } catch {
                  reject(new Error('Failed to parse local upload response'));
                }
              } else {
                reject(new Error('Local upload failed'));
              }
            };
            xhr.onerror = () => reject(new Error('Network error during local upload'));
          });

          xhr.send(formData);
          storagePath = await uploadPromise;
        }
      }

      const finalizeRes = await fetch(`${API_BASE}/api/reviews/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName.trim(),
          email: reviewEmail.trim().toLowerCase(),
          rating: reviewRating,
          content: reviewContent.trim(),
          storagePath,
        }),
      });

      if (finalizeRes.ok) {
        alert('Thank you for your review!');
        setReviewName('');
        setReviewEmail('');
        setReviewRating(5);
        setReviewContent('');
        setReviewImage(null);
        fetchReviews();
      } else {
        const errData = await finalizeRes.json();
        alert(errData.error || 'Failed to save review.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during review submission.');
    }
    setSubmittingReview(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutEmail || !checkoutScreenshot || !checkoutPlan) {
      alert('All fields and the payment screenshot are required!');
      return;
    }
    setCheckoutStep('submitting');
    setUploadingScreenshotProgress(0);

    try {
      // Step 1: Init screenshot upload
      const initRes = await fetch(`${API_BASE}/api/subscription/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: checkoutScreenshot.name }),
      });

      if (!initRes.ok) {
        throw new Error('Failed to initialize upload');
      }

      const initData = await initRes.json();

      if (initData.useSupabase) {
        // Direct upload to B2 via signed URL
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', initData.signedUrl);
        xhr.setRequestHeader('Content-Type', 'image/jpeg');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadingScreenshotProgress((e.loaded / e.total) * 100);
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Step 3: Finalize
            const finRes = await fetch(`${API_BASE}/api/subscription/finalize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: checkoutName,
                email: checkoutEmail.trim().toLowerCase(),
                planPrice: checkoutPlan,
                storagePath: initData.storagePath,
              }),
            });
            if (finRes.ok) {
              setCheckoutStep('done');
              setVerifiedEmail(checkoutEmail.trim());
              setSubscriptionStatus('pending');
              localStorage.setItem('lim_user_email', checkoutEmail.trim());
            } else {
              const errData = await finRes.json();
              alert(errData.error || 'Failed to submit payment details.');
              setCheckoutStep('payment');
            }
          } else {
            alert('Failed to upload screenshot to server.');
            setCheckoutStep('payment');
          }
        };

        xhr.onerror = () => {
          alert('Network error during upload.');
          setCheckoutStep('payment');
        };

        xhr.send(checkoutScreenshot);
      } else {
        // Local mode fallback
        const formData = new FormData();
        formData.append('file', checkoutScreenshot);
        formData.append('name', checkoutName);
        formData.append('email', checkoutEmail.trim().toLowerCase());
        formData.append('planPrice', checkoutPlan.toString());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/subscription/upload-local`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadingScreenshotProgress((e.loaded / e.total) * 100);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            setCheckoutStep('done');
            setVerifiedEmail(checkoutEmail.trim());
            setSubscriptionStatus('pending');
            localStorage.setItem('lim_user_email', checkoutEmail.trim());
          } else {
            alert('Upload failed. Check server console.');
            setCheckoutStep('payment');
          }
        };

        xhr.onerror = () => {
          alert('Network error during upload.');
          setCheckoutStep('payment');
        };

        xhr.send(formData);
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during submission.');
      setCheckoutStep('payment');
    }
  };

  const handleLogoutSubscription = () => {
    localStorage.removeItem('lim_user_email');
    localStorage.removeItem('lim_user_plan');
    setVerifiedEmail(null);
    setUserPlan(null);
    setSubscriptionStatus('none');
    setCheckoutStep('plans');
    setCheckoutPlan(null);
  };

  const handleVerifyProductCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCodeEmail || !productCodeInput) {
      alert('Email and Product Code are required!');
      return;
    }
    setVerifyingProductCode(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: productCodeEmail.trim().toLowerCase(),
          code: productCodeInput.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        await res.json();
        alert('Product Code Verified successfully! Unlocked all downloads.');
        setVerifiedEmail(productCodeEmail.trim().toLowerCase());
        setSubscriptionStatus('approved');
        setUserPlan(149);
        localStorage.setItem('lim_user_email', productCodeEmail.trim().toLowerCase());
        localStorage.setItem('lim_user_plan', '149');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to verify product code.');
      }
    } catch {
      alert('Network error while verifying product code.');
    }
    setVerifyingProductCode(false);
  };

  // Get the latest file for each device type that has at least one file, filtered by plan
  const allowedTypesByPlan = (() => {
    if (subscriptionStatus !== 'approved' || userPlan === null) return [];
    if (userPlan === 149) return ['android', 'iphone', 'tv', 'desktop'];
    if (userPlan === 109) return ['android', 'iphone', 'desktop'];
    if (userPlan === 49) return ['desktop'];
    return [];
  })();

  const availableDeviceTypes = (Object.keys(deviceTypeConfig) as DeviceType[])
    .filter((type) => allowedTypesByPlan.includes(type))
    .filter((type) => files.some((f) => f.deviceType === type));

  const getLatestFile = (type: DeviceType) =>
    files.find((f) => f.deviceType === type) ?? null;

  const handleDownload = (file: ApiFile) => {
    setDownloadingId(file.id);
    // Open download URL in a new tab — backend redirects to signed Supabase URL
    // or streams directly from disk in dev mode
    window.open(`${API_BASE}/api/download/${file.id}`, '_blank');
    setTimeout(() => setDownloadingId(null), 2000);
  };

  // Stats derived from real data
  const platformCount = availableDeviceTypes.length || 4;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/logo.png" alt="Lightinmotion Logo" className="h-10 w-auto object-contain" />
                <span className="text-xl font-bold tracking-tight">Lightinmotion</span>
              </a>
            </motion.div>

            {/* Desktop Nav */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center gap-8"
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://lightinmotion-2.myshopify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              >
                Visit Store
              </a>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/5"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm text-neutral-400 hover:text-white py-2 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="https://lightinmotion-2.myshopify.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm px-4 py-2 rounded-lg bg-white/10 text-white text-center"
                >
                  Visit Store
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ── */}
      <section id="hero" className="relative min-h-screen pt-16">
        <Card className="w-full h-[calc(100vh-64px)] bg-black/[0.96] relative overflow-hidden border-0 rounded-none">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

          <div className="flex h-full flex-col md:flex-row">
            {/* Left content */}
            <div className="flex-1 p-6 md:p-12 relative z-10 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-neutral-400">Available on All Platforms</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                    Lightin
                  </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                    motion
                  </span>
                </h1>

                <p className="mt-4 md:mt-6 text-neutral-400 max-w-lg text-base md:text-lg leading-relaxed">
                  Your content, everywhere you need it. Download our apps for mobile, iPhone, TV, and
                  desktop — all designed for seamless performance.
                </p>

                <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#downloads"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-neutral-200 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Download Now
                  </a>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-medium border border-white/10 hover:bg-white/10 transition-colors duration-200"
                  >
                    Learn More
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Stats */}
                <div className="mt-10 md:mt-14 grid grid-cols-3 gap-4 md:gap-8 max-w-md">
                  {[
                    {
                      value: stats.totalDownloads > 0 ? formatDownloadCount(animatedDownloads) : '—',
                      label: 'Downloads',
                      live: stats.totalDownloads > 0,
                    },
                    { value: platformCount.toString(), label: 'Platforms', live: false },
                    { value: '4.8', label: 'Rating', live: false },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="flex items-end gap-1">
                        <div className="text-xl md:text-2xl font-bold text-white tabular-nums">
                          {stat.value}
                        </div>
                        {stat.live && (
                          <span className="mb-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right content - Spline 3D */}
            <div className="flex-1 relative min-h-[300px] md:min-h-0">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* ── Downloads Section ── */}
      <section id="downloads" className="relative py-24 md:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
              Choose Your Platform
            </h2>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
              Download Lightinmotion for your preferred device. All platforms are kept up to date with
              the latest features and security patches.
            </p>
          </motion.div>

          {/* ── Subscriptions Check Loader ── */}
          {checkingSubscription && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm text-neutral-500">Verifying your subscription status...</p>
            </div>
          )}

          {/* ── Approved subscriber view: show actual downloads list ── */}
          {!checkingSubscription && subscriptionStatus === 'approved' && (
            <>
              {/* Subscriber Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mb-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-neutral-500">Active Approved Subscriber</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[300px]">
                      {verifiedEmail} <span className="text-emerald-400 font-medium">· Plan {userPlan}/-</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogoutSubscription}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-400 hover:text-white transition-all"
                >
                  Change Account
                </button>
              </div>

              {/* Loading state */}
              {loadingFiles && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <p className="text-sm text-neutral-500">Loading available downloads...</p>
                </div>
              )}

              {/* Error state */}
              {!loadingFiles && fetchError && files.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm text-neutral-400">Could not reach the server</p>
                  <p className="text-xs text-neutral-600">Make sure the backend is running on port 3001</p>
                </motion.div>
              )}

              {/* No files state */}
              {!loadingFiles && files.length === 0 && !fetchError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Download className="w-6 h-6 text-neutral-600" />
                  </div>
                  <p className="text-sm text-neutral-500">No downloads available yet</p>
                  <p className="text-xs text-neutral-700">Check back soon for new releases</p>
                </motion.div>
              )}
            </>
          )}

          {/* ── Pending Verification View ── */}
          {!checkingSubscription && subscriptionStatus === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Subscription Verification Pending</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Your payment screenshot for <span className="text-white font-medium">{verifiedEmail}</span> is being verified by our administrators. 
                This usually takes a few minutes.
              </p>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => checkSubscription(verifiedEmail!)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold flex items-center justify-center gap-1.5 transition-all text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh / Check Status
                </button>
                <button
                  onClick={handleLogoutSubscription}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all text-xs font-semibold"
                >
                  Change Email / Re-subscribe
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Rejected Subscription View ── */}
          {!checkingSubscription && subscriptionStatus === 'rejected' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Payment Verification Failed</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                We were unable to confirm the payment screenshot for <span className="text-white font-medium">{verifiedEmail}</span>. 
                Please try subscribing again with a valid transaction receipt.
              </p>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleLogoutSubscription}
                  className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all text-sm animate-pulse"
                >
                  Try Again / Re-subscribe
                </button>
                <button
                  onClick={handleLogoutSubscription}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all text-xs font-semibold"
                >
                  Switch Email
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Checkout / Subscription Gate View ── */}
          {!checkingSubscription && subscriptionStatus === 'none' && (
            <div className="max-w-4xl mx-auto">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mb-8 max-w-xs mx-auto">
                <button
                  onClick={() => setSubGateTab('subscribe')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    subGateTab === 'subscribe'
                      ? 'bg-white/10 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Subscribe
                </button>
                <button
                  onClick={() => setSubGateTab('access')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    subGateTab === 'access'
                      ? 'bg-white/10 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Enter Email
                </button>
              </div>

              {subGateTab === 'access' ? (
                /* Already Subscribed Access Gate */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4"
                >
                  <div className="text-center">
                    <h3 className="text-base font-bold text-white">Access Downloads</h3>
                    <p className="text-xs text-neutral-500 mt-1">Enter your registered email address to unlock downloads</p>
                  </div>
                  <div className="space-y-3.5 pt-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={accessEmailInput}
                      onChange={(e) => setAccessEmailInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                    />
                    <button
                      onClick={() => checkSubscription(accessEmailInput, true)}
                      className="w-full py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-sm"
                    >
                      Check Access
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Purchase Subscription Step-by-Step Checkout */
                <div className="space-y-8">
                  {checkoutStep === 'plans' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="grid gap-6 md:grid-cols-3">
                        {[
                          {
                            price: 49,
                            title: 'Desktop App Plan',
                            desc: 'Essential plan designed exclusively for computer users.',
                            benefits: ['Access to Desktop App', 'Windows, macOS, Linux', 'Regular software updates'],
                          },
                          {
                            price: 109,
                            title: 'Mobile & Desktop Plan',
                            desc: 'Dual access plan for both mobile and desktop convenience.',
                            benefits: ['Access to Android Mobile App', 'Access to Desktop App', 'Regular software updates'],
                          },
                          {
                            price: 149,
                            title: 'All-in-One Full Plan',
                            desc: 'All-inclusive premium access for every device.',
                            benefits: ['Access to Android Mobile App', 'Access to Desktop App', 'Access to TV App (Android TV, Fire TV)', 'Priority customer support', 'Regular software updates'],
                          },
                        ].map((plan) => (
                          <Card
                            key={plan.price}
                            className="bg-white/[0.01] border-white/5 flex flex-col justify-between h-full p-6 hover:border-white/10 transition-colors group cursor-pointer"
                            onClick={() => {
                              setCheckoutPlan(plan.price);
                              setCheckoutStep('details');
                            }}
                          >
                            <div className="space-y-4">
                              <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                                {plan.title}
                              </h3>
                              <p className="text-xs text-neutral-500 leading-relaxed">{plan.desc}</p>
                              <div className="text-2xl font-bold text-white pt-2">
                                {plan.price} /- <span className="text-xs text-neutral-500 font-normal">one-time</span>
                              </div>
                              <ul className="space-y-2 pt-4 border-t border-white/5">
                                {plan.benefits.map((b, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <button className="w-full mt-6 py-2.5 rounded-xl bg-white/5 group-hover:bg-white group-hover:text-black text-white font-semibold transition-all text-xs border border-white/10 group-hover:border-transparent">
                              Select Plan
                            </button>
                          </Card>
                        ))}
                      </div>

                      {/* Product Code link */}
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setCheckoutStep('code')}
                          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors underline underline-offset-4"
                        >
                          Already have a Lightinmotion product? Enter product code
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 'details' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setCheckoutStep('plans')}
                          className="p-1 rounded bg-white/5 text-neutral-400 hover:text-white transition-all"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-semibold text-white">Back to Plans</span>
                      </div>
                      <h3 className="text-base font-bold text-white">Enter Subscription Details</h3>
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1.5 font-medium">Your Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={checkoutName}
                            onChange={(e) => setCheckoutName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1.5 font-medium">Email Address (for download access) *</label>
                          <input
                            type="email"
                            required
                            placeholder="johndoe@example.com"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (!checkoutName || !checkoutEmail) {
                              alert('Please fill in all fields!');
                              return;
                            }
                            setCheckoutStep('payment');
                          }}
                          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-sm"
                        >
                          Continue to Payment
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 'payment' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setCheckoutStep('details')}
                          className="p-1 rounded bg-white/5 text-neutral-400 hover:text-white transition-all"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-semibold text-white">Back to Details</span>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h3 className="text-base font-bold text-white">Scan & Pay {checkoutPlan}/-</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Scan the QR code below using any UPI app (Google Pay, PhonePe, Paytm, etc.) to complete payment.
                        </p>
                      </div>

                      <div className="w-44 h-44 bg-white border border-white/15 rounded-xl flex items-center justify-center overflow-hidden mx-auto mb-4 p-2">
                        {plansQrs[checkoutPlan!] ? (
                          <img
                            src={plansQrs[checkoutPlan!] || undefined}
                            alt={`Plan ${checkoutPlan} UPI QR`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-3">
                            <QrCode className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                            <span className="text-[10px] text-neutral-500 leading-tight block">
                              Waiting for Admin to upload QR code...
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1.5 font-medium">
                            Upload Payment Screenshot *
                          </label>
                          <div className="relative border-2 border-dashed border-white/15 hover:border-white/25 rounded-xl p-4 text-center cursor-pointer bg-white/[0.01]">
                            <input
                              type="file"
                              required
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setCheckoutScreenshot(e.target.files[0]);
                                }
                              }}
                            />
                            <div className="space-y-1">
                              <Upload className="w-5 h-5 text-neutral-500 mx-auto" />
                              <p className="text-xs font-semibold text-white">
                                {checkoutScreenshot ? checkoutScreenshot.name : 'Select or drop payment screenshot'}
                              </p>
                              <p className="text-[10px] text-neutral-600">PNG, JPG, JPEG, WEBP up to 10MB</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleCheckoutSubmit}
                          disabled={!checkoutScreenshot}
                          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Screenshot
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 'submitting' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="max-w-md mx-auto p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4"
                    >
                      <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                      <h3 className="text-base font-bold text-white">Submitting Payment Verification</h3>
                      <div className="max-w-xs mx-auto bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadingScreenshotProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500">Uploading screenshot... {Math.round(uploadingScreenshotProgress)}%</p>
                    </motion.div>
                  )}

                  {checkoutStep === 'done' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Screenshot Uploaded Successfully!</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Your payment verification has been submitted. Our administrators are currently verifying your payment screenshot. 
                        Once approved, you will be able to access your downloads using <span className="text-white">{checkoutEmail}</span>.
                      </p>
                      <button
                        onClick={() => {
                          setCheckoutStep('plans');
                          setCheckoutPlan(null);
                        }}
                        className="w-full mt-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-sm"
                      >
                        Okay, got it
                      </button>
                    </motion.div>
                  )}

                  {checkoutStep === 'code' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4 text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => {
                            setCheckoutStep('plans');
                          }}
                          className="p-1 rounded bg-white/5 text-neutral-400 hover:text-white transition-all"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-semibold text-white">Back to Plans</span>
                      </div>

                      <div className="text-center space-y-1">
                        <h3 className="text-base font-bold text-white">Enter Product Authorization Code</h3>
                        <p className="text-xs text-neutral-500">
                          Enter your registered email and your unique product code to verify ownership.
                        </p>
                      </div>

                      <form onSubmit={handleVerifyProductCode} className="space-y-4 pt-2">
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1.5 font-medium">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="johndoe@example.com"
                            value={productCodeEmail}
                            onChange={(e) => setProductCodeEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 block mb-1.5 font-medium">Product Code *</label>
                          <input
                            type="text"
                            required
                            placeholder="LIM-XXXX-XXXX"
                            value={productCodeInput}
                            onChange={(e) => setProductCodeInput(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={verifyingProductCode}
                          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {verifyingProductCode ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Verify & Access Downloads
                        </button>
                      </form>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Download cards */}
          {!loadingFiles && availableDeviceTypes.length > 0 && (
            <div
              className={`grid gap-6 ${
                availableDeviceTypes.length === 1
                  ? 'max-w-sm mx-auto'
                  : availableDeviceTypes.length === 2
                  ? 'md:grid-cols-2 max-w-2xl mx-auto'
                  : availableDeviceTypes.length === 3
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {availableDeviceTypes.map((type, index) => {
                const cfg = deviceTypeConfig[type];
                const latestFile = getLatestFile(type)!;
                const Icon = cfg.icon;
                const isDownloading = downloadingId === latestFile.id;

                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      className={`relative overflow-hidden bg-black/40 backdrop-blur-sm border ${cfg.borderColor} hover:border-white/20 transition-all duration-300 group h-full`}
                    >
                      <div
                        className={`absolute inset-0 ${cfg.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />
                      <div className="relative p-6 md:p-8 flex flex-col h-full">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center mb-5 flex-shrink-0`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Title & description */}
                        <h3 className="text-xl font-semibold text-white mb-2">{cfg.label}</h3>
                        <p className="text-sm text-neutral-400 mb-5 leading-relaxed flex-1">
                          {cfg.description}
                        </p>

                        {/* File meta */}
                        <div className="flex items-center justify-between mb-5">
                          <span className="text-xs text-neutral-500 bg-white/5 px-2 py-1 rounded-md truncate max-w-[60%]">
                            {latestFile.originalName}
                          </span>
                          <span className="text-xs text-neutral-500">{latestFile.sizeFormatted}</span>
                        </div>

                        {/* Download button */}
                        <button
                          id={`download-${type}`}
                          onClick={() => handleDownload(latestFile)}
                          disabled={isDownloading}
                          className={`w-full py-3 rounded-xl bg-gradient-to-r ${cfg.color} text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60`}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download
                            </>
                          )}
                        </button>

                        {/* Upload date */}
                        <p className="text-[10px] text-neutral-700 text-center mt-3">
                          Updated {new Date(latestFile.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Reviews Section ── */}
      <section id="reviews" className="relative py-24 bg-black border-t border-white/5 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
              Customer Feedback
            </h2>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto text-sm">
              See what our community says about their Lightinmotion experience. Real reviews from real users.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Column: Submit form */}
            <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Share Your Review</h3>
              <p className="text-xs text-neutral-500">
                Let us know what you think! You can also upload a picture of your setup.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="johndoe@example.com"
                    value={reviewEmail}
                    onChange={(e) => setReviewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Rating *</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 transition-all hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Review Content *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your review here..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Product / Setup Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReviewImage(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="review-image-file"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('review-image-file')?.click()}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {reviewImage ? reviewImage.name : 'Upload Image'}
                  </button>
                  {reviewImage && (
                    <p className="text-[10px] text-emerald-400 mt-1 text-center">Selected: {reviewImage.name}</p>
                  )}
                </div>

                {submittingReview && reviewUploadProgress > 0 && (
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-300"
                      style={{ width: `${reviewUploadProgress}%` }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Reviews list */}
            <div className="lg:col-span-8 space-y-6">
              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-20 border border-white/5 bg-white/[0.01] rounded-2xl text-neutral-500">
                  <Star className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-sm">No reviews yet</p>
                  <p className="text-xs text-neutral-600 mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {reviews.slice(0, visibleReviewsCount).map((item) => (
                      <Card
                        key={item.id}
                        className="bg-white/[0.01] border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-colors h-full"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 text-white flex items-center justify-center text-xs font-bold border border-white/5 uppercase">
                                {item.name.slice(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white leading-tight">{item.name}</h4>
                                <span className="text-[10px] text-neutral-500">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-neutral-400 leading-relaxed font-light break-words whitespace-pre-line">
                            {item.content}
                          </p>
                        </div>

                        {item.imageUrl && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <img
                              src={item.imageUrl}
                              alt="Review attachment"
                              onClick={() => setSelectedReviewZoomImage(item.imageUrl)}
                              className="w-full max-h-32 object-cover rounded-xl border border-white/5 cursor-zoom-in hover:brightness-110 transition-all"
                            />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {visibleReviewsCount < reviews.length && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setVisibleReviewsCount(prev => prev + 3)}
                        className="px-6 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                      >
                        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                        Load More Reviews
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="relative py-24 md:py-32 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
              Why Choose Lightinmotion
            </h2>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
              Built with performance, security, and user experience at the core.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors duration-300 h-full">
                  <div className="p-6 md:p-8">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Lightinmotion Logo" className="h-6 w-auto object-contain" />
              <span className="text-sm font-semibold text-white">Lightinmotion</span>
            </div>

            <div className="flex items-center gap-6">
              {[
                { icon: Github, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
                { icon: Instagram, href: 'https://www.instagram.com/light_in__motion/' },
                { icon: Youtube, href: 'https://www.youtube.com/@lightinmotionrgb/shorts' },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-white transition-colors duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            <p className="text-xs text-neutral-600">
              &copy; {new Date().getFullYear()} Lightinmotion. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox modal for review attachment image zoom */}
      <AnimatePresence>
        {selectedReviewZoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReviewZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setSelectedReviewZoomImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedReviewZoomImage}
              alt="Review Attachment Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-lg border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
