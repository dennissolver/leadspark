import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../../common/lib/supabaseClient';
import { Button } from '@leadspark/ui/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@leadspark/ui/components/Card';

export default function OAuthCallback() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not found.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://<your-supabase-project>.supabase.co/functions/v1/onboardTenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, user_id: user.id }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Signup</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Complete Signup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}