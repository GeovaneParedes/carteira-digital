/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite conexões do servidor de dev via IP da rede local e tunnels
  allowedDevOrigins: [
    '192.168.100.9',
    'localhost:3000',
    '192.168.100.9:3000',
  ],
  // Configuração necessária para o deploy no GitHub Pages
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;