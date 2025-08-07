import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/leadspark-intro');
  }, [router]);

  return null; // Don't render anything, as we're redirecting immediately
}
