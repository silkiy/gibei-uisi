export function GET() {
  return Response.json({ message: 'Account provisioning is available through the local CLI only' }, {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}
