import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({
 registerType:'prompt',injectRegister:false,
 manifest:{id:'./',name:'나의 여지도 · Australia',short_name:'나의 여지도',description:'나만의 호주 여행 지도와 기록',lang:'ko',start_url:'./',scope:'./',display:'standalone',background_color:'#f1f7f3',theme_color:'#1c6560',icons:[{src:'icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},
 workbox:{clientsClaim:true,maximumFileSizeToCacheInBytes:8*1024*1024,globPatterns:['**/*.{js,css,html,svg,png,jpg,json,geojson,woff2}'],navigateFallback:'index.html',navigateFallbackDenylist:[/^\/auth\//,/^\/rest\//],cleanupOutdatedCaches:true},
})],base:'./',server:{port:5173,strictPort:true}});
