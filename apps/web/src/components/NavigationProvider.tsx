'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { setRouter, prefetchCommonRoutes } from '@/lib/navigation';

interface NavigationProviderProps {
  children: React.ReactNode;
}

/**
 * NavigationProvider - Sets up global navigation utilities
 * 
 * This component:
 * 1. Registers the router instance for use outside React components
 * 2. Prefetches common routes based on user role
 * 3. Handles route change events for analytics/tracking
 */
export default function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Register router instance on mount
  useEffect(() => {
    setRouter(router);
  }, [router]);

  // Prefetch common routes when user is authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.role) {
          prefetchCommonRoutes(user.role, router);
        }
      } catch {
        // Invalid user data, ignore
      }
    }
  }, [router, pathname]);

  return <>{children}</>;
}
