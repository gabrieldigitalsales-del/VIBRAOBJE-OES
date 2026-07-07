# Vibra Soluções — Árvore Interativa de Objeções

Aplicação React + Vite para conduzir atendimentos comerciais com revelação progressiva de conteúdo após cada clique.

## O que já está pronto

- Escolha de objeções por categoria.
- Perguntas e ramificações reveladas conforme a resposta do cliente.
- Resposta sugerida para o vendedor.
- Próxima ação recomendada.
- Botões Voltar, Reiniciar e Histórico.
- Nome do cliente, objetivo/produto e anotações.
- Cópia da resposta sugerida.
- Exportação do resumo do atendimento em TXT.
- Salvamento automático no navegador com `localStorage`.
- Modo tela cheia.
- Layout responsivo para computador, tablet e celular.
- Logo oficial da Vibra Soluções incluída em `public/vibra-logo.png`.

## Executar localmente

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal, normalmente `http://localhost:5173`.

## Gerar versão de produção

```bash
npm run build
```

Os arquivos finais serão criados na pasta `dist`.

## Personalizar os fluxos

Edite `src/data/objections.js`. Cada opção pode conter:

- `label`: botão exibido ao vendedor;
- `response`: fala sugerida após o clique;
- `action`: próxima ação comercial;
- `next`: ID do próximo gatilho, ou `null` para encerrar o caminho.

## Observação comercial

O sistema é um material de apoio. Ele não deve ser usado para prometer contemplação, prazo ou resultado. As falas devem permanecer transparentes e compatíveis com as regras do produto e da administradora.
