import { atomic, requestContext, failure } from '../../../../../server/request';
import { editorialLock } from '../../../../../media/access';
import { publicEvents } from '../../../../../content/event-read';
export async function GET(request:Request) {
  try { const req=await requestContext(request); req.user=null; const data=await atomic(req,async()=>{await editorialLock(req,true); return publicEvents(req,new URL(request.url).searchParams);}); return Response.json(data,{headers:{'Cache-Control':'no-store'}}); } catch(error){return failure(error);}
}
