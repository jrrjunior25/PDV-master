import { AccountingAccount } from "../types";

export const DEFAULT_CHART_OF_ACCOUNTS: AccountingAccount[] = [
    // 1. ATIVO
    { id: '1', code: '1', name: 'Ativo', type: 'ASSET', parentId: null, systemAccount: true },
    { id: '1.1', code: '1.1', name: 'Ativo Circulante', type: 'ASSET', parentId: '1', systemAccount: true },
    { id: '1.1.1', code: '1.1.1', name: 'Caixa e Equivalentes', type: 'ASSET', parentId: '1.1', systemAccount: true },
    { id: 'AC_CAIXA', code: '1.1.1.01', name: 'Caixa Geral', type: 'ASSET', parentId: '1.1.1', systemAccount: true },
    { id: 'AC_BANCO', code: '1.1.1.02', name: 'Bancos Conta Movimento', type: 'ASSET', parentId: '1.1.1', systemAccount: true },
    { id: '1.1.2', code: '1.1.2', name: 'Clientes a Receber', type: 'ASSET', parentId: '1.1', systemAccount: true },
    { id: '1.1.3', code: '1.1.3', name: 'Estoques', type: 'ASSET', parentId: '1.1', systemAccount: true },
    { id: 'AC_ESTOQUE', code: '1.1.3.01', name: 'Mercadorias para Revenda', type: 'ASSET', parentId: '1.1.3', systemAccount: true },

    // 2. PASSIVO
    { id: '2', code: '2', name: 'Passivo', type: 'LIABILITY', parentId: null, systemAccount: true },
    { id: '2.1', code: '2.1', name: 'Passivo Circulante', type: 'LIABILITY', parentId: '2', systemAccount: true },
    { id: '2.1.1', code: '2.1.1', name: 'Fornecedores a Pagar', type: 'LIABILITY', parentId: '2.1', systemAccount: true },
    { id: 'AC_FORNECEDORES', code: '2.1.1.01', name: 'Fornecedores Nacionais', type: 'LIABILITY', parentId: '2.1.1', systemAccount: true },
    { id: '2.1.2', code: '2.1.2', name: 'Obrigações Trabalhistas', type: 'LIABILITY', parentId: '2.1', systemAccount: true },
    { id: '2.1.3', code: '2.1.3', name: 'Obrigações Tributárias', type: 'LIABILITY', parentId: '2.1', systemAccount: true },

    // 3. PATRIMÔNIO LÍQUIDO
    { id: '3', code: '3', name: 'Patrimônio Líquido', type: 'EQUITY', parentId: null, systemAccount: true },
    { id: '3.1', code: '3.1', name: 'Capital Social', type: 'EQUITY', parentId: '3', systemAccount: true },
    { id: 'AC_CAPITAL', code: '3.1.1.01', name: 'Capital Social Integralizado', type: 'EQUITY', parentId: '3.1', systemAccount: true },
    { id: '3.2', code: '3.2', name: 'Reservas de Lucros', type: 'EQUITY', parentId: '3', systemAccount: true },
    { id: 'AC_LUCROS', code: '3.2.1.01', name: 'Lucros ou Prejuízos Acumulados', type: 'EQUITY', parentId: '3.2', systemAccount: true },

    // 4. RECEITAS
    { id: '4', code: '4', name: 'Receitas', type: 'REVENUE', parentId: null, systemAccount: true },
    { id: '4.1', code: '4.1', name: 'Receita Operacional Bruta', type: 'REVENUE', parentId: '4', systemAccount: true },
    { id: 'AC_REC_VENDAS', code: '4.1.1.01', name: 'Venda de Mercadorias', type: 'REVENUE', parentId: '4.1', systemAccount: true },
    { id: 'AC_REC_SERVICOS', code: '4.1.1.02', name: 'Prestação de Serviços', type: 'REVENUE', parentId: '4.1', systemAccount: true },

    // 5. CUSTOS E DESPESAS
    { id: '5', code: '5', name: 'Custos e Despesas', type: 'EXPENSE', parentId: null, systemAccount: true },
    { id: '5.1', code: '5.1', name: 'Custos das Vendas', type: 'EXPENSE', parentId: '5', systemAccount: true },
    { id: 'AC_CMV', code: '5.1.1.01', name: 'CMV - Custo das Mercadorias Vendidas', type: 'EXPENSE', parentId: '5.1', systemAccount: true },
    { id: '5.2', code: '5.2', name: 'Despesas Operacionais', type: 'EXPENSE', parentId: '5', systemAccount: true },
    { id: 'AC_DESP_ADM', code: '5.2.1.01', name: 'Despesas Administrativas', type: 'EXPENSE', parentId: '5.2', systemAccount: true },
    { id: 'AC_DESP_PESSOAL', code: '5.2.1.02', name: 'Salários e Ordenados', type: 'EXPENSE', parentId: '5.2', systemAccount: true },
    { id: 'AC_DESP_FIN', code: '5.2.1.03', name: 'Despesas Financeiras', type: 'EXPENSE', parentId: '5.2', systemAccount: true },
    { id: 'AC_DESP_TRIB', code: '5.2.1.04', name: 'Impostos e Taxas', type: 'EXPENSE', parentId: '5.2', systemAccount: true },
];
