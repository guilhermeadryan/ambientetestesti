import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Head Pulse | STI & ISM',description:'Gestão de indicadores, metas e evolução das equipes STI e ISM.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}