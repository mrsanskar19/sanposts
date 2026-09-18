
'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  User,
  Sliders,
  Share2,
  CreditCard,
  Check,
  Sun,
  Moon,
  Laptop,
  Key,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '../brand/Logo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onClearAllChats?: () => void;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

type TabKey = 'general' | 'models' | 'account' | 'socials' | 'billing';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onClearAllChats,
  defaultTab,
  onTabChange,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>(
    (defaultTab as TabKey) || 'general'
  );
  const [displayName, setDisplayName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    groq: '',
    deepseek: '',
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [confirmClearChats, setConfirmClearChats] = useState(false);

  if (!isOpen) return null;

  const handleTabClick = (tab: TabKey) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setPasswordMsg({
        type: 'error',
        text: 'Please enter your current password.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: 'error',
        text: 'New passwords do not match.',
      });
      return;
    }

    setPasswordMsg({
      type: 'success',
      text: 'Password updated successfully!',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3000);
  };

  const handleExecuteClearAllChats = () => {
    onClearAllChats?.();
    setConfirmClearChats(false);
    onClose();
  };

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ElementType;
  }[] = [
    { key: 'general', label: 'General', icon: Sliders },
    { key: 'models', label: 'API Keys & Models', icon: Cpu },
    { key: 'account', label: 'Account & Security', icon: User },
    { key: 'socials', label: 'Socials', icon: Share2 },
    { key: 'billing', label: 'Plan & Usage', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[80vh] min-h-[580px] bg-background/95 backdrop-blur-2xl rounded-lg sm:rounded-xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[88dvh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" showText={false} />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Workspace Settings
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Configure models, API keys, password, and preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 min-h-[400px] overflow-hidden">
          <div className="flex sm:flex-col sm:w-48 shrink-0 overflow-x-auto custom-scrollbar p-2 sm:p-3 gap-1 border-b sm:border-b-0 sm:border-r border-border bg-secondary/40">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabClick(t.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md sm:rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Appearance & Theme
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select your preferred interface color mode.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg text-xs font-semibold transition-all ${
                        theme === 'light'
                          ? 'bg-primary/10 text-primary ring-2 ring-ring'
                          : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg text-xs font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-primary/10 text-primary ring-2 ring-ring'
                          : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-primary" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg text-xs font-semibold transition-all ${
                        theme === 'system'
                          ? 'bg-primary/10 text-primary ring-2 ring-ring'
                          : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Laptop className="w-4 h-4 text-muted-foreground" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Legal & Compliance
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Read our service terms and privacy agreement.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Terms
                      </Link>
                      <span className="text-muted-foreground">&bull;</span>
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Synthesis Model
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selected model powers caption tailoring, hashtag
                    generation, and multimodal analysis.
                  </p>

                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-md sm:rounded-lg bg-muted text-foreground border border-input text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="gpt-4o">
                      OpenAI GPT-4o (High-Conversion Social Copy)
                    </option>
                    <option value="gpt-4o-mini">
                      OpenAI GPT-4o Mini (Fast & Cost-Effective)
                    </option>
                    <option value="claude-3-7-sonnet">
                      Anthropic Claude 3.7 Sonnet (Advanced Reasoning)
                    </option>
                    <option value="claude-3-5-haiku">
                      Anthropic Claude 3.5 Haiku (Rapid Generation)
                    </option>
                    <option value="gemini-2-0-flash">
                      Google Gemini 2.0 Flash (Multimodal & Fast)
                    </option>
                    <option value="gemini-1-5-pro">
                      Google Gemini 1.5 Pro (Deep Contextual Analysis)
                    </option>
                    <option value="llama-3-3-70b">
                      Groq Llama 3.3 70B (Ultra-Low Latency)
                    </option>
                    <option value="deepseek-v3">
                      DeepSeek V3 (High-Signal Technical Breakdown)
                    </option>
                    <option value="deepseek-r1">
                      DeepSeek R1 (Deep Chain-of-Thought Reasoning)
                    </option>
                  </select>
                </div>

                <div className="pt-3 border-t border-border space-y-3.5">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      <span>Custom Model API Keys</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Optionally provide your personal API keys to bypass rate
                      limits or use custom model tiers.
                    </p>
                  </div>

                  {[
                    {
                      id: 'openai',
                      label: 'OpenAI API Key',
                      placeholder: 'sk-proj-...',
                    },
                    {
                      id: 'anthropic',
                      label: 'Anthropic Claude Key',
                      placeholder: 'sk-ant-api03-...',
                    },
                    {
                      id: 'gemini',
                      label: 'Google Gemini API Key',
                      placeholder: 'AIzaSy...',
                    },
                    {
                      id: 'groq',
                      label: 'Groq Cloud Key',
                      placeholder: 'gsk_...',
                    },
                    {
                      id: 'deepseek',
                      label: 'DeepSeek API Key',
                      placeholder: 'sk-...',
                    },
                  ].map(provider => (
                    <div key={provider.id}>
                      <label className="block text-[11px] font-semibold text-foreground mb-1">
                        {provider.label}
                      </label>

                      <div className="relative flex items-center">
                        <input
                          type={showKeys[provider.id] ? 'text' : 'password'}
                          value={
                            apiKeys[provider.id as keyof typeof apiKeys]
                          }
                          onChange={e =>
                            setApiKeys(prev => ({
                              ...prev,
                              [provider.id]: e.target.value,
                            }))
                          }
                          placeholder={provider.placeholder}
                          className="w-full px-3 py-1.5 rounded-md sm:rounded-lg bg-muted text-foreground placeholder:text-muted-foreground border border-input text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-foreground">
                    Profile Information
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-1.5 rounded-md sm:rounded-lg bg-muted text-foreground placeholder:text-muted-foreground border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-3 py-1.5 rounded-md sm:rounded-lg bg-muted text-foreground placeholder:text-muted-foreground border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        <span>Change Password</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Update your account password securely.
                      </p>
                    </div>

                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {passwordMsg && (
                    <div
                      className={`p-2.5 rounded-md sm:rounded-lg text-xs border ${
                        passwordMsg.type === 'success'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}
                    >
                      {passwordMsg.text}
                    </div>
                  )}

                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-2.5"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-foreground mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-1.5 rounded-md sm:rounded-lg bg-muted text-foreground placeholder:text-muted-foreground border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full px-3 py-1.5 rounded-md sm:rounded-lg bg-muted text-foreground placeholder:text-muted-foreground border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-foreground mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full px-3 py-1.5 rounded-md sm:rounded-lg bg-muted text-foreground placeholder:text-muted-foreground border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-md sm:rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                <div className="pt-4 border-t border-destructive/20 space-y-2">
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Danger Zone: Clear Conversations</span>
                  </h4>

                  <p className="text-[11px] text-muted-foreground">
                    Permanently delete all chat history and generated posts
                    across all sessions.
                  </p>

                  {!confirmClearChats ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearChats(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md sm:rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 text-xs font-semibold transition-colors border border-destructive/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove All Chats</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-md sm:rounded-lg bg-destructive/10 border border-destructive/30 space-y-2 animate-in fade-in duration-150">
                      <p className="text-xs font-semibold text-destructive">
                        Are you sure? This will delete all chat history and
                        cannot be reversed.
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExecuteClearAllChats}
                          className="px-3 py-1.5 rounded-md sm:rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-bold transition-colors"
                        >
                          Yes, Delete All Chats
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmClearChats(false)}
                          className="px-3 py-1.5 rounded-md sm:rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'socials' && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground mb-2">
                  Connect channels for one-click scheduling and direct
                  distribution.
                </p>

                {[
                  {
                    name: 'LinkedIn',
                    handle: '@sanskar-tiwari',
                    status: 'Connected',
                  },
                  {
                    name: 'X / Twitter',
                    handle: '@sanskar_dev',
                    status: 'Connected',
                  },
                  {
                    name: 'Instagram',
                    handle: 'Not connected',
                    status: 'Connect',
                  },
                  {
                    name: 'Facebook',
                    handle: 'Not connected',
                    status: 'Connect',
                  },
                  {
                    name: 'Reddit',
                    handle: 'u/sanskar_dev',
                    status: 'Connected',
                  },
                ].map(social => (
                  <div
                    key={social.name}
                    className="flex items-center justify-between p-3 rounded-md sm:rounded-lg bg-secondary"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {social.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {social.handle}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-md sm:rounded-lg text-xs font-semibold transition-colors ${
                        social.status === 'Connected'
                          ? 'bg-muted text-foreground hover:bg-secondary'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                    >
                      {social.status}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg sm:rounded-xl bg-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Plan
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {user.plan} Active
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-foreground">
                    Pro Creator Suite
                  </h4>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    $29 / month &bull; Unlimited generations
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium mb-1.5 text-foreground">
                      <span>Monthly Generation Credits</span>
                      <span>
                        {user.creditsUsed} / {user.creditsTotal}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${(user.creditsUsed / user.creditsTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/50">
          <div className="text-xs text-primary font-medium">
            {savedSuccess ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Changes saved successfully!
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md sm:rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md sm:rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
