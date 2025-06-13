/** @type {import('next').NextConfig} */
import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
const withCivicAuth = createCivicAuthPlugin({
  clientId: "8d2ee20a-b1f7-4bc2-89a9-2648289e05bb"
});

export default withCivicAuth(nextConfig)
