'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { homeForRole } from '@/lib/navigation';
import type { UserRole } from '@/lib/api';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else router.replace(homeForRole(user.role as UserRole));
  }, [user, loading, router]);

  return null;
}