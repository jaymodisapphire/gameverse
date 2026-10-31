'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  fallbackText?: string;
  alt?: string;
}

/**
 * Universal User Avatar component.
 * Safely renders:
 *  1. Remote image URLs (Google OAuth, Gravatar, CDNs) with referrerPolicy="no-referrer"
 *  2. Local image paths
 *  3. In-game 2-letter emblems ('GV', 'SK', etc.)
 *  4. Single-character emojis ('👑', '🎮', etc.)
 *  5. Automatic fallback to player initials if an image fails to load.
 *
 * Guarantees `overflow-hidden` so URL strings never overflow the container.
 */
export function UserAvatar({
  src,
  name,
  className = 'w-7 h-7 rounded-lg',
  fallbackText,
  alt,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const cleanSrc = (src || '').trim();
  const isUrl = Boolean(
    cleanSrc &&
      (cleanSrc.startsWith('http://') ||
        cleanSrc.startsWith('https://') ||
        cleanSrc.startsWith('/'))
  );

  const initials = name
    ? name
        .trim()
        .substring(0, 2)
        .toUpperCase()
    : 'GV';

  const fallback = fallbackText || initials;

  if (isUrl && !hasError) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 bg-violet-950/60 select-none ${className}`}
      >
        <img
          src={cleanSrc}
          alt={alt || name || 'Player Avatar'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Not a URL, or image failed to load
  const displayString = !isUrl && cleanSrc ? cleanSrc : fallback;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center font-black select-none flex-shrink-0 ${className}`}
    >
      <span className="truncate max-w-full px-0.5 tracking-tight">
        {displayString}
      </span>
    </div>
  );
}
