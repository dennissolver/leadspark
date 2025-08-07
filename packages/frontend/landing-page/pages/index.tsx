import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/signup');
  }, [router]);

  return null; // Don't render anything, as we're redirecting immediately
}
