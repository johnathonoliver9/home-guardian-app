import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
export const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{persistSession:false}});
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function currentUser(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if (!token) return null;
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false}});
  const {data,error}=await auth.auth.getUser(token);
  return error ? null : data.user;
}
export async function isActive(userId:string) {
  const {data}=await db().from('memberships').select('status,paid_through').eq('user_id',userId).maybeSingle();
  return !!data && (data.status==='active'||data.status==='trialing') && !!data.paid_through && new Date(data.paid_through).getTime()>Date.now();
}
export const unauthorized=()=>Response.json({error:'Sign in required'},{status:401});
