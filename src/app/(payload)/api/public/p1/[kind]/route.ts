import { requestContext, atomic, failure } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { publicP1, type P1Kind } from '../../../../../../content/p1-read';
export async function GET(request: Request,{params}:{params:Promise<{kind:string}>}) {
  try {
    const {kind}=await params;if(!['galleries','partners','achievements'].includes(kind)) return new Response(null,{status:404});
    const req=await requestContext(request);req.user=null;
    return Response.json(await atomic(req,async()=>{await editorialLock(req,true);return publicP1(req,kind as P1Kind,new URL(request.url).searchParams);}),{headers:{'Cache-Control':'no-store'}});
  }catch(error){return failure(error);}
}
