import { withPayload } from '@payloadcms/next/withPayload';

export default withPayload({
  distDir: process.env.GIBEI_TEST_RUN_ID ? '.next-test' : '.next',
  typescript: { tsconfigPath: process.env.GIBEI_TEST_RUN_ID ? 'tsconfig.test.json' : 'tsconfig.json' },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ] }];
  },
});
