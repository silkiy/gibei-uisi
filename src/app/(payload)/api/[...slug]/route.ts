import config from '@payload-config';
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes';

const post = REST_POST(config);
const allowedOrigin = new URL(process.env.SERVER_URL || 'http://127.0.0.1:3000').origin;
function sameOrigin(handler: typeof post): typeof post {
  return (request, context) => {
    const origin = request.headers.get('origin');
    if (origin && origin !== allowedOrigin) return Promise.resolve(Response.json({ errors: [{ message: 'Origin is not allowed' }] }, { status: 403 }));
    return handler(request, context);
  };
}
export const GET = REST_GET(config);
export const DELETE = sameOrigin(REST_DELETE(config));
export const PATCH = sameOrigin(REST_PATCH(config));
export const PUT = sameOrigin(REST_PUT(config));
export const OPTIONS = REST_OPTIONS(config);
export const POST: typeof post = sameOrigin((request, context) => {
  if (['/first-register', '/forgot-password', '/reset-password'].some(path => new URL(request.url).pathname.replace(/\/+$/, '').endsWith(path))) {
    return Promise.resolve(Response.json({ errors: [{ message: 'Account setup and recovery are managed locally' }] }, { status: 403 }));
  }
  return post(request, context);
});
