import React, { useState } from 'react';
import { X as CloseIcon, Check, Copy, Share2 } from 'lucide-react';
import { postShare } from '../lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  categoryName: string;
  campaignYear?: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  categoryName,
  campaignYear = 2027
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `I just predicted ${candidateName} for ${categoryName} in the GRAMMY ${campaignYear} fan predictions on Fanbase! Who do you think deserves a nomination?`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const logShare = (platform: string) => {
    postShare({
      platform,
      candidateName,
      categoryName,
      timestamp: new Date().toISOString()
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    logShare('copy_link');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = (platform: string, url: string) => {
    logShare(platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close share dialog"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
        >
          <CloseIcon size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Share2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Share Your Prediction</h3>
          <p className="text-sm text-neutral-400 mt-1">
            Let fans know you predicted <span className="text-amber-400 font-semibold">{candidateName}</span> for {categoryName}!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            onClick={() => handleShare('whatsapp', whatsappUrl)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20 font-medium text-sm transition"
          >
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => handleShare('x', xUrl)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-medium text-sm transition"
          >
            <span>X (Twitter)</span>
          </button>

          <button
            onClick={() => handleShare('telegram', telegramUrl)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 border border-sky-600/20 font-medium text-sm transition"
          >
            <span>Telegram</span>
          </button>

          <button
            onClick={() => handleShare('facebook', facebookUrl)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 font-medium text-sm transition"
          >
            <span>Facebook</span>
          </button>
        </div>

        <div className="pt-3 border-t border-neutral-800">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-sm transition"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Prediction Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
