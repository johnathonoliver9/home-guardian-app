import {currentUser,db} from './server';
export async function requireAdmin(req:Request){
 const user=await currentUser(req);
 if(!user) return {error:Response.json({error:'Sign in required'},{status:401})};
 const {data,error}=await db().from('home_guardian_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(error||!data) return {error:Response.json({error:'Administrator access required'},{status:403})};
 return {user};
}
