import { publicP1 } from './p1-read';
import type { PayloadRequest } from 'payload';
import { publishedPage } from './pages-read';
import { publicationIndex } from './publication-index';
import { publicEvents } from './event-read';
import { activeRecruitment } from './recruitment-read';
export async function homepageData(req:PayloadRequest) {
  const home=await publishedPage(req,'homepage'),about=await publishedPage(req,'about'),publications=await publicationIndex(req),events=await publicEvents(req,new URLSearchParams({status:'upcoming',limit:'3'})),campaign=await activeRecruitment(req);
  const partners=(await publicP1(req,'partners',new URLSearchParams({limit:'6'}),undefined,true)).docs,achievements=(await publicP1(req,'achievements',new URLSearchParams({limit:'3'}))).docs;
  return {partners,achievements,home,about,...publications,events:events.docs,campaign};
}
