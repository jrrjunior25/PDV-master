# MercadoMaster ERP & PDV - Guia para Agentes

Este arquivo contém instruções, contexto e convenções sobre o projeto para auxiliar agentes de IA e desenvolvedores a manterem a consistência e qualidade do código.

## 1. Visão Geral
O **MercadoMaster** é um sistema de ERP e PDV (Frente de Caixa) projetado para rodar inteiramente no navegador (Client-Side / Serverless notion), utilizando **React**, **TypeScript**, **Vite** e **AlaSQL** para gerenciamento de dados local.

## 2. Estrutura de Diretórios
A estrutura do projeto foi organizada para separar claramente a camada de apresentação da camada de infraestrutura/dados. **Respeite esta estrutura ao criar novos arquivos.**

*   **`ui/`**: Contém todo o código de interface do usuário (Frontend).
    *   `ui/pages/`: Páginas da aplicação (ex: `POS.tsx`, `Dashboard.tsx`, `Products.tsx`).
    *   `ui/components/`: Componentes reutilizáveis (ex: `Layout.tsx`).
    *   `ui/App.tsx`: **Componente raiz da aplicação**. Contém o roteamento principal.
*   **`infra/`**: Camada de infraestrutura, dados e serviços externos.
    *   `infra/db.ts`: Abstração do banco de dados local (AlaSQL) e persistência (LocalStorage). Centraliza a lógica de negócio (ex: `createSale`, `saveProduct`).
    *   `infra/services/`: Integrações externas (NFC-e, PIX, Gemini AI).
*   **`core/`**: Definições de tipos globais e interfaces.
    *   `core/types.ts`: Interfaces compartilhadas (ex: `Product`, `Sale`, `Client`).
*   **`verification/`**: Scripts de teste automatizado (Playwright) para validação de funcionalidades críticas.
*   **Raiz**: Contém configurações (`vite.config.ts`, `tsconfig.json`) e o ponto de entrada `index.tsx`.
    *   **Nota**: Não crie componentes como `App.tsx` na raiz. Eles devem residir em `ui/`.

## 3. Stack Tecnológico
*   **Frontend**: React 19, TypeScript, Tailwind CSS.
*   **Build**: Vite.
*   **Banco de Dados**: AlaSQL (SQL em memória) + LocalStorage (Persistência).
*   **Ícones**: Lucide React.
*   **Testes/Verificação**: Playwright (Python/Node).

## 4. Detalhes de Implementação
*   **Banco de Dados (AlaSQL)**:
    *   O banco é reiniciado a partir do `localStorage` (`mercadomaster_sql_dump_v1`) na inicialização.
    *   Tabelas principais: `products`, `sales`, `users`, `clients`, `stock_movements`.
*   **Kardex (Histórico)**:
    *   Movimentações de estoque são registradas na tabela `stock_movements`.
    *   **Importante**: Na UI, os tipos de movimentação (SALE, ENTRY_XML, LOSS, etc.) devem ser traduzidos para o Português (VENDA, ENTRADA XML, PERDA/QUEBRA).
*   **NFC-e (Nota Fiscal)**:
    *   O serviço `nfcService.ts` implementa a construção real do XML e envelope SOAP para a SEFAZ (SVRS).
    *   **Limitação**: O envio direto pelo navegador é bloqueado por CORS e falta de acesso ao certificado digital local. Em produção, requer um Proxy/Backend local.
*   **PIX**:
    *   O serviço `pixService.ts` gera códigos BRCode Estáticos (padrão EMV QRCPS-MPM) com cálculo correto de CRC16.
    *   A verificação de status (`checkPaymentStatus`) simula uma chamada a um PSP e requer backend para funcionar em produção.

## 5. Fluxo de Trabalho e Verificação
Ao realizar alterações, siga este fluxo:

1.  **Compilação**: Sempre verifique se não há erros de tipo.
    ```bash
    npx tsc --noEmit
    ```
2.  **Verificação Visual/Funcional**:
    *   Para alterações no PDV ou fluxos críticos (Login, Cadastro), use os scripts em `verification/` ou crie novos.
    *   Exemplo: `python verification/verify_pos_modal.py`
3.  **Pre-commit**: Certifique-se de que `npm run build` completa com sucesso.

## 6. Convenções
*   **Idioma**: Interface, comentários de usuário e logs visíveis devem ser em **Português do Brasil**.
*   **Código**: Use Inglês para nomes de variáveis e funções internas, mas mantenha os termos de domínio consistentes.
*   **Estilo**: Utilize classes utilitárias do Tailwind. Evite CSS puro quando possível.

---
*Este arquivo deve ser atualizado conforme a arquitetura do projeto evolui.*
