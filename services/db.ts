
import { Product, Sale, CartItem, PaymentMethod, User, FinancialRecord, AppSettings, Supplier, Carrier, ImportPreviewData, ImportItem } from '../types';
import { NfcService } from './nfcService';

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
  certificateData: '',
  environment: 'HOMOLOGACAO',
  nfcSeries: 1,
  nextNfcNumber: 1,
  cscToken: '',
  cscId: ''
};

// Helper para extrair texto de XML com segurança
const getTagValue = (element: Element, tagName: string): string => {
  const tags = element.getElementsByTagName(tagName);
  return tags.length > 0 ? tags[0].textContent || '' : '';
};

const nfcService = new NfcService();

export const db = {
  init: () => {
    // Correção Crítica: Verifica se a chave é NULL (inexistente) ao invés de verificar se está vazia.
    if (localStorage.getItem(PRODUCTS_KEY) === null) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (localStorage.getItem(SALES_KEY) === null) localStorage.setItem(SALES_KEY, JSON.stringify([]));
    if (localStorage.getItem(USERS_KEY) === null) localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    if (localStorage.getItem(FINANCIAL_KEY) === null) localStorage.setItem(FINANCIAL_KEY, JSON.stringify([]));
    
    if (localStorage.getItem(SETTINGS_KEY) === null) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
    
    if (localStorage.getItem(SUPPLIERS_KEY) === null) localStorage.setItem(SUPPLIERS_KEY, JSON.stringify([]));
    if (localStorage.getItem(CARRIERS_KEY) === null) localStorage.setItem(CARRIERS_KEY, JSON.stringify([]));
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

  // --- EXCEL IMPORT/EXPORT LOGIC ---

  downloadExcelTemplate: () => {
    const XLSX = window.XLSX;
    if (!XLSX) return alert("Erro: Biblioteca Excel não carregada.");

    const headers = [
      "CODIGO_BARRAS*", 
      "NOME_PRODUTO*", 
      "PRECO_VENDA", 
      "PRECO_CUSTO", 
      "ESTOQUE", 
      "UNIDADE", 
      "CATEGORIA", 
      "NCM", 
      "CFOP", 
      "CEST"
    ];
    
    const exampleRow = [
      "7891234567890", 
      "Produto Exemplo 1KG", 
      10.50, 
      5.00, 
      100, 
      "UN", 
      "Alimentos", 
      "12345678", 
      "5102", 
      "1234567"
    ];

    const wsData = [headers, exampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação");
    XLSX.writeFile(wb, "Modelo_Importacao_Produtos.xlsx");
  },

  exportProductsToExcel: () => {
    const XLSX = window.XLSX;
    if (!XLSX) return alert("Erro: Biblioteca Excel não carregada.");

    const products = db.getProducts();
    const exportData = products.map(p => ({
      "CODIGO_BARRAS*": p.code,
      "NOME_PRODUTO*": p.name,
      "PRECO_VENDA": p.price,
      "PRECO_CUSTO": p.costPrice,
      "ESTOQUE": p.stock,
      "UNIDADE": p.unit,
      "CATEGORIA": p.category,
      "NCM": p.ncm || '',
      "CFOP": p.cfop || '',
      "CEST": p.cest || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, `Estoque_MercadoMaster_${new Date().toISOString().slice(0,10)}.xlsx`);
  },

  importProductsFromExcel: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const XLSX = window.XLSX;
      if (!XLSX) return reject("Biblioteca Excel indisponível.");

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          if (jsonData.length === 0) return reject("Planilha vazia.");

          const products = db.getProducts();
          let created = 0;
          let updated = 0;

          jsonData.forEach((row: any) => {
            const code = (row["CODIGO_BARRAS*"] || row["CODIGO"] || row["CODE"])?.toString();
            const name = row["NOME_PRODUTO*"] || row["NOME"] || row["NAME"];

            if (!code || !name) return; // Skip invalid rows

            const existingIdx = products.findIndex(p => p.code === code);
            
            const productData: Product = {
              id: existingIdx >= 0 ? products[existingIdx].id : crypto.randomUUID(),
              code: code,
              name: name,
              price: Number(row["PRECO_VENDA"] || row["PRICE"] || 0),
              costPrice: Number(row["PRECO_CUSTO"] || row["COST"] || 0),
              stock: Number(row["ESTOQUE"] || row["STOCK"] || 0),
              unit: row["UNIDADE"] || row["UNIT"] || 'UN',
              category: row["CATEGORIA"] || row["CATEGORY"] || 'Geral',
              ncm: row["NCM"] ? String(row["NCM"]) : undefined,
              cfop: row["CFOP"] ? String(row["CFOP"]) : undefined,
              cest: row["CEST"] ? String(row["CEST"]) : undefined,
              imageUrl: existingIdx >= 0 ? products[existingIdx].imageUrl : 'https://via.placeholder.com/200?text=No+Image'
            };

            if (existingIdx >= 0) {
              if(row["ESTOQUE"] === undefined) productData.stock = products[existingIdx].stock;
              products[existingIdx] = productData;
              updated++;
            } else {
              products.push(productData);
              created++;
            }
          });

          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
          resolve(`Importação Concluída!\n${created} produtos criados.\n${updated} produtos atualizados.`);
        } catch (err) {
          console.error(err);
          reject("Erro ao processar arquivo Excel.");
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // --- XML IMPORTATION LOGIC ---
  
  parseNFe: (xmlContent: string): ImportPreviewData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    let supplier: Supplier | null = null;
    let carrier: Carrier | null = null;
    const items: ImportItem[] = [];
    
    // Financeiro
    let vNF = 0;
    const totalTags = xmlDoc.getElementsByTagName('ICMSTot');
    if (totalTags.length > 0) {
      const vNFStr = getTagValue(totalTags[0], 'vNF');
      vNF = vNFStr ? parseFloat(vNFStr) : 0;
    }

    // 1. Processar Fornecedor (Emitente)
    const emitTags = xmlDoc.getElementsByTagName('emit');
    if (emitTags.length > 0) {
      const emit = emitTags[0];
      const cnpj = getTagValue(emit, 'CNPJ');
      supplier = {
        id: cnpj,
        cnpj: cnpj,
        name: getTagValue(emit, 'xNome'),
        tradeName: getTagValue(emit, 'xFant'),
        address: `${getTagValue(emit, 'xLgr')}, ${getTagValue(emit, 'nro')} - ${getTagValue(emit, 'xBairro')}`,
        city: getTagValue(emit, 'xMun'),
        phone: getTagValue(emit, 'fone'),
        ie: getTagValue(emit, 'IE')
      };
    }

    // 2. Processar Transportadora
    const transpTags = xmlDoc.getElementsByTagName('transporta');
    if (transpTags.length > 0) {
      const transp = transpTags[0];
      const cnpj = getTagValue(transp, 'CNPJ');
      if (cnpj) {
        carrier = {
          id: cnpj,
          cnpj: cnpj,
          name: getTagValue(transp, 'xNome'),
          uf: getTagValue(transp, 'UF'),
        };
        const veicTags = xmlDoc.getElementsByTagName('veicTransp');
        if(veicTags.length > 0) {
            carrier.plate = getTagValue(veicTags[0], 'placa');
        }
      }
    }

    // 3. Processar Produtos (Det)
    const detTags = xmlDoc.getElementsByTagName('det');
    const currentProducts = db.getProducts();

    for (let i = 0; i < detTags.length; i++) {
      const prodTag = detTags[i].getElementsByTagName('prod')[0];
      
      let code = getTagValue(prodTag, 'cEAN');
      if (!code || code === 'SEM GTIN') {
        code = getTagValue(prodTag, 'cProd');
      }

      const quantity = parseFloat(getTagValue(prodTag, 'qCom'));
      const costPrice = parseFloat(getTagValue(prodTag, 'vUnCom'));
      
      const exists = currentProducts.some(p => p.code === code);

      items.push({
        code,
        name: getTagValue(prodTag, 'xProd'),
        quantity,
        costPrice,
        unit: getTagValue(prodTag, 'uCom'),
        ncm: getTagValue(prodTag, 'NCM'),
        cfop: getTagValue(prodTag, 'CFOP'),
        cest: getTagValue(prodTag, 'CEST'),
        isNew: !exists
      });
    }
    
    const today = new Date();
    today.setDate(today.getDate() + 30);

    return { 
      supplier, 
      carrier, 
      items,
      finance: {
        totalValue: vNF,
        installments: 1,
        paymentMethod: 'BOLETO',
        firstDueDate: today.toISOString().split('T')[0]
      }
    };
  },

  commitImport: (data: ImportPreviewData) => {
    const products = db.getProducts();
    const suppliers = db.getSuppliers();
    const carriers = db.getCarriers();
    const financialRecords = db.getFinancialRecords();
    
    const summary = {
      productsCreated: 0,
      productsUpdated: 0,
      financeRecordsCreated: 0
    };

    if (data.supplier) {
      const idx = suppliers.findIndex(s => s.cnpj === data.supplier!.cnpj);
      if (idx >= 0) suppliers[idx] = data.supplier;
      else suppliers.push(data.supplier);
      localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
    }

    if (data.carrier) {
      const idx = carriers.findIndex(c => c.cnpj === data.carrier!.cnpj);
      if (idx >= 0) carriers[idx] = data.carrier;
      else carriers.push(data.carrier);
      localStorage.setItem(CARRIERS_KEY, JSON.stringify(carriers));
    }

    data.items.forEach(item => {
      const index = products.findIndex(p => p.code === item.code);

      if (index >= 0) {
        products[index].stock += item.quantity;
        products[index].costPrice = item.costPrice;
        products[index].ncm = item.ncm;
        products[index].cfop = item.cfop;
        summary.productsUpdated++;
      } else {
        const newProduct: Product = {
          id: crypto.randomUUID(),
          code: item.code,
          name: item.name,
          price: item.costPrice * 1.5, 
          costPrice: item.costPrice,
          stock: item.quantity,
          category: 'Importado XML',
          unit: item.unit.substring(0, 2).toUpperCase(),
          ncm: item.ncm,
          cfop: item.cfop,
          cest: item.cest,
          imageUrl: 'https://via.placeholder.com/200?text=No+Image'
        };
        products.push(newProduct);
        summary.productsCreated++;
      }
    });
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

    if (data.finance.totalValue > 0) {
      const totalVal = Number(data.finance.totalValue);
      const numInstallments = Math.max(1, Number(data.finance.installments));
      
      const installmentValue = totalVal / numInstallments;
      const baseDate = new Date(data.finance.firstDueDate);
      baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        financialRecords.push({
          id: crypto.randomUUID(),
          type: 'DESPESA',
          description: `Compra NFe - ${data.supplier?.name || 'Fornecedor'} (Parc ${i + 1}/${numInstallments})`,
          amount: Number(installmentValue.toFixed(2)), 
          date: dueDate.getTime(),
          category: 'Fornecedores'
        });
        summary.financeRecordsCreated++;
      }
      localStorage.setItem(FINANCIAL_KEY, JSON.stringify(financialRecords));
    }

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

  createSale: async (items: CartItem[], paymentMethod: PaymentMethod): Promise<Sale> => {
    const sales = db.getSales();
    const total = items.reduce((acc, item) => acc + item.total, 0);
    
    // 1. Carregar Configurações para Emissão
    const settings = db.getSettings();
    const nNF = settings.nextNfcNumber || 1;
    
    // 2. Gerar NFC-e (Dados e XML)
    const accessKey = nfcService.generateAccessKey(settings, nNF);
    const xml = nfcService.generateXML(settings, items, nNF, total, paymentMethod, accessKey);
    
    // 3. Simular Transmissão
    const transmission = await nfcService.transmitNFCe(xml, settings);

    // 4. Criar Objeto de Venda
    const newSale: Sale = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items,
      total,
      paymentMethod,
      status: 'COMPLETED',
      fiscalCode: accessKey,
      xmlContent: xml,
      protocol: transmission.protocol,
      environment: settings.environment
    };

    // 5. Salvar Venda
    sales.push(newSale);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));

    // 6. Atualizar Estoque
    const products = db.getProducts();
    items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.id);
      if (productIndex >= 0) {
        products[productIndex].stock -= item.quantity;
      }
    });
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

    // 7. Lançar Financeiro
    db.addFinancialRecord({
      id: crypto.randomUUID(),
      type: 'RECEITA',
      description: `Venda PDV #${nNF} (NFC-e)`,
      amount: total,
      date: Date.now(),
      category: 'Vendas'
    });

    // 8. Incrementar Número da Nota e Salvar
    settings.nextNfcNumber = nNF + 1;
    db.saveSettings(settings);

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
      // Faz o merge garantindo que novos campos do DEFAULT entrem se não existirem no salvo
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
      version: '2.0',
      timestamp: Date.now()
    };
    return JSON.stringify(backupData, null, 2);
  },

  restoreBackup: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.products) throw new Error("Arquivo inválido");

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
