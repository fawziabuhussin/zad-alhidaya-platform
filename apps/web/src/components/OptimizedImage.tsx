'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

// Base64 encoded tiny placeholder (10x10 blurred gradient matching brand colors)
const BLUR_PLACEHOLDER = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxYTNhMmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyZDVhNGEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz48L3N2Zz4=';

/**
 * Optimized Image Component
 * - Uses Next.js Image for automatic optimization
 * - Adds blur placeholder during loading
 * - Lazy loads off-screen images by default
 * - Graceful fallback for invalid URLs
 */
export function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fallback for missing or invalid images
  if (!src || error) {
    return (
      <div 
        className={`bg-gradient-to-br from-[#1a3a2f] to-[#2d5a4a] flex items-center justify-center ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-white text-4xl font-bold opacity-50">
          {alt?.charAt(0) || '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''}`}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {/* Show blur placeholder while loading */}
      {!loaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#1a3a2f] to-[#2d5a4a] animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Course Cover Image - Preset for course cards
 * Optimized sizes for course card layouts
 */
export function CourseCoverImage({
  src,
  alt,
  priority = false,
  className = '',
}: {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src || ''}
      alt={alt}
      fill
      priority={priority}
      className={className}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
    />
  );
}
