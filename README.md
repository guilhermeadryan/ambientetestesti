# Head Pulse — acesso privado por Google

## Publicar na Vercel

O projeto continua sendo Next.js com PostgreSQL/Neon. Use a pasta com package.json como raiz. O banco existente é preservado; as novas tabelas de usuários e sessões são criadas automaticamente.

Configure estas variáveis privadas na Vercel (sem prefixo NEXT_PUBLIC_) e faça um novo deploy:

| Variável | Valor |
| --- | --- |
| DATABASE_URL | Sua conexão PostgreSQL/Neon com SSL |
| APP_URL | A origem final do site, por exemplo https://head-pulse.vercel.app, sem caminho |
| GOOGLE_CLIENT_ID | Client ID OAuth de aplicativo Web do Google |
| GOOGLE_CLIENT_SECRET | Client Secret desse aplicativo OAuth |
| AUTH_SECRET | Segredo aleatório com pelo menos 32 caracteres |
| ADMIN_EMAIL | E-mail exato da conta Google do administrador principal |

Gere AUTH_SECRET com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Não compartilhe esse segredo nem o Client Secret. ADMIN_PASSWORD e o acesso antigo por senha não são mais utilizados.

## Configuração do login Google

1. No Google Cloud Console, crie ou selecione seu projeto e configure Google Auth Platform/tela de consentimento. Use somente openid, email e profile; não é solicitado acesso à caixa de entrada do Gmail.
2. Crie um cliente OAuth do tipo Aplicativo da Web.
3. Cadastre como URI de redirecionamento autorizado exatamente `https://SEU-DOMINIO/api/auth/callback`. O domínio deve ser o mesmo de APP_URL, incluindo o protocolo.
4. Cadastre a origem do site nas origens autorizadas quando solicitada pelo console.
5. Copie o Client ID e Client Secret para as variáveis privadas da Vercel.
6. Se o aplicativo estiver em teste, adicione os e-mails autorizados como usuários de teste no Google. Para uso normal da equipe, configure a audiência adequada e o estado de publicação no Google.
7. Redeploy e teste Entrar com Google usando a conta definida em ADMIN_EMAIL.

Referência oficial: https://developers.google.com/identity/openid-connect/openid-connect

Para desenvolvimento local, use APP_URL=http://localhost:3000 e cadastre http://localhost:3000/api/auth/callback em um cliente OAuth apropriado para testes. Produção exige HTTPS. Não use banco de produção nos testes locais.

## Aprovação pelo administrador

A única conta administrativa é a conta Google verificada cujo e-mail corresponde a ADMIN_EMAIL. Essa configuração inicial evita que a primeira pessoa a se cadastrar tome controle do painel. Use uma conta Gmail ou Google Workspace.

Todas as outras contas entram como Sem acesso. Elas veem apenas a tela Aguardando aprovação, sem indicadores, histórico, clientes, backups ou PDFs.

Depois que a pessoa fizer seu primeiro login, o administrador entra e usa Gerenciar acessos no topo do site:

- Sem acesso: bloqueia todas as informações, inclusive por chamadas diretas à API. Serve também para revogar uma autorização.
- Visualizar: permite consultar os indicadores e exportar PDF/backup. Não permite adicionar, alterar, excluir nem importar dados.
- Editar: permite visualizar e modificar os dados. Não permite gerenciar permissões.

Somente o administrador concede ou revoga permissões. Não há promoção de outros usuários a administrador pela interface. As APIs consultam a permissão atual a cada requisição; sessões já abertas não conservam um direito revogado. A interface revalida a permissão a cada 30 segundos e ao recuperar foco. Uma chamada bloqueada revalida o acesso imediatamente.

## Sessões e dados

As sessões duram até oito horas, ficam em cookie HttpOnly e Secure em produção e são validadas no banco. Sair revoga a sessão no servidor. Alterar AUTH_SECRET invalida sessões e logins em andamento. O callback valida state e PKCE e verifica a identidade diretamente no Google. Não são armazenados tokens de acesso do Google. A sessão guarda apenas um token aleatório; permissões não são confiadas ao navegador.

Os dados iniciais foram separados em lib/seed.ts e só são usados no servidor para inicializar um banco vazio. Não são enviados dentro do JavaScript público. As APIs privadas não permitem cache. Tabelas antigas de login por senha podem permanecer no banco, mas não dão mais acesso.

Tema claro/escuro, edição por períodos e PDF do mês selecionado foram preservados. Para exportar, selecione equipe e período e use Exportar PDF. Salve alterações antes de exportar. Notas gerais da liderança são identificadas como gerais no relatório.

## Validar

Requer Node.js 22. Execute npm ci, npm run typecheck, npm test e npm run build. Os testes usam PostgreSQL embarcado PGlite e respostas Google simuladas, sem acesso a contas reais. O login real deve ser validado após configurar as credenciais e o domínio na sua conta.
