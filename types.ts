
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
  fiscalCode?: string; // Simulação chave NFC-e
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
  certificateName: string; // Apenas referência do arquivo
  environment: 'HOMOLOGACAO' | 'PRODUCAO';
}
