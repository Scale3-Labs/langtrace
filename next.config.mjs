/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental:{
    outputFileTracingIncludes: {
      "/api/trace": ["./proto/*.proto"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ehm7pxbzyz4iionv.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
