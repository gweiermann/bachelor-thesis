import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: '/ws-api/visualize',
                destination: 'http://task-runner:80'
            }
        ]
    }
}

export default nextConfig
