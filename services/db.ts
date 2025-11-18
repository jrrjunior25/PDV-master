
import { Product, Sale, CartItem, PaymentMethod, User, FinancialRecord, AppSettings, Supplier, Carrier } from '../types';

const PRODUCTS_KEY = 'mercadomaster_products';
const SALES_KEY = 'mercadomaster_sales';
const USERS_KEY = 'mercadomaster_users';
const FINANCIAL_KEY = 'mercadomaster_financial';
const SETTINGS_KEY = 'mercadomaster_settings';
const SUPPLIERS_KEY = 'mercadomaster_suppliers';
const CARRIERS_KEY = 'mercadomaster_carriers';

// Dados Iniciais (Seed) - Lista Expandida
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: '7891000100103', name: 'Arroz Branco Tipo 1 5kg', price: 24.90, costPrice: 18.50, stock: 100, category: 'Alimentos', unit: 'UN', imageUrl: 'https://picsum.photos/id/1/200/200' },
  { id: '2', code: '7891000200200', name: 'Feijão Carioca 1kg', price: 8.50, costPrice: 5.20, stock: 150, category: 'Alimentos', unit: 'UN', imageUrl: 'https://picsum.photos/id/2/200/200' },
  { id: '3', code: '7894900010015', name: 'Refrigerante Cola 2L', price: 9.90, costPrice: 6.50, stock: 48, category: 'Bebidas', unit: 'UN', imageUrl: 'https://picsum.photos/id/3/200/200' },
  { id: '4', code: '7891000300300', name: 'Sabão em Pó 1kg', price: 14.50, costPrice: 10.00, stock: 30, category: 'Limpeza', unit: 'UN', imageUrl: 'https://picsum.photos/id/4/200/200' },
  { id: '5', code: '7892000400400', name: 'Leite Integral 1L', price: 5.29, costPrice: 3.80, stock: 60, category: 'Laticínios', unit: 'UN', imageUrl: 'https://picsum.photos/id/5/200/200' },
];

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', role: 'ADMIN', pin: '1234' },
  { id: '2', name: 'Operador Caixa', role: 'OPERADOR', pin: '0000' },
];

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Minha Loja Ltda',
  cnpj: '00.000.000/0001-91',
  address: 'Rua Exemplo, 123 - Centro',
  pixKey: '',
  pixKeyType: 'CNPJ',
  printerWidth: 80,
  certificateName: '',
  environment: 'HOMOLOGACAO'
};

// Helper para extrair texto de XML com segurança
const getTagValue = (element: Element, tagName: string): string => {
  const tags = element.getElementsByTagName(tagName);
  return tags.length > 0 ? tags[0].textContent || '' : '';
};

export const db = {
  init: () => {
    const storedProducts = localStorage.getItem(PRODUCTS_KEY);
    if (!storedProducts || JSON.parse(storedProducts).length === 0) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(SALES_KEY)) localStorage.setItem(SALES_KEY, JSON.stringify([]));
    if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    if (!localStorage.getItem(FINANCIAL_KEY)) localStorage.setItem(FINANCIAL_KEY, JSON.stringify([]));
    if (!localStorage.getItem(SETTINGS_KEY)) localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    if (!localStorage.getItem(SUPPLIERS_KEY)) localStorage.setItem(SUPPLIERS_KEY, JSON.stringify([]));
    if (!localStorage.getItem(CARRIERS_KEY)) localStorage.setItem(CARRIERS_KEY, JSON.stringify([]));
  },

  // --- PRODUTOS (CRUD) ---
  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getProductByCode: (code: string): Product | undefined => {
    const products = db.getProducts();
    const cleanCode = code.trim();
    return products.find(p => p.code === cleanCode);
  },

  saveProduct: (product: Product) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = db.getProducts().filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  // --- XML IMPORTATION LOGIC ---
  processXmlImport: (xmlContent: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const summary = {
      productsUpdated: 0,
      productsCreated: 0,
      supplierSaved: false,
      carrierSaved: false
    };

    // 1. Processar Fornecedor (Emitente)
    const emitTags = xmlDoc.getElementsByTagName('emit');
    if (emitTags.length > 0) {
      const emit = emitTags[0];
      const cnpj = getTagValue(emit, 'CNPJ');
      const suppliers = db.getSuppliers();
      
      const supplierData: Supplier = {
        id: cnpj, // Usa CNPJ como ID para evitar duplicatas
        cnpj: cnpj,
        name: getTagValue(emit, 'xNome'),
        tradeName: getTagValue(emit, 'xFant'),
        address: `${getTagValue(emit, 'xLgr')}, ${getTagValue(emit, 'nro')} - ${getTagValue(emit, 'xBairro')}`,
        city: getTagValue(emit, 'xMun'),
        phone: getTagValue(emit, 'fone'),
        ie: getTagValue(emit, 'IE')
      };

      const existingSupIndex = suppliers.findIndex(s => s.cnpj === cnpj);
      if (existingSupIndex >= 0) {
        suppliers[existingSupIndex] = supplierData;
      } else {
        suppliers.push(supplierData);
      }
      localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
      summary.supplierSaved = true;
    }

    // 2. Processar Transportadora
    const transpTags = xmlDoc.getElementsByTagName('transporta');
    if (transpTags.length > 0) {
      const transp = transpTags[0];
      const cnpj = getTagValue(transp, 'CNPJ');
      
      if (cnpj) {
        const carriers = db.getCarriers();
        const carrierData: Carrier = {
          id: cnpj,
          cnpj: cnpj,
          name: getTagValue(transp, 'xNome'),
          uf: getTagValue(transp, 'UF'),
        };
        
        // Veículo (Placa)
        const veicTags = xmlDoc.getElementsByTagName('veicTransp');
        if(veicTags.length > 0) {
            carrierData.plate = getTagValue(veicTags[0], 'placa');
        }

        const existingCarIndex = carriers.findIndex(c => c.cnpj === cnpj);
        if (existingCarIndex >= 0) {
          carriers[existingCarIndex] = carrierData;
        } else {
          carriers.push(carrierData);
        }
        localStorage.setItem(CARRIERS_KEY, JSON.stringify(carriers));
        summary.carrierSaved = true;
      }
    }

    // 3. Processar Produtos (Det)
    const detTags = xmlDoc.getElementsByTagName('det');
    const products = db.getProducts();

    for (let i = 0; i < detTags.length; i++) {
      const prodTag = detTags[i].getElementsByTagName('prod')[0];
      const impostoTag = detTags[i].getElementsByTagName('imposto')[0];

      // Identificação
      let code = getTagValue(prodTag, 'cEAN');
      if (!code || code === 'SEM GTIN') {
        code = getTagValue(prodTag, 'cProd'); // Usa código interno se não tiver EAN
      }

      const name = getTagValue(prodTag, 'xProd');
      const ncm = getTagValue(prodTag, 'NCM');
      const cfop = getTagValue(prodTag, 'CFOP');
      const cest = getTagValue(prodTag, 'CEST');
      
      // Valores e Quantidades do XML
      const quantity = parseFloat(getTagValue(prodTag, 'qCom'));
      const costPrice = parseFloat(getTagValue(prodTag, 'vUnCom')); // Valor unitário de comercialização (Custo)
      const unit = getTagValue(prodTag, 'uCom');

      // Cálculo sugerido de venda (Margem simples de 50% se for novo)
      const suggestedPrice = costPrice * 1.5;

      const existingProductIndex = products.findIndex(p => p.code === code);

      if (existingProductIndex >= 0) {
        // Atualiza existente (Entrada de Estoque)
        products[existingProductIndex].stock += quantity;
        products[existingProductIndex].costPrice = costPrice; // Atualiza custo
        products[existingProductIndex].ncm = ncm; // Atualiza fiscal se mudou
        products[existingProductIndex].cfop = cfop;
        summary.productsUpdated++;
      } else {
        // Cria Novo
        const newProduct: Product = {
          id: crypto.randomUUID(),
          code: code,
          name: name,
          price: suggestedPrice,
          costPrice: costPrice,
          stock: quantity,
          category: 'Importado XML', // Categoria padrão
          unit: unit.substring(0, 2).toUpperCase(), // UN, KG, LT
          ncm: ncm,
          cfop: cfop,
          cest: cest,
          imageUrl: 'https://via.placeholder.com/200?text=No+Image'
        };
        products.push(newProduct);
        summary.productsCreated++;
      }
    }

    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return summary;
  },

  getSuppliers: (): Supplier[] => {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getCarriers: (): Carrier[] => {
    const data = localStorage.getItem(CARRIERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // --- VENDAS (CORE) ---
  getSales: (): Sale[] => {
    const data = localStorage.getItem(SALES_KEY);
    return data ? JSON.parse(data) : [];
  },

  createSale: (items: CartItem[], paymentMethod: PaymentMethod): Sale => {
    const sales = db.getSales();
    const total = items.reduce((acc, item) => acc + item.total, 0);
    
    const fiscalCode = `35${new Date().getFullYear()}${Math.random().toString().slice(2, 16)}${Math.random().toString().slice(2, 16)}`;

    const newSale: Sale = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items,
      total,
      paymentMethod,
      status: 'COMPLETED',
      fiscalCode
    };

    sales.push(newSale);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));

    const products = db.getProducts();
    items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.id);
      if (productIndex >= 0) {
        products[productIndex].stock -= item.quantity;
      }
    });
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

    db.addFinancialRecord({
      id: crypto.randomUUID(),
      type: 'RECEITA',
      description: `Venda PDV #${fiscalCode.slice(-4)}`,
      amount: total,
      date: Date.now(),
      category: 'Vendas'
    });

    return newSale;
  },

  // --- USUÁRIOS (CRUD) ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (id: string) => {
    const users = db.getUsers().filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  // --- FINANCEIRO (CRUD) ---
  getFinancialRecords: (): FinancialRecord[] => {
    const data = localStorage.getItem(FINANCIAL_KEY);
    return data ? JSON.parse(data) : [];
  },

  addFinancialRecord: (record: FinancialRecord) => {
    const records = db.getFinancialRecords();
    records.push(record);
    localStorage.setItem(FINANCIAL_KEY, JSON.stringify(records));
  },
  
  deleteFinancialRecord: (id: string) => {
    const records = db.getFinancialRecords().filter(r => r.id !== id);
    localStorage.setItem(FINANCIAL_KEY, JSON.stringify(records));
  },

  // --- CONFIGURAÇÕES ---
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // --- BACKUP & DADOS ---
  createBackup: () => {
    const backupData = {
      products: db.getProducts(),
      sales: db.getSales(),
      users: db.getUsers(),
      financial: db.getFinancialRecords(),
      settings: db.getSettings(),
      suppliers: db.getSuppliers(),
      carriers: db.getCarriers(),
      version: '1.1',
      timestamp: Date.now()
    };
    return JSON.stringify(backupData, null, 2);
  },

  restoreBackup: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.version && !data.products) throw new Error("Arquivo inválido");

      if (data.products) localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data.products));
      if (data.sales) localStorage.setItem(SALES_KEY, JSON.stringify(data.sales));
      if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
      if (data.financial) localStorage.setItem(FINANCIAL_KEY, JSON.stringify(data.financial));
      if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      if (data.suppliers) localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(data.suppliers));
      if (data.carriers) localStorage.setItem(CARRIERS_KEY, JSON.stringify(data.carriers));
      return true;
    } catch (e) {
      console.error("Erro ao restaurar backup", e);
      return false;
    }
  }
};
