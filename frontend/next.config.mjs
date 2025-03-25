/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/ws-api/visualize',
                destination: 'http://task-runner:80'
            }
        ]
    }
};

export default nextConfig;
