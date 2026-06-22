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
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [stats, setStats] = useState<ApiStats>({ totalDownloads: 0, totalFiles: 0, platforms: 0 });

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
        setFiles(Array.isArray(data) ? data : []);
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
        .then((s: ApiStats) => setStats(s))
        .catch(() => {});
    load();
    // Refresh every 30 seconds so the count stays live
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Get the latest file for each device type that has at least one file
  const availableDeviceTypes = (Object.keys(deviceTypeConfig) as DeviceType[]).filter((type) =>
    files.some((f) => f.deviceType === type)
  );

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

          {/* Loading state */}
          {loadingFiles && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm text-neutral-500">Loading available downloads...</p>
            </div>
          )}

          {/* Error state */}
          {!loadingFiles && fetchError && (
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
          {!loadingFiles && !fetchError && availableDeviceTypes.length === 0 && (
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

          {/* Download cards */}
          {!loadingFiles && !fetchError && availableDeviceTypes.length > 0 && (
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
    </div>
  );
}
