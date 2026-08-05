import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  // Send the root URL straight to the docs. Temporary (307) rather than
  // permanent so it stays easy to swap for a real landing page later.
  async redirects() {
    return [{ source: '/', destination: '/docs', permanent: false }];
  },
};

export default withMDX(config);
