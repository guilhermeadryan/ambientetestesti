import type {NextConfig} from 'next';
const config:NextConfig={async headers(){return [{source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'Vary',value:'Cookie'}]},{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'same-origin'}]}]}};
export default config;
