import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  PhoneCall,
  Mail,
  HelpCircle,
  Shield,
  X,
  UserPlus,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/apiClient';

interface ModernLoginPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
}

/**
 * Custom Persian-inspired corner filigree SVG ornament
 * Positioned at each of the 4 corners of the main frame via rotation/flip
 */
const CornerFiligree: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M4 60V20C4 11.1634 11.1634 4 20 4H60"
      stroke="url(#cornerGold)"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M10 52V22C10 15.3726 15.3726 10 22 10H52"
      stroke="url(#cornerGold)"
      strokeWidth="0.9"
      strokeOpacity="0.65"
      strokeLinecap="round"
    />
    <path
      d="M16 16L24 12L20 20L12 24L16 16Z"
      fill="#F3D082"
      fillOpacity="0.85"
    />
    <circle cx="8" cy="8" r="2.2" fill="#FBE5A9" />
    <circle cx="32" cy="4" r="1.4" fill="#D8A84E" fillOpacity="0.8" />
    <circle cx="4" cy="32" r="1.4" fill="#D8A84E" fillOpacity="0.8" />
    <defs>
      <linearGradient id="cornerGold" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF0C2" />
        <stop offset="0.45" stopColor="#D8A84E" />
        <stop offset="1" stopColor="#D8A84E" stopOpacity="0.15" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Geometric Persian Shamseh (8-pointed illuminated rosette) background vector
 */
const ShamsehMandala: React.FC<{ className?: string; strokeOpacity?: number }> = ({
  className = '',
  strokeOpacity = 0.14,
}) => (
  <svg
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <g stroke="#E6BF6E" strokeOpacity={strokeOpacity} strokeWidth="0.9">
      <circle cx="200" cy="200" r="186" strokeDasharray="3 7" />
      <circle cx="200" cy="200" r="162" />
      <circle cx="200" cy="200" r="126" strokeDasharray="6 6" />
      <circle cx="200" cy="200" r="88" />
      <circle cx="200" cy="200" r="46" />
      {/* 8-point star primary */}
      <polygon points="200,22 245,155 378,200 245,245 200,378 155,245 22,200 155,155" />
      {/* 8-point star rotated 45 deg */}
      <polygon
        points="200,22 245,155 378,200 245,245 200,378 155,245 22,200 155,155"
        transform="rotate(45 200 200)"
      />
      {/* Interlocking Girih squares */}
      <rect x="86" y="86" width="228" height="228" />
      <rect x="86" y="86" width="228" height="228" transform="rotate(45 200 200)" />
      <rect x="116" y="116" width="168" height="168" transform="rotate(22.5 200 200)" />
      <rect x="116" y="116" width="168" height="168" transform="rotate(67.5 200 200)" />
    </g>
  </svg>
);

/**
 * Bespoke Judicial Scales & Arch Emblem SVG with animated stroke drawing
 */
const JudicialEmblem: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => (
  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
    {/* Rotating golden halo ring */}
    <motion.div
      animate={reducedMotion ? undefined : { rotate: 360 }}
      transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-0 rounded-2xl border border-[#E6BF6E]/35"
      style={{
        background:
          'conic-gradient(from 0deg, rgba(243,208,130,0.45), rgba(216,168,78,0.05) 35%, rgba(16,185,129,0.28) 65%, rgba(243,208,130,0.45))',
        padding: '1.5px',
      }}
    >
      <div className="w-full h-full rounded-[14px] bg-[#071E17]" />
    </motion.div>

    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10 w-8 h-8"
      aria-hidden="true"
    >
      {/* Persian Arch */}
      <motion.path
        d="M9 39V22C9 14.5 16 8.5 24 6C32 8.5 39 14.5 39 22V39"
        stroke="url(#emblemGold)"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Central Pillar */}
      <motion.path
        d="M24 13V36M17 36H31"
        stroke="url(#emblemGold)"
        strokeWidth="1.9"
        strokeLinecap="round"
        initial={reducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
      />
      {/* Scales Beam */}
      <motion.path
        d="M14 20H34"
        stroke="#F7DF9E"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={reducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
      />
      {/* Left & Right Scale Pans */}
      <motion.path
        d="M14 20L11 27C11 28.8 12.6 30 14.5 30C16.4 30 18 28.8 18 27L15 20"
        stroke="#E4B85B"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      />
      <motion.path
        d="M34 20L31 27C31 28.8 32.6 30 34.5 30C36.4 30 38 28.8 38 27L35 20"
        stroke="#E4B85B"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      />
      <circle cx="24" cy="12" r="2" fill="#FFF3C8" />
      <defs>
        <linearGradient id="emblemGold" x1="9" y1="6" x2="39" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0C4" />
          <stop offset="0.55" stopColor="#D8A84E" />
          <stop offset="1" stopColor="#B88632" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/**
 * Luminous 4-point calligraphic spark nib that leads the RTL writing stroke
 */
const SparklingLightPoint: React.FC<{ size?: 'md' | 'lg' }> = ({ size = 'lg' }) => {
  const dim = size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  return (
    <div className={`relative ${dim} flex items-center justify-center pointer-events-none select-none`}>
      {/* Outer bloom */}
      <div
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background:
            'radial-gradient(circle, rgba(255,247,214,0.95) 0%, rgba(243,200,104,0.65) 45%, rgba(216,168,78,0) 75%)',
        }}
      />
      {/* Crisp 4-point star flare */}
      <motion.svg
        viewBox="0 0 32 32"
        className="relative z-10 w-full h-full drop-shadow-[0_0_12px_rgba(255,235,168,0.95)]"
        animate={{ rotate: [0, 45, 90], scale: [0.95, 1.18, 0.95] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M16 1L18.6 13.4L31 16L18.6 18.6L16 31L13.4 18.6L1 16L13.4 13.4L16 1Z"
          fill="#FFFDF2"
        />
        <circle cx="16" cy="16" r="3.4" fill="#FFFFFF" />
      </motion.svg>
    </div>
  );
};

/**
 * Single RTL line written progressively from a glowing point of light (Right -> Left)
 */
interface LuminousWritingLineProps {
  text: string;
  delay: number;
  duration: number;
  textClassName: string;
  keepEndSpark?: boolean;
  reducedMotion: boolean;
}

const LuminousWritingLine: React.FC<LuminousWritingLineProps> = ({
  text,
  delay,
  duration,
  textClassName,
  keepEndSpark = false,
  reducedMotion,
}) => {
  if (reducedMotion) {
    return <span className={`inline-block ${textClassName}`}>{text}</span>;
  }

  return (
    <span className="relative inline-block max-w-full align-top whitespace-nowrap">
      {/* Subtle ghost reserve for layout stability (zero CLS) */}
      <span className={`invisible select-none ${textClassName}`} aria-hidden="true">
        {text}
      </span>

      {/* Synchronized RTL clip-path writing reveal (Right edge 0% -> sweeps left to 100%) */}
      <motion.span
        className={`absolute inset-0 ${textClassName}`}
        initial={{ clipPath: 'inset(-22% 0% -22% 100%)' }}
        animate={{ clipPath: 'inset(-22% 0% -22% 0%)' }}
        transition={{
          delay,
          duration,
          ease: [0.22, 0.68, 0.35, 1],
        }}
      >
        {text}
      </motion.span>

      {/* Luminous golden ink glow trail immediately following the writing nib */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-9 w-20 rounded-full blur-lg"
        style={{
          background:
            'radial-gradient(circle, rgba(255,232,163,0.7) 0%, rgba(216,168,78,0.22) 55%, rgba(216,168,78,0) 100%)',
        }}
        initial={{ right: '0%', opacity: 0 }}
        animate={{
          right: ['0%', '8%', '96%', '100%'],
          opacity: [0, 0.95, 0.85, 0],
        }}
        transition={{
          delay,
          duration,
          times: [0, 0.1, 0.9, 1],
          ease: [0.22, 0.68, 0.35, 1],
        }}
      />

      {/* The Glowing Point of Light tracing the text from right to left */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 translate-x-1/2 z-20"
        initial={{ right: '0%', opacity: 0, scale: 0.2 }}
        animate={
          keepEndSpark
            ? {
                right: ['0%', '0%', '100%', '104%'],
                opacity: [0, 1, 1, 0.92],
                scale: [0.25, 1.38, 1.05, 0.72],
              }
            : {
                right: ['0%', '0%', '100%', '100%'],
                opacity: [0, 1, 1, 0],
                scale: [0.25, 1.35, 1.05, 0.2],
              }
        }
        transition={{
          delay: Math.max(0, delay - 0.25),
          duration: duration + 0.3,
          times: [0, 0.18, 0.92, 1],
          ease: [0.22, 0.68, 0.35, 1],
        }}
      >
        <SparklingLightPoint size={keepEndSpark ? 'lg' : 'md'} />
      </motion.span>
    </span>
  );
};

// Deterministic floating dust motes (avoids hydration/re-render jitter)
const LUMINOUS_PARTICLES = [
  { id: 1, right: '8%', top: '16%', size: 4, duration: 9, delay: 0 },
  { id: 2, right: '22%', top: '78%', size: 3, duration: 11, delay: 1.4 },
  { id: 3, right: '38%', top: '24%', size: 5, duration: 13, delay: 0.6 },
  { id: 4, right: '52%', top: '82%', size: 3.5, duration: 10, delay: 2.1 },
  { id: 5, right: '68%', top: '18%', size: 4.5, duration: 12, delay: 0.9 },
  { id: 6, right: '84%', top: '64%', size: 3, duration: 8.5, delay: 1.8 },
  { id: 7, right: '14%', top: '48%', size: 3.5, duration: 11.5, delay: 2.6 },
  { id: 8, right: '76%', top: '36%', size: 4, duration: 10.5, delay: 0.3 },
  { id: 9, right: '46%', top: '54%', size: 2.8, duration: 14, delay: 1.1 },
  { id: 10, right: '91%', top: '22%', size: 3.5, duration: 9.5, delay: 2.9 },
];

export const ModernLoginPage: React.FC<ModernLoginPageProps> = ({
  isOpen = true,
  onClose,
  isFullPage = false,
}) => {
  const { setCurrentUser, refreshAlumniProfileSettings, refreshUsers } = useApp();
  const prefersReducedMotion = Boolean(useReducedMotion());

  // Replay key for the luminous point-of-light title animation
  const [titleAnimKey, setTitleAnimKey] = useState(0);

  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forced Password Change States (when mustChangePassword is true)
  const [mustChangePasswordMode, setMustChangePasswordMode] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Forgot Password / Support Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Simple Customer Registration Mode (ثبت‌نام ساده کاربران مشتری)
  const [customerRegisterMode, setCustomerRegisterMode] = useState(false);
  const [custFullName, setCustFullName] = useState('');
  const [custNationalId, setCustNationalId] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPassword, setCustPassword] = useState('');

  if (!isOpen) return null;

  const handleCustomerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.registerCustomerAccount({
        fullName: custFullName,
        nationalId: custNationalId,
        phone: custPhone,
        password: custPassword || custPhone,
      });
      if (res.success && res.user) {
        api.setAuthContext(
          res.user.id,
          res.user.role,
          res.user.fullName,
          res.token || res.accessToken
        );
        await refreshAlumniProfileSettings();
        refreshUsers();
        setCurrentUser(res.user);
        if (onClose) onClose();
        return;
      }
      setErrorMsg(res.message || 'خطا در ثبت‌نام حساب مشتری.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ثبت‌نام کاربر مشتری.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.login(identifier, password);

      if (res.success && res.user) {
        if (res.mustChangePassword) {
          setTempUserData(res.user);
          setCurrentPasswordInput(password);
          setMustChangePasswordMode(true);
        } else {
          setCurrentUser(res.user);
          await refreshAlumniProfileSettings();
          refreshUsers();
          if (onClose) onClose();
        }
        return;
      }
      setErrorMsg(res.message || 'نام کاربری/کد ملی یا رمز عبور اشتباه است.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'نام کاربری/کد ملی یا رمز عبور اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('تکرار رمز عبور جدید با رمز عبور جدید مطابقت ندارد.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.changePassword(currentPasswordInput, newPassword);
      if (res.success && res.user) {
        setChangePasswordSuccess(true);
        await refreshAlumniProfileSettings();
        refreshUsers();
        setTimeout(() => {
          setCurrentUser(res.user);
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMsg('خطا در به‌روزرسانی رمز عبور.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت رمز عبور جدید.');
    } finally {
      setLoading(false);
    }
  };

  const activeFormKey = mustChangePasswordMode
    ? 'change-password'
    : customerRegisterMode
    ? 'customer-register'
    : 'member-login';

  const containerContent = (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[1120px] z-10"
      dir="rtl"
    >
      {/* OUTER ILLUMINATED ARCHITECTURAL FRAME (Animated Orbiting Gold-Emerald Border) */}
      <div className="relative p-[2px] rounded-[34px] overflow-hidden shadow-[0_32px_90px_-18px_rgba(3,15,11,0.88),0_0_50px_-15px_rgba(216,168,78,0.25)]">
        {/* Orbiting golden-emerald light beam around the frame perimeter */}
        <motion.div
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-[45%] pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(243,208,120,0.92) 0deg, rgba(216,168,78,0.25) 55deg, rgba(16,185,129,0.25) 130deg, rgba(216,168,78,0.12) 180deg, rgba(255,236,184,0.85) 215deg, rgba(216,168,78,0.2) 280deg, rgba(20,184,166,0.25) 325deg, rgba(243,208,120,0.92) 360deg)',
          }}
        />

        {/* Secondary recessed obsidian-emerald mat frame */}
        <div className="relative rounded-[32px] bg-[#061812] p-1.5 sm:p-2">
          {/* Ornate Top & Bottom Center Diamond Finials */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2"
          >
            <span className="h-[1px] w-14 bg-gradient-to-l from-[#E6BF6E] to-transparent" />
            <span className="w-2.5 h-2.5 rotate-45 bg-gradient-to-br from-[#FFF3C4] to-[#C89335] shadow-[0_0_12px_rgba(246,216,140,0.9)]" />
            <span className="h-[1px] w-14 bg-gradient-to-r from-[#E6BF6E] to-transparent" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 flex items-center gap-2"
          >
            <span className="h-[1px] w-12 bg-gradient-to-l from-[#D8A84E]/80 to-transparent" />
            <span className="w-2 h-2 rotate-45 bg-[#E6BF6E]/90" />
            <span className="h-[1px] w-12 bg-gradient-to-r from-[#D8A84E]/80 to-transparent" />
          </div>

          {/* Four Persian Corner Filigree Medallions */}
          <CornerFiligree className="pointer-events-none absolute top-2.5 right-2.5 w-11 h-11 z-30 -scale-x-100 opacity-90" />
          <CornerFiligree className="pointer-events-none absolute top-2.5 left-2.5 w-11 h-11 z-30 opacity-90" />
          <CornerFiligree className="pointer-events-none absolute bottom-2.5 right-2.5 w-11 h-11 z-30 -scale-x-100 -scale-y-100 opacity-90" />
          <CornerFiligree className="pointer-events-none absolute bottom-2.5 left-2.5 w-11 h-11 z-30 -scale-y-100 opacity-90" />

          {/* INNER CARD BODY (Two-Column Obsidian-Emerald Showcase + Warm Ivory Pearl Form) */}
          <div className="relative rounded-[26px] border border-[#D8A84E]/28 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] bg-[#071E17]">
            {/* RIGHT COLUMN: OBSIDIAN-EMERALD SHOWCASE & LUMINOUS TITLE (7 cols) */}
            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 bg-gradient-to-br from-[#0E3327] via-[#09241B] to-[#051610] flex flex-col justify-between relative overflow-hidden text-right">
              {/* Architectural Geometric Mandalas (Dual Counter-Rotating) */}
              <motion.div
                aria-hidden="true"
                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute -top-28 -left-28 w-[420px] h-[420px] opacity-65"
              >
                <ShamsehMandala className="w-full h-full" strokeOpacity={0.2} />
              </motion.div>

              <motion.div
                aria-hidden="true"
                animate={prefersReducedMotion ? undefined : { rotate: -360 }}
                transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute -bottom-36 -right-24 w-[360px] h-[360px] opacity-45"
              >
                <ShamsehMandala className="w-full h-full" strokeOpacity={0.16} />
              </motion.div>

              {/* Soft Volumetric Emerald & Champagne Glows */}
              <motion.div
                aria-hidden="true"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: [0.32, 0.52, 0.32], scale: [1, 1.07, 1] }
                }
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -top-16 right-8 w-80 h-80 rounded-full bg-[#D8A84E]/15 blur-[95px]"
              />
              <motion.div
                aria-hidden="true"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: [0.28, 0.45, 0.28], scale: [1.04, 0.96, 1.04] }
                }
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -bottom-24 left-10 w-96 h-96 rounded-full bg-emerald-500/18 blur-[110px]"
              />

              {/* Subtle Architectural Mihrab Arch Hairline Framing Top-Right */}
              <svg
                aria-hidden="true"
                viewBox="0 0 600 120"
                fill="none"
                className="pointer-events-none absolute top-0 inset-x-0 w-full h-24 opacity-25"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 110 C 160 110, 220 18, 300 10 C 380 18, 440 110, 600 110"
                  stroke="url(#archStroke)"
                  strokeWidth="1"
                />
                <defs>
                  <linearGradient id="archStroke" x1="0" y1="60" x2="600" y2="60" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#D8A84E" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#F5D78E" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#D8A84E" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* TOP IDENTITY + LUMINOUS POINT-OF-LIGHT WRITING REVEAL */}
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <JudicialEmblem reducedMotion={prefersReducedMotion} />
                    <div className="space-y-1">
                      <motion.p
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[11px] sm:text-xs font-bold tracking-wider text-[#F0CB79]"
                      >
                        قوه قضائیه جمهوری اسلامی ایران
                      </motion.p>
                      <div className="flex items-center gap-2">
                        <span className="h-[1px] w-10 bg-gradient-to-l from-[#E6BF6E] to-transparent" />
                        <span className="text-[11px] text-emerald-100/80 font-medium">
                          سامانه یکپارچه نخبگان قضایی
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subtle replay trigger for the light-writing title animation */}
                  {!prefersReducedMotion && (
                    <button
                      type="button"
                      onClick={() => setTitleAnimKey(prev => prev + 1)}
                      title="بازپخش جلوه نوشتار نوری عنوان"
                      aria-label="بازپخش جلوه نوشتار نوری عنوان"
                      className="p-2 rounded-xl text-[#D8A84E]/70 hover:text-[#FCE4A6] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* CENTERPIECE: ORGANIZATION NAME WRITTEN FROM A SPARKLING POINT OF LIGHT */}
                <div key={titleAnimKey} className="pt-2 space-y-2.5">
                  <h1 className="flex flex-col items-start gap-1.5 leading-[1.45]">
                    <LuminousWritingLine
                      text="مرکز مدیریت و دانش‌آموختگان"
                      delay={0.45}
                      duration={1.15}
                      reducedMotion={prefersReducedMotion}
                      textClassName="text-xl sm:text-2xl lg:text-[27px] font-black text-[#F8F6F0] tracking-tight drop-shadow-[0_2px_18px_rgba(246,216,140,0.2)]"
                    />
                    <LuminousWritingLine
                      text="فقه و قضا"
                      delay={1.65}
                      duration={0.9}
                      keepEndSpark={true}
                      reducedMotion={prefersReducedMotion}
                      textClassName="text-2xl sm:text-3xl lg:text-[34px] font-black text-transparent bg-clip-text bg-gradient-to-l from-[#FFF4CC] via-[#F2C76B] to-[#D19B3E] drop-shadow-[0_4px_22px_rgba(216,168,78,0.35)]"
                    />
                  </h1>

                  {/* Illuminated Golden Calligraphic Underline drawing Right -> Left */}
                  <div className="relative h-[2px] w-full max-w-md overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={prefersReducedMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.9, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformOrigin: 'right center' }}
                      className="h-full w-full bg-gradient-to-l from-[#FFF2C4] via-[#E2B256] to-transparent"
                    />
                    {/* Periodic subtle golden shimmer sweep */}
                    {!prefersReducedMotion && (
                      <motion.div
                        animate={{ x: ['110%', '-120%'] }}
                        transition={{
                          delay: 3.2,
                          duration: 2.2,
                          repeat: Infinity,
                          repeatDelay: 4.5,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/90 to-transparent"
                      />
                    )}
                  </div>
                </div>

                {/* Editorial Subtitle */}
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.55 }}
                  className="space-y-2 pt-1"
                >
                  <h2 className="text-sm sm:text-base font-extrabold text-[#F3F6F4]">
                    درگاه جامع خدمات علمی، پژوهشی، مشاوره‌ای و اداری دانش‌آموختگان
                  </h2>
                  <p className="text-xs sm:text-[13px] text-emerald-100/75 leading-7 max-w-xl">
                    دسترسی امن به کارتابل خدمات اداری، سامانه راهبری پژوهش و مقاله، مشاوره‌های تخصصی قضاوت و روان‌شناختی، تالار نقد آراء و شبکه نخبگان قضایی کشور.
                  </p>
                </motion.div>
              </div>

              {/* MIDDLE METRICS: CLEAN EDITORIAL HAIRLINE CARDS */}
              <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  { value: '۱,۰۴۲', label: 'قاضی و مستشار', sub: 'عضو رسمی شبکه مرکز', delay: 0.7 },
                  { value: '۲۴', label: 'کارگاه و دوره تخصصی', sub: 'فقه، حقوق و رویه قضایی', delay: 0.82 },
                  { value: '۸۶۵', label: 'دادنامه و پژوهش', sub: 'تالار نقد و راهبری علمی', delay: 0.94 },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: item.delay, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    className="group relative p-4 rounded-2xl bg-[#071E17]/75 border border-[#D8A84E]/22 hover:border-[#F0CB79]/50 transition-colors backdrop-blur-sm"
                  >
                    <div className="absolute top-0 right-4 left-4 h-[1px] bg-gradient-to-l from-transparent via-[#F0CB79]/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                      className="text-xl font-black text-[#F3D078] tracking-tight"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {item.value}
                    </div>
                    <div className="text-xs font-extrabold text-[#F3F6F4] mt-1">{item.label}</div>
                    <div className="text-[11px] text-emerald-100/65 mt-1">{item.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* BOTTOM INSTITUTIONAL SECURITY FOOTER */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.05 }}
                className="relative z-10 pt-4 border-t border-[#D8A84E]/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100/75"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#F3D078] shrink-0" />
                  <span>ارتباط امن و احراز هویت رمزنگاری‌شده در پایگاه داده مرکزی</span>
                </div>
                <span className="text-[#F3D078]/85 font-semibold">
                  دبیرخانه مرکزی مرکز دانش‌آموختگان
                </span>
              </motion.div>
            </div>

            {/* LEFT COLUMN: WARM ALABASTER IVORY PEARL AUTHENTICATION PANEL (5 cols) */}
            <div className="lg:col-span-5 p-7 sm:p-9 lg:p-10 bg-gradient-to-b from-[#FCFCF9] via-[#FAF6EC] to-[#F3ECDC] text-[#071E17] flex flex-col justify-between relative">
              {/* Subtle vertical golden separator sheen on desktop */}
              <div
                aria-hidden="true"
                className="hidden lg:block absolute top-8 bottom-8 right-0 w-[1px] bg-gradient-to-b from-transparent via-[#D8A84E]/55 to-transparent"
              />

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-5 left-5 p-2 rounded-xl bg-[#071E17]/5 hover:bg-[#071E17]/10 text-[#3B5248] hover:text-[#071E17] transition-colors border border-[#071E17]/10 cursor-pointer"
                  aria-label="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="space-y-6 my-auto">
                {/* Animated Sliding-Indicator Mode Switcher */}
                {!mustChangePasswordMode && (
                  <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-[#EFEAD9] border border-[#DED5BC] shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerRegisterMode(false);
                        setErrorMsg('');
                      }}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        !customerRegisterMode ? 'text-[#F3D078]' : 'text-[#3B5248] hover:text-[#071E17]'
                      }`}
                    >
                      {!customerRegisterMode && (
                        <motion.span
                          layoutId="loginAuthTabHighlight"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-l from-[#071E17] to-[#113D30] shadow-md shadow-[#071E17]/25"
                        />
                      )}
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>ورود اعضا و مدیران</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerRegisterMode(true);
                        setErrorMsg('');
                      }}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        customerRegisterMode ? 'text-[#071E17]' : 'text-[#3B5248] hover:text-[#071E17]'
                      }`}
                    >
                      {customerRegisterMode && (
                        <motion.span
                          layoutId="loginAuthTabHighlight"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-l from-[#D4AF37] to-[#E8C15A] shadow-md shadow-[#C89335]/25"
                        />
                      )}
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ثبت‌نام ساده مشتریان</span>
                    </button>
                  </div>
                )}

                {/* Form Heading */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#9A6B19] text-xs font-extrabold">
                    <span className="h-[2px] w-4 rounded-full bg-[#D4AF37]" />
                    <span>
                      {mustChangePasswordMode
                        ? 'اقدام امنیتی الزامی'
                        : customerRegisterMode
                        ? 'عضویت سریع متقاضیان دوره‌ها و کتب'
                        : 'احراز هویت سازمانی'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#071E17]">
                    {mustChangePasswordMode
                      ? 'تغییر اجباری رمز عبور اولیه'
                      : customerRegisterMode
                      ? 'ایجاد حساب کاربری مشتری'
                      : 'ورود به حساب کاربری'}
                  </h3>
                  <p className="text-xs text-[#4C6258] leading-relaxed">
                    {mustChangePasswordMode
                      ? `کاربر گرامی${tempUserData?.fullName ? ` ${tempUserData.fullName}` : ''}، جهت حفظ امنیت حساب، رمز عبور جدید خود را ثبت نمائید.`
                      : customerRegisterMode
                      ? 'ویژه متقاضیان غیر دانش‌آموخته جهت ثبت‌نام دوره‌ها، کتب و خدمات مجاز'
                      : 'کد ملی یا شناسه کاربری و رمز عبور خود را وارد نمائید.'}
                  </p>
                </div>

                {/* Error Banner */}
                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="auth-error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Banner */}
                {changePasswordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>رمز عبور با موفقیت به‌روزرسانی شد. در حال انتقال به سامانه...</span>
                  </motion.div>
                )}

                {/* Animated Form Transition */}
                <AnimatePresence mode="wait">
                  {activeFormKey === 'customer-register' && (
                    <motion.form
                      key="customer-register"
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, x: 12 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleCustomerRegisterSubmit}
                      className="space-y-3.5"
                    >
                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-1.5">
                          نام و نام خانوادگی
                        </label>
                        <input
                          type="text"
                          required
                          value={custFullName}
                          onChange={e => setCustFullName(e.target.value)}
                          placeholder="مثال: محمد محمدی"
                          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-1.5">
                          کد ملی (شناسه کاربری ورود)
                        </label>
                        <input
                          type="text"
                          required
                          value={custNationalId}
                          onChange={e => setCustNationalId(e.target.value)}
                          placeholder="۱۰ رقم کد ملی"
                          dir="ltr"
                          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-1.5">
                          شماره تلفن همراه
                        </label>
                        <input
                          type="text"
                          required
                          value={custPhone}
                          onChange={e => {
                            setCustPhone(e.target.value);
                            if (!custPassword) setCustPassword(e.target.value);
                          }}
                          placeholder="09120000000"
                          dir="ltr"
                          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-1.5">
                          رمز عبور دلخواه
                        </label>
                        <input
                          type="password"
                          required
                          value={custPassword}
                          onChange={e => setCustPassword(e.target.value)}
                          placeholder="حداقل ۴ کاراکتر"
                          dir="ltr"
                          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all shadow-xs"
                        />
                      </div>

                      <motion.button
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                        type="submit"
                        disabled={loading}
                        className="group relative overflow-hidden w-full py-3.5 px-6 bg-gradient-to-l from-[#D4AF37] via-[#E5BF52] to-[#D4AF37] text-[#071E17] font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-shadow shadow-lg shadow-[#D4AF37]/25 hover:shadow-xl hover:shadow-[#D4AF37]/35 disabled:opacity-50 mt-2 cursor-pointer"
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                        {loading ? (
                          <span>در حال ایجاد حساب مشتری...</span>
                        ) : (
                          <>
                            <span>تکمیل ثبت‌نام و ورود مستقیم به ویترین</span>
                            <ArrowLeft className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}

                  {activeFormKey === 'member-login' && (
                    <motion.form
                      key="member-login"
                      initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleLoginSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-2">
                          کد ملی / شناسه کاربری
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            required
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            placeholder="کد ملی یا نام کاربری سازمانی"
                            className="w-full px-4 py-3.5 pr-11 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 font-mono transition-all shadow-xs"
                            dir="ltr"
                          />
                          <UserIcon className="w-5 h-5 text-[#647D72] group-focus-within:text-[#0E3226] transition-colors absolute right-3.5 top-3.5" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-[#0E3226]">
                            رمز عبور
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowHelpModal(true)}
                            className="text-[11px] text-[#9A6B19] hover:text-[#734D0D] transition-colors font-bold cursor-pointer"
                          >
                            فراموشی رمز عبور؟
                          </button>
                        </div>
                        <div className="relative group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3.5 pr-11 pl-11 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 font-mono transition-all shadow-xs"
                            dir="ltr"
                          />
                          <Lock className="w-5 h-5 text-[#647D72] group-focus-within:text-[#0E3226] transition-colors absolute right-3.5 top-3.5" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                            className="absolute left-3.5 top-3.5 text-[#647D72] hover:text-[#071E17] transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1">
                        <input
                          type="checkbox"
                          id="rememberSession"
                          defaultChecked
                          className="w-4 h-4 rounded border-[#C8BEA4] accent-[#0E3226] cursor-pointer"
                        />
                        <label
                          htmlFor="rememberSession"
                          className="text-xs text-[#4C6258] select-none cursor-pointer font-medium"
                        >
                          به‌خاطر سپردن نشست کاری امن روی این مرورگر
                        </label>
                      </div>

                      <motion.button
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                        type="submit"
                        disabled={loading}
                        className="group relative overflow-hidden w-full py-4 px-6 bg-gradient-to-l from-[#071E17] via-[#0E3226] to-[#113D30] text-[#F3D078] font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-shadow shadow-xl shadow-[#071E17]/25 hover:shadow-2xl hover:shadow-[#071E17]/35 border border-[#D8A84E]/45 disabled:opacity-50 mt-3 cursor-pointer"
                      >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-[#F6D88C]/25 to-transparent" />
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-[#F6D88C]/30 border-t-[#F6D88C] rounded-full animate-spin" />
                            <span>در حال بررسی اعتبار در پایگاه داده...</span>
                          </>
                        ) : (
                          <>
                            <span>ورود امن به سامانه</span>
                            <ArrowLeft className="w-4 h-4 text-[#F3D078]" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}

                  {activeFormKey === 'change-password' && (
                    <motion.form
                      key="change-password"
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleChangePasswordSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-2">
                          رمز عبور جدید
                        </label>
                        <div className="relative group">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="حداقل ۴ کاراکتر"
                            className="w-full px-4 py-3.5 pr-11 pl-11 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 font-mono transition-all shadow-xs"
                            dir="ltr"
                          />
                          <Lock className="w-5 h-5 text-[#647D72] group-focus-within:text-[#0E3226] transition-colors absolute right-3.5 top-3.5" />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute left-3.5 top-3.5 text-[#647D72] hover:text-[#071E17] transition-colors cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0E3226] mb-2">
                          تکرار رمز عبور جدید
                        </label>
                        <div className="relative group">
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="تکرار رمز عبور جدید"
                            className="w-full px-4 py-3.5 pr-11 text-xs sm:text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 font-mono transition-all shadow-xs"
                            dir="ltr"
                          />
                          <Lock className="w-5 h-5 text-[#647D72] group-focus-within:text-[#0E3226] transition-colors absolute right-3.5 top-3.5" />
                        </div>
                      </div>

                      <motion.button
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                        type="submit"
                        disabled={loading || changePasswordSuccess}
                        className="group relative overflow-hidden w-full py-4 px-6 bg-gradient-to-l from-[#071E17] via-[#0E3226] to-[#113D30] text-[#F3D078] font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-shadow shadow-xl shadow-[#071E17]/25 border border-[#D8A84E]/50 disabled:opacity-50 mt-3 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-[#F6D88C]/30 border-t-[#F6D88C] rounded-full animate-spin" />
                            <span>در حال ثبت رمز جدید...</span>
                          </>
                        ) : (
                          <>
                            <span>ثبت رمز عبور جدید و ورود</span>
                            <CheckCircle2 className="w-4 h-4 text-[#F3D078]" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Form Pane Footer */}
              <div className="pt-5 mt-6 border-t border-[#DED3BC] text-[11px] text-[#4C6258] flex items-center justify-between">
                <span className="font-semibold">پشتیبانی احراز هویت اعضا</span>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="flex items-center gap-1.5 text-[#0E3226] hover:text-[#9A6B19] font-bold transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>راهنمای ورود و بازیابی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Full-bleed Obsidian-Emerald Ambient Backdrop (shared across fullPage and modal modes)
  const ambientBackdrop = (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Radial Obsidian-Emerald Depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 70% at 75% 15%, rgba(16, 78, 56, 0.45) 0%, rgba(7, 30, 23, 0.94) 55%, #03110C 100%)',
        }}
      />

      {/* Subtle architectural perspective grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(230,191,110,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,191,110,0.45) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Large Ambient Orbiting Shamseh Watermark */}
      <motion.div
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-44 -right-44 w-[680px] h-[680px] opacity-30"
      >
        <ShamsehMandala className="w-full h-full" strokeOpacity={0.22} />
      </motion.div>

      <motion.div
        animate={prefersReducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 210, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-56 -left-48 w-[640px] h-[640px] opacity-25"
      >
        <ShamsehMandala className="w-full h-full" strokeOpacity={0.18} />
      </motion.div>

      {/* Breathing Golden & Emerald Volumetric Halos */}
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, 32, 0], y: [0, -24, 0], opacity: [0.22, 0.36, 0.22] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[12%] right-[14%] w-[440px] h-[440px] rounded-full bg-[#D8A84E]/15 blur-[130px]"
      />
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, -28, 0], y: [0, 26, 0], opacity: [0.24, 0.4, 0.24] }
        }
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[8%] left-[12%] w-[520px] h-[520px] rounded-full bg-emerald-600/20 blur-[140px]"
      />

      {/* Floating Luminous Golden Dust Motes */}
      {!prefersReducedMotion &&
        LUMINOUS_PARTICLES.map(p => (
          <motion.span
            key={p.id}
            style={{
              right: p.right,
              top: p.top,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -34, 0],
              opacity: [0.12, 0.85, 0.12],
              scale: [0.85, 1.35, 0.85],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute rounded-full bg-[#F8DF9C] shadow-[0_0_10px_rgba(248,223,156,0.9)]"
          />
        ))}
    </div>
  );

  const mobileLoginView = (
    <div
      className="md:hidden min-h-screen w-full bg-[#F6F5F0] text-[#071E17] flex flex-col justify-between overflow-y-auto overscroll-y-contain"
      dir="rtl"
    >
      {/* Top Obsidian-Emerald Architectural Brand Header */}
      <div className="relative bg-gradient-to-br from-[#071E17] via-[#0E3226] to-[#113D30] text-white px-5 pt-7 pb-11 overflow-hidden shrink-0">
        {/* Persian Lattice & Champagne Gold Top Hairline */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-l from-transparent via-[#F3D078]/85 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#D4AF37]/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-12 w-52 h-52 rounded-full bg-emerald-400/15 blur-2xl"
        />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="relative z-20 mb-3 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 text-[#F3D078] active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="relative z-10 flex items-center gap-3.5">
          {/* Compact Theme 2 Scales Emblem */}
          <div className="w-13 h-13 rounded-2xl bg-[#071E17] border border-[#F3D078]/45 flex items-center justify-center shadow-lg shadow-black/30 shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
              <path
                d="M9 39V22C9 14.5 16 8.5 24 6C32 8.5 39 14.5 39 22V39"
                stroke="#F3D078"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path d="M24 13V36M17 36H31" stroke="#D4AF37" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M14 20H34" stroke="#FFF1C2" strokeWidth="1.8" strokeLinecap="round" />
              <path
                d="M14 20L11 27C11 28.8 12.6 30 14.5 30C16.4 30 18 28.8 18 27L15 20"
                stroke="#F3D078"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M34 20L31 27C31 28.8 32.6 30 34.5 30C36.4 30 38 28.8 38 27L35 20"
                stroke="#F3D078"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="12" r="2" fill="#FFF3C8" />
            </svg>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold text-[#F3D078] tracking-wide">
              قوه قضائیه جمهوری اسلامی ایران
            </p>
            <h1 className="text-[18px] font-black leading-snug text-white">
              مرکز مدیریت و دانش‌آموختگان فقه و قضا
            </h1>
          </div>
        </div>

        <p className="relative z-10 mt-3 text-[11px] leading-relaxed text-emerald-100/85">
          درگاه امن کارتابل اداری، پژوهش، مشاوره‌های تخصصی و خدمات دانش‌آموختگان
        </p>
      </div>

      {/* Overlapping Warm Ivory Pearl Form Surface */}
      <div className="relative z-20 -mt-5 px-4 pb-6 flex-1 flex flex-col justify-between">
        <div className="bg-[#FCFCF9] rounded-[28px] border border-[#E5DEC9] shadow-[0_18px_45px_-18px_rgba(7,30,23,0.18)] p-5 space-y-5">
          {/* Theme 2 Mode Switcher */}
          {!mustChangePasswordMode && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#EFEAD9] border border-[#DED5BC]">
              <button
                type="button"
                onClick={() => {
                  setCustomerRegisterMode(false);
                  setErrorMsg('');
                }}
                className={`py-2.5 px-2.5 min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !customerRegisterMode
                    ? 'bg-gradient-to-l from-[#071E17] to-[#113D30] text-[#F3D078] shadow-sm'
                    : 'text-[#314A40]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>ورود اعضا و مدیران</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerRegisterMode(true);
                  setErrorMsg('');
                }}
                className={`py-2.5 px-2.5 min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  customerRegisterMode
                    ? 'bg-gradient-to-l from-[#D4AF37] to-[#E8C15A] text-[#071E17] shadow-sm'
                    : 'text-[#314A40]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>ثبت‌نام مشتریان</span>
              </button>
            </div>
          )}

          {/* Form Heading */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-black text-[#9A741B]">
              <span className="h-[2px] w-4 rounded-full bg-[#D4AF37]" />
              <span>
                {mustChangePasswordMode
                  ? 'اقدام امنیتی الزامی'
                  : customerRegisterMode
                  ? 'عضویت سریع متقاضیان دوره‌ها و کتب'
                  : 'احراز هویت طرح میزان'}
              </span>
            </div>
            <h2 className="text-lg font-black text-[#071E17]">
              {mustChangePasswordMode
                ? 'تغییر اجباری رمز عبور اولیه'
                : customerRegisterMode
                ? 'ایجاد حساب کاربری مشتری'
                : 'ورود به حساب کاربری'}
            </h2>
            <p className="text-xs text-[#4C6258] leading-relaxed">
              {mustChangePasswordMode
                ? `کاربر گرامی${tempUserData?.fullName ? ` ${tempUserData.fullName}` : ''}، رمز عبور جدید خود را ثبت نمائید.`
                : customerRegisterMode
                ? 'ویژه متقاضیان غیر دانش‌آموخته جهت دسترسی به دوره‌ها و آثار'
                : 'کد ملی یا شناسه کاربری و رمز عبور خود را وارد نمائید.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {changePasswordSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>رمز عبور به‌روزرسانی شد. در حال انتقال به سامانه...</span>
            </div>
          )}

          {activeFormKey === 'member-login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  کد ملی / شناسه کاربری
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="کد ملی یا نام کاربری"
                    dir="ltr"
                    className="w-full min-h-[48px] px-4 pr-11 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all"
                  />
                  <UserIcon className="w-5 h-5 text-[#647D72] absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-[#0E3226]">
                    رمز عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] font-bold text-[#9A741B] cursor-pointer"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full min-h-[48px] px-4 pr-11 pl-12 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all"
                  />
                  <Lock className="w-5 h-5 text-[#647D72] absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                    className="absolute left-1.5 top-1 w-10 h-10 flex items-center justify-center text-[#647D72] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-0.5">
                <input
                  type="checkbox"
                  id="mobileRememberSession"
                  defaultChecked
                  className="w-4 h-4 rounded border-[#C8BEA4] accent-[#0E3226] cursor-pointer"
                />
                <label
                  htmlFor="mobileRememberSession"
                  className="text-xs text-[#4C6258] select-none cursor-pointer font-medium"
                >
                  به‌خاطر سپردن نشست امن در این دستگاه
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-l from-[#071E17] via-[#0E3226] to-[#113D30] text-[#F3D078] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#071E17]/25 border border-[#D4AF37]/40 active:scale-[0.985] transition-transform disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#F3D078]/30 border-t-[#F3D078] rounded-full animate-spin" />
                    <span>در حال بررسی اعتبار...</span>
                  </>
                ) : (
                  <>
                    <span>ورود امن به سامانه</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeFormKey === 'customer-register' && (
            <form onSubmit={handleCustomerRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  required
                  value={custFullName}
                  onChange={e => setCustFullName(e.target.value)}
                  placeholder="مثال: محمد محمدی"
                  className="w-full min-h-[46px] px-4 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  کد ملی (شناسه کاربری ورود)
                </label>
                <input
                  type="text"
                  required
                  value={custNationalId}
                  onChange={e => setCustNationalId(e.target.value)}
                  placeholder="۱۰ رقم کد ملی"
                  dir="ltr"
                  className="w-full min-h-[46px] px-4 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  شماره تلفن همراه
                </label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={e => {
                    setCustPhone(e.target.value);
                    if (!custPassword) setCustPassword(e.target.value);
                  }}
                  placeholder="09120000000"
                  dir="ltr"
                  className="w-full min-h-[46px] px-4 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  رمز عبور دلخواه
                </label>
                <input
                  type="password"
                  required
                  value={custPassword}
                  onChange={e => setCustPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  dir="ltr"
                  className="w-full min-h-[46px] px-4 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-l from-[#D4AF37] via-[#E5BF52] to-[#D4AF37] text-[#071E17] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/25 active:scale-[0.985] transition-transform disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>در حال ایجاد حساب مشتری...</span>
                ) : (
                  <>
                    <span>تکمیل ثبت‌نام و ورود</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeFormKey === 'change-password' && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    dir="ltr"
                    className="w-full min-h-[48px] px-4 pr-11 pl-12 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20"
                  />
                  <Lock className="w-5 h-5 text-[#647D72] absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-1.5 top-1 w-10 h-10 flex items-center justify-center text-[#647D72] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0E3226] mb-1.5">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور جدید"
                    dir="ltr"
                    className="w-full min-h-[48px] px-4 pr-11 text-sm rounded-2xl bg-white border border-[#D9D0B8] text-[#071E17] placeholder-[#8C9991] font-mono focus:outline-none focus:border-[#0E3226] focus:ring-4 focus:ring-[#D4AF37]/20"
                  />
                  <Lock className="w-5 h-5 text-[#647D72] absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || changePasswordSuccess}
                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-l from-[#071E17] via-[#0E3226] to-[#113D30] text-[#F3D078] font-black text-sm flex items-center justify-center gap-2 shadow-lg border border-[#D4AF37]/40 active:scale-[0.985] transition-transform disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#F3D078]/30 border-t-[#F3D078] rounded-full animate-spin" />
                    <span>در حال ثبت رمز جدید...</span>
                  </>
                ) : (
                  <>
                    <span>ثبت رمز عبور جدید و ورود</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Support Footer */}
          <div className="pt-3.5 border-t border-[#EAE2CF] flex items-center justify-between text-[11px] text-[#4C6258]">
            <span className="font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0E3226]" />
              <span>احراز هویت رمزنگاری‌شده</span>
            </span>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1 font-black text-[#0E3226] cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#9A741B]" />
              <span>راهنمای ورود</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold text-[#6F7F77] mt-4">
          دبیرخانه مرکزی مرکز مدیریت و دانش‌آموختگان فقه و قضا
        </p>
      </div>
    </div>
  );

  return (
    <>
      {isFullPage ? (
        <>
          {mobileLoginView}
          <div
            className="hidden md:flex relative min-h-screen bg-[#03110C] items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden"
            dir="rtl"
          >
            {ambientBackdrop}
            {containerContent}
          </div>
        </>
      ) : (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-[#F6F5F0] overflow-y-auto overscroll-y-contain">
            {mobileLoginView}
          </div>
          <div
            className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-[#03110C]/92 backdrop-blur-2xl overflow-y-auto"
            dir="rtl"
          >
            {ambientBackdrop}
            {containerContent}
          </div>
        </>
      )}

      {/* HELP / FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
            dir="rtl"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gradient-to-b from-[#071E17] to-[#0E3226] border border-[#D4AF37]/45 rounded-3xl p-6 text-[#F7F4EC] space-y-4 shadow-[0_28px_70px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <CornerFiligree className="hidden md:block pointer-events-none absolute top-2 right-2 w-8 h-8 -scale-x-100 opacity-60" />
              <CornerFiligree className="hidden md:block pointer-events-none absolute bottom-2 left-2 w-8 h-8 -scale-y-100 opacity-60" />

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                aria-label="بستن"
                className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 text-[#F3D078]">
                <HelpCircle className="w-5 h-5" />
                <h4 className="font-black text-base">راهنمای بازیابی حساب و پشتیبانی</h4>
              </div>

              <p className="text-xs text-emerald-100/90 leading-relaxed">
                جهت حفظ امنیت اطلاعات قضات و دانش‌آموختگان، بازیابی رمز عبور منحصراً از طریق تأیید هویت در دبیرخانه مرکز امکان‌پذیر است.
              </p>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-[#D4AF37]/25 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-50">
                    <PhoneCall className="w-4 h-4 text-[#F3D078]" />
                    <span>تلفن پشتیبانی دبیرخانه:</span>
                  </div>
                  <span
                    className="font-mono text-[#F8DF9C] font-bold"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ۰۲۱-۸۸۹۰۰۰۰۰
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-[#D4AF37]/25 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-50">
                    <Mail className="w-4 h-4 text-[#F3D078]" />
                    <span>پست الکترونیک رسمی:</span>
                  </div>
                  <span className="font-mono text-[#F3D078] font-bold text-[11px]">
                    support@feqh-qaza.ir
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 bg-gradient-to-l from-[#D4AF37] to-[#F3D078] text-[#071E17] font-black rounded-2xl text-xs transition-all mt-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
              >
                متوجه شدم
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
