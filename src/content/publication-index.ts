import type { PayloadRequest } from 'payload';
import { publicArticles } from './public-read';
import { publicResearch } from './research-read';
export async function publicationIndex(req:PayloadRequest) {
  const query=new URLSearchParams({limit:'3'});
  return {articles:(await publicArticles(req,query)).docs,research:(await publicResearch(req,query)).docs};
}
