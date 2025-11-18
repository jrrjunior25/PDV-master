
declare global {
  interface Window {
    XLSX: any;
  }
}

export enum PaymentMethod {
  DINHEIRO = 'DINHEIRO',
  CREDITO = 'CREDITO',
  DEBITO = 'DEBITO',
  PIX = 'PIX',
}

export type UserRole = 'ADMIN' | 'OPERADOR';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // Senha numérica para o PDV
}

export interface Product {
  id: string;
  code: string; // EAN ou Interno
  name: string;
  price: number;
  costPrice: number; // Custo para cálculo de lucro
  stock: number;
  category: string;
  unit: string; // UN, KG, LT
  imageUrl?: string;
  // Dados Fiscais
  ncm?: string;
  cfop?: string;
  cest?: string;
  taxRate?: number; // Alíquota aproximada
}

export interface Supplier {
  id: string;
  cnpj: string;
  name: string; // xNome
  tradeName?: string; // xFant
  address?: string;
  city?: string;
  phone?: string;
  ie?: string;
}

export interface Carrier {
  id: string;
  cnpj: string;
  name: string;
  plate?: string; // Placa veículo
  uf?: string;
}

export interface CartItem extends Product {
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING';
  fiscalCode?: string; // Chave de Acesso 44 digitos
  xmlContent?: string; // Conteúdo do XML assinado
  protocol?: string; // Protocolo de Autorização SEFAZ
  environment?: 'HOMOLOGACAO' | 'PRODUCAO';
}

export interface FinancialRecord {
  id: string;
  type: 'RECEITA' | 'DESPESA';
  description: string;
  amount: number;
  date: number;
  category: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  topProduct: string;
  lowStockCount: number;
}

export interface AppSettings {
  companyName: string;
  cnpj: string;
  address: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  printerWidth: 58 | 80;
  
  // Configurações Fiscais e Certificado
  certificateName: string; 
  certificateData: string; // Base64 pfx
  environment: 'HOMOLOGACAO' | 'PRODUCAO';
  
  // Dados NFC-e
  nfcSeries: number; // Série da Nota (Ex: 1)
  nextNfcNumber: number; // Próximo número (Ex: 1050)
  cscToken: string; // Código de Segurança do Contribuinte (AlphaNumérico)
  cscId: string; // Identificador do CSC (Ex: 000001)
}

// Interfaces para Importação XML
export interface ImportItem {
  code: string;
  name: string;
  quantity: number;
  costPrice: number;
  unit: string;
  ncm: string;
  cfop: string;
  cest: string;
  isNew: boolean; // Se é um produto novo ou atualização
}

export interface ImportFinanceData {
  totalValue: number;
  installments: number;
  paymentMethod: string; // 'BOLETO' | 'PIX' | 'DINHEIRO' | 'OUTRO'
  firstDueDate: string; // YYYY-MM-DD
}

export interface ImportPreviewData {
  supplier: Supplier | null;
  carrier: Carrier | null;
  items: ImportItem[];
  finance: ImportFinanceData;
}
