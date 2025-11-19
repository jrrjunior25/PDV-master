
declare global {
  interface Window {
    XLSX: any;
    alasql: any;
    JsBarcode: any;
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
  pin: string;
}

export interface Client {
  id: string;
  name: string;
  cpf: string;
  phone?: string;
  points: number;
  lastPurchase?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
  unit: string;
  imageUrl?: string;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  ncm?: string;
  cfop?: string;
  cest?: string;
  taxRate?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ENTRY_XML' | 'SALE' | 'MANUAL_ADJUST' | 'LOSS' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  costPrice: number;
  timestamp: number;
  description?: string;
  userId?: string;
}

export interface Supplier {
  id: string;
  cnpj: string;
  name: string;
  tradeName?: string;
  address?: string;
  city?: string;
  phone?: string;
  ie?: string;
}

export interface Carrier {
  id: string;
  cnpj: string;
  name: string;
  plate?: string;
  uf?: string;
}

export interface CartItem extends Product {
  quantity: number;
  total: number;
  appliedPrice: number;
  isWholesale?: boolean;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING';
  fiscalCode?: string; 
  xmlContent?: string; 
  protocol?: string; 
  environment?: 'HOMOLOGACAO' | 'PRODUCAO';
  clientId?: string;
  clientName?: string;
  clientCpf?: string;
  pointsEarned: number;
  pointsRedeemed: number;
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
  certificateName: string; 
  certificateData: string;
  environment: 'HOMOLOGACAO' | 'PRODUCAO';
  nfcSeries: number;
  nextNfcNumber: number;
  cscToken: string;
  cscId: string;
}

export interface CashMovement {
    id: string;
    type: 'SANGRIA' | 'SUPRIMENTO';
    amount: number;
    description: string;
    timestamp: number;
    userId: string;
}

export interface CashSession {
    id: string;
    userId: string;
    openedAt: number;
    closedAt?: number;
    openingBalance: number;
    closingBalance?: number;
    systemBalance?: number;
    status: 'OPEN' | 'CLOSED';
    movements: CashMovement[];
}

export interface ImportItem {
  code: string;
  name: string;
  quantity: number;
  costPrice: number;
  unit: string;
  ncm: string;
  cfop: string;
  cest: string;
  isNew: boolean;
}

export interface ImportFinanceData {
  totalValue: number;
  installments: number;
  paymentMethod: string;
  firstDueDate: string;
}

export interface ImportPreviewData {
  supplier: Supplier | null;
  carrier: Carrier | null;
  items: ImportItem[];
  finance: ImportFinanceData;
}