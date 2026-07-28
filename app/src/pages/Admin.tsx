import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Upload,
  Smartphone,
  Tv,
  Monitor,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  FileArchive,
  HardDrive,
  Clock,
  Zap,
  AlertCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ChevronDown,
  RefreshCw,
  Loader2,
  QrCode,
  Coins,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Key,
} from 'lucide-react';

// ─────────────────────────────────────────────
// DEVICE TYPE CONFIG
// ─────────────────────────────────────────────
const deviceTypeConfig = {
  android: {
    label: 'Android Mobile',
    shortLabel: 'Android',
    icon: Smartphone,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-500 to-teal-600',
    dot: 'bg-emerald-400',
  },
  iphone: {
    label: 'iPhone / iOS',
    shortLabel: 'iPhone',
    icon: Smartphone,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    gradient: 'from-indigo-500 to-blue-600',
    dot: 'bg-indigo-400',
  },
  tv: {
    label: 'TV App',
    shortLabel: 'TV',
    icon: Tv,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    gradient: 'from-violet-500 to-purple-600',
    dot: 'bg-violet-400',
  },
  desktop: {
    label: 'Desktop App',
    shortLabel: 'Desktop',
    icon: Monitor,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    gradient: 'from-sky-500 to-blue-600',
    dot: 'bg-sky-400',
  },
} as const;

type DeviceType = keyof typeof deviceTypeConfig;

interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  filename: string;
  deviceType: DeviceType;
  size: number;
  sizeFormatted: string;
  uploadedAt: string;
}

// API_BASE is imported from @/lib/api

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Incorrect email or password');
      }
    } catch {
      setError('Cannot reach server. Make sure the backend is running on port 3001.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Lightinmotion Logo" className="h-20 w-auto object-contain mb-4" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Access</h1>
            <p className="text-neutral-500 text-sm mt-1">Lightinmotion Dashboard</p>
          </div>
        </div>

        <Card className="bg-white/[0.03] border border-white/10 shadow-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-2 block">Email Address</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.07] transition-all duration-200"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 mb-2 block">Password</label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.07] transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                id="login-submit"
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-5">
          <a
            href="/"
            className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3 h-3" /> Back to website
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEVICE TYPE SELECTOR COMPONENT
// ─────────────────────────────────────────────
function DeviceTypeSelector({
  value,
  onChange,
}: {
  value: DeviceType | '';
  onChange: (v: DeviceType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = value ? deviceTypeConfig[value] : null;

  return (
    <div className="relative" ref={ref}>
      <button
        id="device-type-selector"
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
          selected
            ? `${selected.bg} ${selected.border} ${selected.color}`
            : 'bg-white/5 border-white/10 text-neutral-500 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {selected ? (
            <>
              <div className={`w-2 h-2 rounded-full ${selected.dot}`} />
              <selected.icon className="w-4 h-4" />
              <span className="font-medium">{selected.label}</span>
            </>
          ) : (
            <span>Select compatible device</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          >
            {(Object.entries(deviceTypeConfig) as [DeviceType, typeof deviceTypeConfig[DeviceType]][]).map(
              ([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 hover:bg-white/5 ${
                      value === key ? `${cfg.bg} ${cfg.color}` : 'text-neutral-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{cfg.label}</span>
                    {value === key && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN ADMIN DASHBOARD
// ─────────────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | ''>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'files' | 'subscriptions' | 'qrs' | 'codes'>('files');

  // Subscriptions states
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);

  // Plans/QRs states
  const [plans, setPlans] = useState<{ 49: string | null; 109: string | null; 149: string | null }>({ 49: null, 109: null, 149: null });
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [uploadingQrPlan, setUploadingQrPlan] = useState<number | null>(null);
  const [uploadingQrProgress, setUploadingQrProgress] = useState(0);

  // Product Codes states
  const [productCodes, setProductCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Fetch files
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch {
      showNotification('Failed to load files. Is the server running?', 'error');
    }
    setLoading(false);
  };

  // ── Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscriptions`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      } else {
        showNotification('Failed to load subscriptions.', 'error');
      }
    } catch {
      showNotification('Failed to load subscriptions.', 'error');
    }
    setLoadingSubs(false);
  };

  // ── Fetch plans
  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch(`${API_BASE}/api/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch {
      showNotification('Failed to load plan QR codes.', 'error');
    }
    setLoadingPlans(false);
  };

  // ── Fetch product codes
  const fetchProductCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/product-codes`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setProductCodes(data);
      } else {
        showNotification('Failed to load product codes.', 'error');
      }
    } catch {
      showNotification('Failed to load product codes.', 'error');
    }
    setLoadingCodes(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (activeTab === 'qrs') {
      fetchPlans();
    } else if (activeTab === 'codes') {
      fetchProductCodes();
    }
  }, [activeTab]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [selectedDeviceType]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // ── Process & upload file
  const processFile = async (file: File) => {
    if (!selectedDeviceType) {
      showNotification('Please select a compatible device type first.', 'error');
      return;
    }

    const ALLOWED = ['.apk', '.exe', '.dmg', '.zip', '.ipa'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED.includes(ext)) {
      showNotification(`Invalid file type. Allowed: ${ALLOWED.join(', ')}`, 'error');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      showNotification('File exceeds 500 MB limit.', 'error');
      return;
    }

    setUploadingFileName(file.name);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Initialize the upload (request signed URL or local fallback indicator)
      const initRes = await fetch(`${API_BASE}/api/upload/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!initRes.ok) {
        const errData = await initRes.json();
        throw new Error(errData.error || 'Failed to initialize upload.');
      }

      const initData = await initRes.json();

      if (initData.useSupabase) {
        // Step 2: Upload directly to Supabase Storage via PUT
        const { signedUrl, storagePath } = initData;

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress((e.loaded / e.total) * 100);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200 || xhr.status === 201) {
            // Step 3: Finalize upload with metadata
            try {
              const finalizeRes = await fetch(`${API_BASE}/api/upload/finalize`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceType: selectedDeviceType,
                  displayName: file.name,
                  storagePath,
                  originalName: file.name,
                  size: file.size,
                }),
              });

              setUploading(false);
              setUploadProgress(0);

              if (finalizeRes.ok) {
                const newFile: UploadedFile = await finalizeRes.json();
                setFiles((prev) => [newFile, ...prev]);
                showNotification(`"${file.name}" uploaded successfully!`);
                setSelectedDeviceType('');
                if (inputRef.current) inputRef.current.value = '';
              } else {
                const errData = await finalizeRes.json();
                showNotification(errData.error || 'Failed to finalize upload.', 'error');
              }
            } catch (err: any) {
              setUploading(false);
              showNotification(err.message || 'Error finalizing upload.', 'error');
            }
          } else {
            setUploading(false);
            setUploadProgress(0);
            try {
              const err = JSON.parse(xhr.responseText);
              showNotification(err.error || 'Direct upload failed.', 'error');
            } catch {
              showNotification('Direct upload failed.', 'error');
            }
          }
        });

        xhr.addEventListener('error', () => {
          setUploading(false);
          showNotification('Network error during direct upload. Check browser console or CORS.', 'error');
        });

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.send(file);

      } else {
        // Fallback: Local disk upload (the traditional multipart route)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('deviceType', selectedDeviceType);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress((e.loaded / e.total) * 100);
          }
        });

        xhr.addEventListener('load', () => {
          setUploading(false);
          setUploadProgress(0);
          if (xhr.status === 200) {
            const newFile: UploadedFile = JSON.parse(xhr.responseText);
            setFiles((prev) => [newFile, ...prev]);
            showNotification(`"${file.name}" uploaded successfully!`);
            setSelectedDeviceType('');
            if (inputRef.current) inputRef.current.value = '';
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              showNotification(err.error || 'Upload failed.', 'error');
            } catch {
              showNotification('Upload failed.', 'error');
            }
          }
        });

        xhr.addEventListener('error', () => {
          setUploading(false);
          showNotification('Network error during upload.', 'error');
        });

        xhr.open('POST', `${API_BASE}/api/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      }
    } catch (err: any) {
      setUploading(false);
      showNotification(err.message || 'Failed to start upload process.', 'error');
    }
  };

  // ── Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/files/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        showNotification('File deleted successfully');
      } else {
        const d = await res.json();
        showNotification(d.error || 'Delete failed.', 'error');
      }
    } catch {
      showNotification('Network error.', 'error');
    }
  };

  // ── Copy download link
  const handleCopyLink = (file: UploadedFile) => {
    const url = `${API_BASE}/api/download/${file.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
      showNotification('Download link copied!');
    });
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/product-codes/generate`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('Product code generated successfully!');
        fetchProductCodes();
      } else {
        showNotification('Failed to generate product code.', 'error');
      }
    } catch {
      showNotification('Failed to generate product code.', 'error');
    }
    setGeneratingCode(false);
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to revoke/delete this product code?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/product-codes/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('Product code revoked.');
        fetchProductCodes();
      } else {
        showNotification('Failed to revoke product code.', 'error');
      }
    } catch {
      showNotification('Failed to revoke product code.', 'error');
    }
  };

  // ── Stats
  const totalSizeMB = files.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024);
  const lastUpload = files[0] ? new Date(files[0].uploadedAt).toLocaleDateString() : 'N/A';

  const handleApproveSub = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscriptions/approve/${id}`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('Subscription approved successfully!');
        fetchSubscriptions();
      } else {
        showNotification('Failed to approve subscription.', 'error');
      }
    } catch {
      showNotification('Failed to approve subscription.', 'error');
    }
  };

  const handleRejectSub = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscriptions/reject/${id}`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('Subscription rejected.');
        fetchSubscriptions();
      } else {
        showNotification('Failed to reject subscription.', 'error');
      }
    } catch {
      showNotification('Failed to reject subscription.', 'error');
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription record?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscriptions/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('Subscription record deleted.');
        fetchSubscriptions();
      } else {
        showNotification('Failed to delete subscription.', 'error');
      }
    } catch {
      showNotification('Failed to delete subscription.', 'error');
    }
  };

  const handleUploadQr = async (price: number, file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showNotification('Only PNG, JPG, JPEG, or WEBP files allowed.', 'error');
      return;
    }
    setUploadingQrPlan(price);
    setUploadingQrProgress(0);

    try {
      const initRes = await fetch(`${API_BASE}/api/admin/plans/qr/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!initRes.ok) {
        throw new Error('Failed to initialize upload');
      }

      const initData = await initRes.json();

      if (initData.useSupabase) {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', initData.signedUrl);
        xhr.setRequestHeader('Content-Type', 'image/jpeg');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadingQrProgress((e.loaded / e.total) * 100);
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const finRes = await fetch(`${API_BASE}/api/admin/plans/qr/finalize`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
              },
              body: JSON.stringify({ price, storagePath: initData.storagePath }),
            });
            if (finRes.ok) {
              showNotification(`QR Code for Plan ${price}/- updated!`);
              fetchPlans();
            } else {
              showNotification('Failed to finalize QR code upload', 'error');
            }
          } else {
            showNotification('Failed to upload image to storage server', 'error');
          }
          setUploadingQrPlan(null);
        };

        xhr.onerror = () => {
          showNotification('Network error during B2 upload', 'error');
          setUploadingQrPlan(null);
        };

        xhr.send(file);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('price', price.toString());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/admin/plans/qr/local`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadingQrProgress((e.loaded / e.total) * 100);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            showNotification(`QR Code for Plan ${price}/- updated!`);
            fetchPlans();
          } else {
            showNotification('Upload failed. Check server console.', 'error');
          }
          setUploadingQrPlan(null);
        };

        xhr.onerror = () => {
          showNotification('Network error during local upload', 'error');
          setUploadingQrPlan(null);
        };

        xhr.send(formData);
      }
    } catch (e: any) {
      showNotification(e.message || 'An error occurred during upload', 'error');
      setUploadingQrPlan(null);
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    if (subFilter === 'all') return true;
    return sub.status === subFilter;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl ${
              notification.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-1 opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                <ArrowLeft className="w-4 h-4" />
              </a>
              <a href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="Lightinmotion Logo" className="h-8 w-auto object-contain" />
                <span className="text-base font-semibold text-white">Lightinmotion</span>
              </a>
              <span className="text-neutral-700">/</span>
              <span className="text-sm text-neutral-400">Admin</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="refresh-files"
                onClick={() => {
                  if (activeTab === 'files') fetchFiles();
                  else if (activeTab === 'subscriptions') fetchSubscriptions();
                  else if (activeTab === 'qrs') fetchPlans();
                  else if (activeTab === 'codes') fetchProductCodes();
                }}
                className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                id="admin-logout"
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'files'
                ? 'bg-white/10 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-white/10 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('qrs')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'qrs'
                ? 'bg-white/10 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Plan QRs
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'codes'
                ? 'bg-white/10 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Product Codes
          </button>
        </div>

        {activeTab === 'files' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Files', value: files.length.toString(), icon: FileArchive, color: 'text-sky-400' },
                { label: 'Storage Used', value: `${totalSizeMB.toFixed(1)} MB`, icon: HardDrive, color: 'text-emerald-400' },
                { label: 'Last Upload', value: lastUpload, icon: Clock, color: 'text-violet-400' },
                {
                  label: 'Platforms',
                  value: `${new Set(files.map((f) => f.deviceType)).size} Active`,
                  icon: Zap,
                  color: 'text-amber-400',
                },
              ].map((stat) => (
                <Card key={stat.label} className="bg-white/[0.02] border-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-4 h-4 ${stat.color} flex-shrink-0`} />
                      <div>
                        <p className="text-xs text-neutral-500">{stat.label}</p>
                        <p className="text-sm font-semibold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Upload Section */}
            <Card className="bg-white/[0.02] border-white/5 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-base">Upload New File</CardTitle>
                <CardDescription className="text-neutral-500 text-sm">
                  Select the target device, then drag & drop or click to choose a file (max 500 MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Device Type Selector */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-2 block">Compatible Device *</label>
                  <DeviceTypeSelector
                    value={selectedDeviceType}
                    onChange={(v) => setSelectedDeviceType(v)}
                  />
                </div>

                {/* Drop Zone */}
                <div
                  id="upload-dropzone"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploading && inputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-200 ${
                    uploading
                      ? 'border-amber-500/40 bg-amber-500/5 cursor-default'
                      : dragActive
                      ? 'border-sky-500 bg-sky-500/5 cursor-copy'
                      : selectedDeviceType
                      ? 'border-white/15 hover:border-white/25 hover:bg-white/[0.02] cursor-pointer'
                      : 'border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".apk,.exe,.dmg,.zip,.ipa"
                    onChange={handleChange}
                  />

                  {uploading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-amber-400 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Uploading {uploadingFileName}</p>
                        <div className="max-w-xs mx-auto bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                            transition={{ ease: 'linear' }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">{Math.min(Math.round(uploadProgress), 100)}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                        <Upload className={`w-5 h-5 ${dragActive ? 'text-sky-400' : 'text-neutral-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {dragActive ? 'Drop file here' : selectedDeviceType ? 'Click or drag file to upload' : 'Select a device type first'}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">
                          Supports: APK, EXE, DMG, ZIP, IPA — Max 500 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Files List */}
            <Card className="bg-white/[0.02] border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-base">Published Files</CardTitle>
                <CardDescription className="text-neutral-500 text-sm">
                  All uploaded files — these are visible on the download page
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-14">
                    <FileArchive className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">No files uploaded yet</p>
                    <p className="text-xs text-neutral-700 mt-1">Upload your first file above</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence initial={false}>
                      {files.map((file) => {
                        const cfg = deviceTypeConfig[file.deviceType] || deviceTypeConfig.desktop;
                        const Icon = cfg.icon;
                        return (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border ${cfg.border} ${cfg.bg}`}
                          >
                            <div className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-none">
                                  {file.name}
                                </p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} border ${cfg.border} whitespace-nowrap flex-shrink-0`}>
                                  {cfg.shortLabel}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-neutral-500">{file.sizeFormatted}</span>
                                <span className="text-xs text-neutral-700">·</span>
                                <span className="text-xs text-neutral-500">
                                  {new Date(file.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleCopyLink(file)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-150"
                                title="Copy download link"
                              >
                                {copiedId === file.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(file.id)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-all duration-150"
                                title="Delete file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.entries(deviceTypeConfig) as [DeviceType, typeof deviceTypeConfig[DeviceType]][]).map(([type, cfg]) => {
                const count = files.filter((f) => f.deviceType === type).length;
                const latest = files.find((f) => f.deviceType === type);
                const Icon = cfg.icon;
                return (
                  <Card
                    key={type}
                    className={`bg-white/[0.02] border transition-colors ${
                      count > 0 ? cfg.border : 'border-white/5'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{cfg.label}</p>
                          {count > 0 ? (
                            <p className={`text-xs mt-0.5 ${cfg.color}`}>{count} file{count !== 1 ? 's' : ''}</p>
                          ) : (
                            <p className="text-xs text-neutral-700 mt-0.5">No files</p>
                          )}
                        </div>
                      </div>
                      {latest && (
                        <p className="text-[10px] text-neutral-600 truncate mt-2">{latest.originalName}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Subscriptions', value: subscriptions.length.toString(), icon: Users, color: 'text-sky-400' },
                { label: 'Pending Approval', value: subscriptions.filter(s => s.status === 'pending').length.toString(), icon: Clock, color: 'text-amber-400' },
                { label: 'Approved Users', value: subscriptions.filter(s => s.status === 'approved').length.toString(), icon: CheckCircle, color: 'text-emerald-400' },
                {
                  label: 'Total Earnings',
                  value: `${subscriptions.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.planPrice, 0)} /-`,
                  icon: Coins,
                  color: 'text-violet-400',
                },
              ].map((stat) => (
                <Card key={stat.label} className="bg-white/[0.02] border-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-4 h-4 ${stat.color} flex-shrink-0`} />
                      <div>
                        <p className="text-xs text-neutral-500">{stat.label}</p>
                        <p className="text-sm font-semibold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters & Actions */}
            <Card className="bg-white/[0.02] border-white/5">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-white text-base">Subscription Requests</CardTitle>
                  <CardDescription className="text-neutral-500 text-sm">
                    Verify screenshots and approve downloads for users
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSubFilter(filter)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                        subFilter === filter
                          ? 'bg-white/10 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loadingSubs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : filteredSubs.length === 0 ? (
                  <div className="text-center py-14 text-neutral-500">
                    <Users className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                    <p className="text-sm">No subscription requests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border ${
                          sub.status === 'approved'
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : sub.status === 'rejected'
                            ? 'border-red-500/20 bg-red-500/5'
                            : 'border-white/5 bg-white/[0.01]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-sm font-semibold text-white">{sub.name}</span>
                            <span className="text-xs text-neutral-400">({sub.email})</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              Plan {sub.planPrice} /-
                            </span>
                            <span className="text-xs text-neutral-500">
                              Submitted: {new Date(sub.createdAt).toLocaleString()}
                            </span>
                            {sub.approvedAt && (
                              <span className="text-xs text-neutral-500">
                                Approved: {new Date(sub.approvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          {/* Screenshot Preview */}
                          {sub.screenshotUrl && (
                            <div className="relative group cursor-pointer" onClick={() => setSelectedScreenshotUrl(sub.screenshotUrl)}>
                              <img
                                src={sub.screenshotUrl}
                                alt="Payment Screenshot"
                                className="w-12 h-16 object-cover rounded-lg border border-white/10 hover:border-sky-400 transition-all shadow-md"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                <span className="text-[10px] text-white">Zoom</span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {sub.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveSub(sub.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 hover:text-white transition-all text-xs font-medium"
                                  title="Approve subscription"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectSub(sub.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:text-white transition-all text-xs font-medium"
                                  title="Reject subscription"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                            {sub.status !== 'pending' && (
                              <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                                sub.status === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {sub.status}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteSub(sub.id)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-transparent hover:border-red-500/25 transition-all"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'qrs' && (
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-base">Plan QR Codes</CardTitle>
              <CardDescription className="text-neutral-500 text-sm">
                Upload payment QR code images for each plan. Users will see these QR codes when they checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlans ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {([49, 109, 149] as const).map((price) => {
                    const qrUrl = plans[price];
                    const isUploading = uploadingQrPlan === price;
                    const fileInputId = `qr-upload-input-${price}`;

                    return (
                      <Card key={price} className="bg-white/[0.01] border-white/5 relative overflow-hidden flex flex-col h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-base flex justify-between items-center">
                            <span>Plan {price} /-</span>
                            <span className="text-xs text-neutral-500 font-normal">
                              {price === 149 ? 'All Apps' : price === 109 ? 'Mobile & Desktop' : 'Desktop Only'}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-between pb-6">
                          <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden mb-5 relative group">
                            {qrUrl ? (
                              <img src={qrUrl} alt={`Plan ${price} QR`} className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center text-center p-4">
                                <QrCode className="w-8 h-8 text-neutral-600 mb-2" />
                                <span className="text-xs text-neutral-500">No QR Code Uploaded</span>
                              </div>
                            )}
                            
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3">
                                <Loader2 className="w-5 h-5 text-sky-400 animate-spin mb-2" />
                                <span className="text-[10px] text-sky-400">{Math.round(uploadingQrProgress)}%</span>
                              </div>
                            )}
                          </div>

                          <div className="w-full">
                            <input
                              type="file"
                              id={fileInputId}
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadQr(price, e.target.files[0]);
                                }
                              }}
                              disabled={isUploading}
                            />
                            <button
                              onClick={() => document.getElementById(fileInputId)?.click()}
                              disabled={isUploading}
                              className="w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {qrUrl ? 'Change QR Image' : 'Upload QR Image'}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'codes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Product Authorization Codes</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Generate unique product codes that allow buyers to skip payment verification and unlock all apps.
                </p>
              </div>
              <button
                onClick={handleGenerateCode}
                disabled={generatingCode}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-all text-xs disabled:opacity-50"
              >
                {generatingCode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Generate Code
              </button>
            </div>

            <Card className="bg-white/[0.02] border-white/5">
              <CardContent className="p-0">
                {loadingCodes ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : productCodes.length === 0 ? (
                  <div className="text-center py-14 text-neutral-500">
                    <Key className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                    <p className="text-sm">No product codes generated yet</p>
                    <p className="text-xs text-neutral-700 mt-1">Click "Generate Code" above to create one</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {productCodes.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 gap-4 flex-wrap sm:flex-nowrap">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-white tracking-wider bg-white/5 px-2.5 py-1 rounded border border-white/5">
                              {item.code}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.code);
                                setCopiedCodeId(item.id);
                                setTimeout(() => setCopiedCodeId(null), 2000);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
                              title="Copy code"
                            >
                              {copiedCodeId === item.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                            <span>Created: {new Date(item.createdAt || item.created_at).toLocaleString()}</span>
                            {item.status === 'used' && (
                              <>
                                <span className="text-neutral-700">·</span>
                                <span className="text-emerald-400">Used by: {item.usedBy || item.used_by}</span>
                                {item.usedAt && (
                                  <>
                                    <span className="text-neutral-700">·</span>
                                    <span>Used on: {new Date(item.usedAt || item.used_at).toLocaleDateString()}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            item.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                          }`}>
                            {item.status}
                          </span>
                          <button
                            onClick={() => handleDeleteCode(item.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-transparent hover:border-red-500/25 transition-all"
                            title="Revoke / Delete code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Lightbox modal for payment screenshot zoom */}
      <AnimatePresence>
        {selectedScreenshotUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedScreenshotUrl(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setSelectedScreenshotUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedScreenshotUrl}
              alt="Payment Screenshot Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-lg border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT EXPORT — handles auth gating
// ─────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (!saved) {
      setChecking(false);
      return;
    }
    // Verify the saved token is still valid
    fetch(`${API_BASE}/api/auth/verify`, { headers: { Authorization: `Bearer ${saved}` } })
      .then((r) => {
        if (r.ok) setToken(saved);
        else localStorage.removeItem('admin_token');
      })
      .catch(() => {
        // Server unreachable — still let them try
        setToken(saved);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (t: string) => setToken(t);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
