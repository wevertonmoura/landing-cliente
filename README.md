# ⛰️ Trilha 3 Reinos - Plataforma de Vendas e Ingressos

![Status](https://img.shields.io/badge/Status-Concluído-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> Sistema completo e automatizado para venda de ingressos, desenvolvido para o grupo de corrida Invasores. A plataforma gerencia desde a inscrição e pagamento via PIX até a emissão de tickets virtuais e administração do evento.

## 💻 Sobre o Projeto

A **Trilha 3 Reinos** exigia um sistema robusto para evitar gargalos na organização (como conferência manual de comprovantes e perda de dados). Para resolver isso, desenvolvi uma aplicação Full-Stack serverless que gera o PIX dinâmico, aguarda o pagamento, libera o ingresso automaticamente e oferece um painel de controle blindado para a equipe organizadora.

### 📸 Screenshots
*(Coloque aqui imagens do seu projeto. Exemplo:)*
<p align="center">
  <img src="URL_DA_SUA_IMAGEM_TELA_INICIAL" width="45%" alt="Tela Inicial">
  <img src="URL_DA_SUA_IMAGEM_TICKET" width="45%" alt="Carteira de Tickets">
</p>

## ✨ Principais Funcionalidades

* **🛒 Checkout e Pagamento Automatizado:** Integração direta com a API do Mercado Pago. O sistema gera um QR Code e um "Copia e Cola" dinâmico.
* **⚡ Webhook em Tempo Real:** Uma Vercel Serverless Function "escuta" a resposta do banco e atualiza o status do ingresso automaticamente no Supabase.
* **🎫 Carteira Virtual Premium:** Após o pagamento, os ingressos são gerados com um design realista (estilo passaporte) e salvos localmente (`localStorage`), permitindo que o usuário feche o site e não perca seu ingresso.
* **🛡️ Painel Admin Blindado:** Rota oculta protegida por variáveis de ambiente (sem senhas expostas no front-end).
* **📊 Gestão de Participantes (CRM):** O painel permite aprovar ingressos manualmente, excluir participantes, chamar usuários no WhatsApp com um clique e exportar a lista final para Excel (CSV).
* **🎨 UI/UX Moderna:** Interface no estilo "Dark Mode" com feedbacks visuais, validação de formulários (CPF e Telefone) e animações fluidas.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando o que há de mais moderno no ecossistema JavaScript:

* **Front-end:** React 19, Vite, TypeScript, Tailwind CSS.
* **Animações & UI:** Framer Motion, Lucide React.
* **Back-end & Hospedagem:** Vercel Serverless Functions (Node.js).
* **Banco de Dados:** Supabase (PostgreSQL).
* **Integração Financeira:** Mercado Pago API (via Fetch).

## ⚙️ Arquitetura do Pagamento (Fluxo)
1. O usuário preenche o formulário. Os dados vão para o **Supabase** com status `pago: false`.
2. O front-end chama a API do **Mercado Pago** para gerar a cobrança (R$ 20 + taxas).
3. O usuário escaneia o PIX. Um loop (Polling) verifica o status da transação.
4. Quando pago, o **Webhook** (Serverless Function) recebe o aviso do Mercado Pago, autentica com a Chave Mestra e altera o status no Supabase para `pago: true`.
5. A tela do usuário exibe a **Carteira Virtual** e salva os dados na memória do dispositivo.

## 🚀 Como rodar o projeto localmente

```bash
# Clone este repositório
$ git clone [https://github.com/wevertonmoura/SEU_REPOSITORIO.git](https://github.com/wevertonmoura/SEU_REPOSITORIO.git)

# Acesse a pasta do projeto
$ cd SEU_REPOSITORIO

# Instale as dependências
$ npm install

# Crie um arquivo .env na raiz e adicione suas chaves:
VITE_SENHA_ADMIN=sua_senha_segura
SUPABASE_SERVICE_KEY=sua_chave_secreta_do_supabase
MP_ACCESS_TOKEN=seu_token_do_mercado_pago

# Execute a aplicação em modo de desenvolvimento
$ npm run dev
