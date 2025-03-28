import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { supabaseClient } from "~/services/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { data } = await supabaseClient.auth.getSession();
  
  // If already logged in, redirect to home
  if (data.session) {
    return redirect('/');
  }
  
  return json({
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const action = formData.get('action') as string;
  
  if (!email || !password) {
    return json({ error: 'Email and password are required' });
  }
  
  try {
    if (action === 'signup') {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      return json({ success: 'Check your email for the confirmation link' });
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return redirect('/');
    }
  } catch (error: any) {
    return json({ error: error.message });
  }
}

export default function Login() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Make ENV available to the client
  if (typeof window !== "undefined") {
    window.ENV = data.ENV;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignUp 
              ? 'Already have an account? ' 
              : 'Don\'t have an account? '}
            <button
              className="font-medium text-primary hover:text-primary/80"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
        
        {actionData?.error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{actionData.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {actionData?.success && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Success
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>{actionData.success}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="action" value={isSignUp ? 'signup' : 'login'} />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="Password"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSignUp ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}