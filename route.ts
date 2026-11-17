import Stripe from 'stripe';
import {db,stripe} from '../../../../lib/server';
export async function POST(req:Request){
 const sig=req.headers.get('stripe-signature');if(!sig)return new Response('Missing signature',{status:400});
 let event:Stripe.Event;
 try{event=stripe().webhooks.constructEvent(await req.text(),sig,process.env.STRIPE_WEBHOOK_SECRET!)}catch{return new Response('Invalid signature',{status:400})}
 if(event.type==='checkout.session.completed'){
   const s=event.data.object as Stripe.Checkout.Session;
   if(s.mode==='subscription'&&s.subscription&&s.client_reference_id){
     const sub=await stripe().subscriptions.retrieve(s.subscription as string);
     await sync(sub,s.client_reference_id);
   }
 }
 if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
   const sub=event.data.object as Stripe.Subscription;
   const userId=sub.metadata.user_id;
   if(userId)await sync(sub,userId);
 }
 return Response.json({received:true});
}
async function sync(sub:Stripe.Subscription,userId:string){
 const item=sub.items.data[0];const paidThrough=item?.current_period_end?new Date(item.current_period_end*1000).toISOString():null;
 const plan=sub.metadata.plan==='annual'?'annual':'monthly';
 const {error}=await db().from('memberships').upsert({user_id:userId,stripe_subscription_id:sub.id,status:sub.status,plan,paid_through:paidThrough,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error)throw error;
}
