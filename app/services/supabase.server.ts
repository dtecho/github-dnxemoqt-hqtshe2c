import { createClient } from '@supabase/supabase-js';
import { redirect } from '@remix-run/node';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY is required');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not configured. Some features may not work as expected.');
}

export const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const getUserByRequestToken = async (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user) return null;

  return data.user;
};

export const requireAuthSession = async (request: Request) => {
  const user = await getUserByRequestToken(request);
  if (!user) {
    throw redirect('/login');
  }
  return user;
};
