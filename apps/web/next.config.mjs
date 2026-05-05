/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite importar pacotes do monorepo como código-fonte (sem build prévio)
  transpilePackages: ["@teachflow/database", "@teachflow/api-client"],
};

export default nextConfig;
