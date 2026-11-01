import { atomic, requestContext, failure } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { recruitmentDetail } from '../../../../../../content/recruitment-read';
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}) {
  try {const {slug}=await params,req=await requestContext(request);req.user=null;const doc=await atomic(req,async()=>{await editorialLock(req,true);return recruitmentDetail(req,slug);});return Response.json(doc || {errors:[{message:'Not found'}]},{status:doc?200:404,headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}
}
