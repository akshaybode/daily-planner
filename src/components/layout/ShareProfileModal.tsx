"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Lock,
  Share2,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareProfileModal({ isOpen, onClose }: ShareProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [isPublic, setIsPublic] = useState(user?.isProfilePublic ?? true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setBio(user.bio || "");
      setIsPublic(user.isProfilePublic ?? true);
    }
    setCopied(false);
    setSaved(false);
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${user.publicSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const updated: User = {
      ...user,
      bio,
      isProfilePublic: isPublic,
    };
    await updateUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white dark:bg-surface-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
              <Share2 className="w-4 h-4 text-brand-500" />
            </div>
            <h2 className="text-lg font-bold">Share Profile</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 -mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Public toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-emerald-500" />
              ) : (
                <Lock className="w-5 h-5 text-surface-400" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {isPublic ? "Profile is public" : "Profile is private"}
                </p>
                <p className="text-xs text-surface-400">
                  {isPublic
                    ? "Anyone with the link can view your stats"
                    : "Only you can see your profile"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-200",
                isPublic ? "bg-emerald-500" : "bg-surface-300 dark:bg-surface-600"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                  isPublic ? "translate-x-[22px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-600 dark:text-surface-400">
              Profile Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field resize-none text-sm"
              placeholder="Staying productive, one task at a time..."
              rows={2}
              maxLength={160}
            />
            <p className="text-xs text-surface-400 mt-1 text-right">{bio.length}/160</p>
          </div>

          {/* Save */}
          <button onClick={handleSave} className="btn-primary w-full">
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </button>

          {/* Profile URL */}
          {isPublic && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-400">
                Your public profile link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                  <LinkIcon className="w-4 h-4 text-surface-400 flex-shrink-0" />
                  <span className="text-sm text-surface-600 dark:text-surface-300 truncate">
                    {profileUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex-shrink-0 p-2.5 rounded-xl transition-all",
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300"
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 text-sm py-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </a>
                <button
                  onClick={handleCopy}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
