import { Product, Sale, CartItem, PaymentMethod, User, FinancialRecord, AppSettings, Supplier, Carrier, ImportPreviewData, ImportItem, CashSession, CashMovement, Client, StockMovement } from '../../core/types';
import { NfcService } from './services/nfcService';

const DB_KEY = 'mercadomaster_sql_dump_v1';
const SESSION_KEY = 'mercadomaster_session';

// Dados Iniciais
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: '7891000100103', name: 'Arroz Branco Tipo 1 5kg', price: 24.90, wholesalePrice: 22.90, wholesaleMinQuantity: 6, costPrice: 18.50, stock: 100, category: 'Alimentos', unit: 'UN', imageUrl: 'https://picsum.photos/id/1/200/200' },
  { id: '2', code: '7891000200200', name: 'Feijão Carioca 1kg', price: 8.50, costPrice: 5.20, stock: 150, category: 'Alimentos', unit: 'UN', imageUrl: 'https://picsum.photos/id/2/200/200' },
  { id: '3', code: '7894900010015', name: 'Refrigerante Cola 2L', price: 9.90, wholesalePrice: 8.50, wholesaleMinQuantity: 12, costPrice: 6.50, stock: 48, category: 'Bebidas', unit: 'UN', imageUrl: 'https://picsum.photos/id/3/200/200' },
  { id: '4', code: '7891000300300', name: 'Sabão em Pó 1kg', price: 14.50, costPrice: 10.00, stock: 30, category: 'Limpeza', unit: 'UN', imageUrl: 'https://picsum.photos/id/4/200/200' },
  { id: '5', code: '7892000400400', name: 'Leite Integral 1L', price: 5.29, wholesalePrice: 4.99, wholesaleMinQuantity: 12, costPrice: 3.80, stock: 60, category: 'Laticínios', unit: 'UN', imageUrl: 'https://picsum.photos/id/5/200/200' },
];

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', role: 'ADMIN', pin: '1234' },
  { id: '2', name: 'Operador Caixa', role: 'OPERADOR', pin: '0000' },
];

const INITIAL_CLIENTS: Client[] = [
    { id: 'default', name: 'Consumidor Final', cpf: '', points: 0 }
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
  cscId: '',
  logoData: ''
};

const getTagValue = (element: Element | null | undefined, tagName: string): string => {
  if (!element) return '';
  const tags = element.getElementsByTagName(tagName);
  return (tags.length > 0 && tags[0].textContent) ? tags[0].textContent : '';
};

const nfcService = new NfcService();
let isInitialized = false;

const TABLE_LIST = [
    'products', 'sales', 'users', 'clients', 'financial', 
    'suppliers', 'carriers', 'settings', 'cash_sessions', 'stock_movements'
];

const runSql = (sql: string, params?: any[]) => {
    if (!window.alasql) { 
        console.warn("AlaSQL not loaded yet. Query skipped:", sql); 
        return []; 
    }
    try {
        return window.alasql(sql, params);
    } catch (e) {
        console.error("SQL Error:", e, sql);
        return [];
    }
};

const saveDb = () => {
    if (!window.alasql || !isInitialized) return;
    const dump: Record<string, any[]> = {};
    try {
        TABLE_LIST.forEach(tableName => {
            try {
                 const res = window.alasql(`SELECT * FROM ${tableName}`);
                 dump[tableName] = res;
            } catch (e) {}
        });
        localStorage.setItem(DB_KEY, JSON.stringify(dump));
    } catch(e) {
        console.error("Error saving DB", e);
    }
};

export const db = {
  init: async () => {
    if (isInitialized) return;
    
    let retries = 0;
    while (!window.alasql && retries < 30) { 
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    if (!window.alasql) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/alasql/4.0.0/alasql.min.js";
        script.async = false;
        document.head.appendChild(script);
        let retriesFallback = 0;
        while (!window.alasql && retriesFallback < 50) { 
             await new Promise(resolve => setTimeout(resolve, 100));
             retriesFallback++;
        }
    }

    if (!window.XLSX) {
        const scriptXlsx = document.createElement('script');
        scriptXlsx.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        scriptXlsx.async = false;
        document.head.appendChild(scriptXlsx);
    }

    if (!window.alasql) {
        console.error("CRITICAL ERROR: AlaSQL failed to load.");
        throw new Error("Falha crítica: O motor de banco de dados (AlaSQL) não pôde ser carregado."); 
    }

    try {
        runSql(`CREATE TABLE IF NOT EXISTS products (id STRING PRIMARY KEY, code STRING, name STRING, price NUMBER, costPrice NUMBER, stock NUMBER, category STRING, unit STRING, imageUrl STRING, wholesalePrice NUMBER, wholesaleMinQuantity NUMBER, ncm STRING, cfop STRING, cest STRING, taxRate NUMBER)`);
        runSql(`CREATE TABLE IF NOT EXISTS sales (id STRING PRIMARY KEY, timestamp NUMBER, [total] NUMBER, subtotal NUMBER, discount NUMBER, paymentMethod STRING, status STRING, fiscalCode STRING, xmlContent STRING, protocol STRING, environment STRING, clientId STRING, clientName STRING, clientCpf STRING, pointsEarned NUMBER, pointsRedeemed NUMBER, items JSON)`);
        runSql(`CREATE TABLE IF NOT EXISTS users (id STRING PRIMARY KEY, name STRING, role STRING, pin STRING)`);
        runSql(`CREATE TABLE IF NOT EXISTS clients (id STRING PRIMARY KEY, name STRING, cpf STRING, phone STRING, points NUMBER, lastPurchase NUMBER)`);
        runSql(`CREATE TABLE IF NOT EXISTS financial (id STRING PRIMARY KEY, type STRING, description STRING, amount NUMBER, date NUMBER, category STRING)`);
        runSql(`CREATE TABLE IF NOT EXISTS suppliers (id STRING PRIMARY KEY, cnpj STRING, name STRING, tradeName STRING, address STRING, city STRING, phone STRING, ie STRING)`);
        runSql(`CREATE TABLE IF NOT EXISTS carriers (id STRING PRIMARY KEY, cnpj STRING, name STRING, plate STRING, uf STRING)`);
        runSql(`CREATE TABLE IF NOT EXISTS settings (id STRING PRIMARY KEY, data JSON)`);
        runSql(`CREATE TABLE IF NOT EXISTS cash_sessions (id STRING PRIMARY KEY, userId STRING, openedAt NUMBER, closedAt NUMBER, openingBalance NUMBER, closingBalance NUMBER, systemBalance NUMBER, status STRING, movements JSON)`);
        runSql(`CREATE TABLE IF NOT EXISTS stock_movements (id STRING PRIMARY KEY, productId STRING, productName STRING, type STRING, quantity NUMBER, previousStock NUMBER, newStock NUMBER, costPrice NUMBER, timestamp NUMBER, description STRING, userId STRING)`);
    } catch(e) {}

    const savedData = localStorage.getItem(DB_KEY);
    if (savedData) {
        try {
            const tables = JSON.parse(savedData);
            Object.keys(tables).forEach(tableName => {
                if (tables[tableName] && tables[tableName].length > 0) {
                    try {
                        runSql(`DELETE FROM ${tableName}`);
                        tables[tableName].forEach((row: any) => {
                            runSql(`INSERT INTO ${tableName} VALUES ?`, [row]);
                        });
                    } catch (err) {}
                }
            });
        } catch (e) {}
    }

    try {
        const prodCount = runSql("SELECT COUNT(*) as c FROM products")[0]?.c || 0;
        if (prodCount === 0) INITIAL_PRODUCTS.forEach(p => runSql("INSERT INTO products VALUES ?", [p]));
        
        const userCount = runSql("SELECT COUNT(*) as c FROM users")[0]?.c || 0;
        if (userCount === 0) INITIAL_USERS.forEach(u => runSql("INSERT INTO users VALUES ?", [u]));
        
        const clientCount = runSql("SELECT COUNT(*) as c FROM clients")[0]?.c || 0;
        if (clientCount === 0) INITIAL_CLIENTS.forEach(c => runSql("INSERT INTO clients VALUES ?", [c]));
        
        const settingsCount = runSql("SELECT COUNT(*) as c FROM settings")[0]?.c || 0;
        if (settingsCount === 0) runSql("INSERT INTO settings VALUES ?", [{id: 'main', data: DEFAULT_SETTINGS}]);
    } catch(e) {}

    isInitialized = true;
    saveDb();
  },

  getProducts: (): Product[] => runSql("SELECT * FROM products"),
  
  getProductByCode: (code: string): Product | undefined => {
    const res = runSql("SELECT * FROM products WHERE code = ?", [code]);
    return res.length > 0 ? res[0] : undefined;
  },

  saveProduct: (product: Product) => {
      const exists = runSql("SELECT * FROM products WHERE id = ?", [product.id]);
      if (exists.length > 0) {
          const oldProduct = exists[0];
          if (oldProduct.stock !== product.stock) {
             const diff = product.stock - oldProduct.stock;
             db.logStockMovement({
                productId: product.id,
                productName: product.name,
                type: diff > 0 ? 'MANUAL_ADJUST' : 'LOSS',
                quantity: diff,
                previousStock: oldProduct.stock,
                newStock: product.stock,
                costPrice: product.costPrice,
                description: 'Ajuste Manual'
             });
          }
          runSql("DELETE FROM products WHERE id = ?", [product.id]);
          runSql("INSERT INTO products VALUES ?", [product]);
      } else {
          db.logStockMovement({
              productId: product.id,
              productName: product.name,
              type: 'MANUAL_ADJUST',
              quantity: product.stock,
              previousStock: 0,
              newStock: product.stock,
              costPrice: product.costPrice,
              description: 'Cadastro Inicial'
          });
          runSql("INSERT INTO products VALUES ?", [product]);
      }
      saveDb();
  },

  deleteProduct: (id: string) => {
      runSql("DELETE FROM products WHERE id = ?", [id]);
      saveDb();
  },

  downloadExcelTemplate: () => {
      if (!window.XLSX) { alert("Biblioteca Excel não carregada."); return; }
      const ws = window.XLSX.utils.json_to_sheet([
          { code: '7890001', name: 'Produto Exemplo', price: 10.00, costPrice: 5.00, stock: 100, category: 'Geral', unit: 'UN', wholesalePrice: 0, wholesaleMinQuantity: 0 }
      ]);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Modelo");
      window.XLSX.writeFile(wb, "modelo_produtos.xlsx");
  },

  exportProductsToExcel: () => {
      if (!window.XLSX) { alert("Biblioteca Excel não carregada."); return; }
      const products = runSql("SELECT * FROM products");
      const ws = window.XLSX.utils.json_to_sheet(products);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Produtos");
      window.XLSX.writeFile(wb, "estoque.xlsx");
  },

  importProductsFromExcel: async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          if (!window.XLSX) return reject("Biblioteca Excel não carregada.");
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = e.target?.result;
                  const workbook = window.XLSX.read(data, { type: 'binary' });
                  const firstSheet = workbook.SheetNames[0];
                  const excelRows = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                  let count = 0;
                  excelRows.forEach((row: any) => {
                      if (row.name) {
                           const code = row.code ? String(row.code) : `IMP${Date.now()}${Math.floor(Math.random()*100)}`;
                           const existing = runSql("SELECT * FROM products WHERE code = ?", [code]);
                           const p: Product = {
                               id: existing.length > 0 ? existing[0].id : crypto.randomUUID(),
                               code,
                               name: row.name,
                               price: parseFloat(row.price) || 0,
                               costPrice: parseFloat(row.costPrice) || 0,
                               stock: parseFloat(row.stock) || 0,
                               category: row.category || 'Geral',
                               unit: row.unit || 'UN',
                               imageUrl: 'https://via.placeholder.com/150',
                               wholesalePrice: parseFloat(row.wholesalePrice) || 0,
                               wholesaleMinQuantity: parseFloat(row.wholesaleMinQuantity) || 0,
                               ncm: '', cfop: '', cest: '', taxRate: 0
                           };
                           
                           if (existing.length > 0) {
                               runSql("DELETE FROM products WHERE id = ?", [p.id]);
                               runSql("INSERT INTO products VALUES ?", [p]);
                           } else {
                               runSql("INSERT INTO products VALUES ?", [p]);
                           }
                           count++;
                      }
                  });
                  saveDb();
                  resolve(`${count} produtos processados.`);
              } catch (err) {
                  reject("Erro ao ler arquivo.");
              }
          };
          reader.readAsBinaryString(file);
      });
  },

  parseNFe: (xmlContent: string): ImportPreviewData => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) throw new Error("Arquivo XML inválido.");

      let supplier: Supplier | null = null;
      let carrier: Carrier | null = null;
      const items: ImportItem[] = [];
      let vNF = 0;

      try {
          const totalTags = xmlDoc.getElementsByTagName('ICMSTot');
          if (totalTags.length > 0) { 
              const vNFStr = getTagValue(totalTags[0], 'vNF'); 
              vNF = vNFStr ? parseFloat(vNFStr) : 0; 
          }
      } catch (e) {}

      try {
          const emitTags = xmlDoc.getElementsByTagName('emit');
          if (emitTags.length > 0) {
            const emit = emitTags[0];
            const cnpj = getTagValue(emit, 'CNPJ');
            if (cnpj) {
                supplier = {
                  id: cnpj, cnpj, name: getTagValue(emit, 'xNome'), tradeName: getTagValue(emit, 'xFant'),
                  address: `${getTagValue(emit, 'xLgr')}, ${getTagValue(emit, 'nro')}`, city: getTagValue(emit, 'xMun'), phone: getTagValue(emit, 'fone'), ie: getTagValue(emit, 'IE')
                };
            }
          }
      } catch (e) {}

      try {
          const transpTags = xmlDoc.getElementsByTagName('transporta');
          if (transpTags.length > 0) {
            const transp = transpTags[0];
            const cnpj = getTagValue(transp, 'CNPJ');
            if (cnpj) {
              carrier = { id: cnpj, cnpj, name: getTagValue(transp, 'xNome'), uf: getTagValue(transp, 'UF') };
              const veicTags = xmlDoc.getElementsByTagName('veicTransp');
              if(veicTags.length > 0) carrier.plate = getTagValue(veicTags[0], 'placa');
            }
          }
      } catch (e) {}

      const detTags = xmlDoc.getElementsByTagName('det');
      let currentProducts: Product[] = [];
      try { currentProducts = db.getProducts(); } catch(e) {}

      for (let i = 0; i < detTags.length; i++) {
        try {
            const prodTag = detTags[i].getElementsByTagName('prod')[0];
            if (!prodTag) continue;
            let code = getTagValue(prodTag, 'cEAN');
            if (!code || code === 'SEM GTIN') code = getTagValue(prodTag, 'cProd') || `GEN-${i}`;
            
            items.push({
              code, 
              name: getTagValue(prodTag, 'xProd'), 
              quantity: parseFloat(getTagValue(prodTag, 'qCom')) || 0, 
              costPrice: parseFloat(getTagValue(prodTag, 'vUnCom')) || 0,
              unit: getTagValue(prodTag, 'uCom'), 
              ncm: getTagValue(prodTag, 'NCM'), cfop: getTagValue(prodTag, 'CFOP'), cest: getTagValue(prodTag, 'CEST'), 
              isNew: !currentProducts.some(p => p.code === code)
            });
        } catch (errItem) {}
      }

      const today = new Date(); today.setDate(today.getDate() + 30);
      return { supplier, carrier, items, finance: { totalValue: vNF, installments: 1, paymentMethod: 'BOLETO', firstDueDate: today.toISOString().split('T')[0] } };
  },

  commitImport: (data: ImportPreviewData) => {
      const summary = { productsCreated: 0, productsUpdated: 0, financeRecordsCreated: 0 };
      
      if (data.supplier && data.supplier.cnpj) {
        try {
            const existing = runSql("SELECT * FROM suppliers WHERE cnpj = ?", [data.supplier.cnpj]);
            if (existing.length > 0) runSql("DELETE FROM suppliers WHERE cnpj = ?", [data.supplier.cnpj]);
            runSql("INSERT INTO suppliers VALUES ?", [data.supplier]);
        } catch(e) {}
      }
      
      data.items.forEach(item => {
        try {
            const existing = runSql("SELECT * FROM products WHERE code = ?", [item.code]);
            let productId = existing.length > 0 ? existing[0].id : crypto.randomUUID();
            let stock = existing.length > 0 ? (existing[0].stock || 0) : 0;
            
            const productToSave: Product = {
                id: productId,
                code: item.code,
                name: item.name,
                price: existing.length > 0 ? existing[0].price : item.costPrice * 1.5,
                costPrice: item.costPrice,
                stock: stock + item.quantity,
                category: existing.length > 0 ? existing[0].category : 'Importado',
                unit: item.unit,
                wholesalePrice: existing.length > 0 ? existing[0].wholesalePrice : 0,
                wholesaleMinQuantity: existing.length > 0 ? existing[0].wholesaleMinQuantity : 0,
                ncm: item.ncm, cfop: item.cfop, cest: item.cest, taxRate: 0,
                imageUrl: existing.length > 0 ? existing[0].imageUrl : 'https://via.placeholder.com/200?text=No+Image'
            };

            runSql("DELETE FROM products WHERE id = ?", [productId]);
            runSql("INSERT INTO products VALUES ?", [productToSave]);
            
            if(existing.length > 0) summary.productsUpdated++; else summary.productsCreated++;

            db.logStockMovement({
                productId: productId, productName: item.name, type: 'ENTRY_XML', quantity: item.quantity,
                previousStock: stock, newStock: stock + item.quantity, costPrice: item.costPrice, description: 'Entrada NFe'
            });
        } catch (e) {}
      });
      
      if (data.finance.totalValue > 0) {
        try {
            const totalVal = parseFloat(String(data.finance.totalValue));
            const numInstallments = Math.floor(Math.max(1, parseInt(String(data.finance.installments), 10)));
            const rawInstallment = totalVal / numInstallments;
            const baseInstallment = Math.floor(rawInstallment * 100) / 100;
            const remainder = Math.round((totalVal - (baseInstallment * numInstallments)) * 100) / 100;
            const baseDate = new Date(data.finance.firstDueDate);
            baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

            for (let i = 0; i < numInstallments; i++) {
                const dueDate = new Date(baseDate); 
                dueDate.setMonth(dueDate.getMonth() + i);
                let currentAmount = baseInstallment;
                if (i === 0) currentAmount += remainder;
                const finRec = { id: crypto.randomUUID(), type: 'DESPESA', description: `Compra NFe (Parc ${i + 1}/${numInstallments})`, amount: currentAmount, date: dueDate.getTime(), category: 'Fornecedores' };
                runSql("INSERT INTO financial VALUES ?", [finRec]);
                summary.financeRecordsCreated++;
            }
        } catch(e) {}
      }

      saveDb();
      return summary;
  },

  getSuppliers: (): Supplier[] => runSql("SELECT * FROM suppliers"),
  getCarriers: (): Carrier[] => runSql("SELECT * FROM carriers"),
  getSales: (): Sale[] => runSql("SELECT * FROM sales"),

  // --- FUNÇÃO DE VENDA ATUALIZADA ---
  createSale: async (
      items: CartItem[], 
      paymentMethod: PaymentMethod, 
      client: Client | null = null, 
      redeemPoints: number = 0,
      isFiscal: boolean = true,
      status: 'COMPLETED' | 'CANCELLED' | 'PENDING' = 'COMPLETED'
  ): Promise<Sale> => {
    const session = db.cash.getCurrentSession();
    if (!session) throw new Error("Caixa Fechado! É necessário abrir o caixa antes de realizar vendas.");
    
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const discount = redeemPoints > 0 ? redeemPoints : 0; 
    const finalTotal = Math.max(0, subtotal - discount);
    const settings = db.getSettings();
    
    let accessKey = '';
    let xml = '';
    let protocol = '';

    if (status === 'CANCELLED') {
         const uniqueId = Date.now().toString().slice(-8);
         accessKey = `CANCELADA-${uniqueId}`;
         xml = '';
         protocol = 'VENDA CANCELADA';
    } else if (isFiscal) {
        const nNF = settings.nextNfcNumber || 1;
        accessKey = nfcService.generateAccessKey(settings, nNF);
        xml = nfcService.generateXML(settings, items, nNF, finalTotal, paymentMethod, accessKey);
        const transmission = await nfcService.transmitNFCe(xml, settings);
        protocol = transmission.protocol;
        settings.nextNfcNumber = nNF + 1;
        db.saveSettings(settings);
    } else {
        const uniqueId = Date.now().toString().slice(-8);
        accessKey = `RECIBO-NAO-FISCAL-${uniqueId}`;
        xml = '';
        protocol = 'SEM VALOR FISCAL';
    }

    const pointsEarned = (status === 'COMPLETED') ? Math.floor(finalTotal / 10) : 0;
    
    if (status === 'COMPLETED' && client && client.id !== 'default') {
        client.points = (client.points || 0) - redeemPoints + pointsEarned;
        client.lastPurchase = Date.now();
        db.saveClient(client);
    }

    const newSale: Sale = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items, 
      total: finalTotal,
      subtotal: subtotal,
      discount: discount,
      paymentMethod,
      status: status,
      fiscalCode: accessKey,
      xmlContent: xml,
      protocol: protocol,
      environment: settings.environment,
      clientId: client?.id,
      clientName: client?.name,
      clientCpf: client?.cpf,
      pointsEarned,
      pointsRedeemed: redeemPoints
    };

    runSql("INSERT INTO sales VALUES ?", [newSale]);

    if (status === 'COMPLETED') {
        items.forEach(item => {
          const res = runSql("SELECT * FROM products WHERE id = ?", [item.id]);
          if (res.length > 0) {
            const product = res[0];
            const previous = product.stock;
            product.stock -= item.quantity;
            runSql("UPDATE products SET stock = ? WHERE id = ?", [product.stock, product.id]);
            db.logStockMovement({
                productId: product.id,
                productName: product.name,
                type: 'SALE',
                quantity: -item.quantity,
                previousStock: previous,
                newStock: product.stock,
                costPrice: product.costPrice,
                description: isFiscal ? `Venda NFC-e #${accessKey.slice(-8)}` : 'Venda Não Fiscal (F8)'
            });
          }
        });

        db.addFinancialRecord({
          id: crypto.randomUUID(),
          type: 'RECEITA',
          description: isFiscal ? `Venda PDV (${paymentMethod})` : `Venda Rápida F8 (${paymentMethod})`,
          amount: finalTotal,
          date: Date.now(),
          category: 'Vendas'
        });
    }

    saveDb();
    return newSale;
  },

  getUsers: (): User[] => runSql("SELECT * FROM users"),
  saveUser: (user: User) => {
    const exists = runSql("SELECT * FROM users WHERE id = ?", [user.id]);
    if (exists.length > 0) {
        runSql("UPDATE users SET name = ?, role = ?, pin = ? WHERE id = ?", [user.name, user.role, user.pin, user.id]);
    } else {
        runSql("INSERT INTO users VALUES ?", [user]);
    }
    saveDb();
  },
  deleteUser: (id: string) => { runSql("DELETE FROM users WHERE id = ?", [id]); saveDb(); },
  getFinancialRecords: (): FinancialRecord[] => runSql("SELECT * FROM financial"),
  addFinancialRecord: (record: FinancialRecord) => { runSql("INSERT INTO financial VALUES ?", [record]); saveDb(); },
  deleteFinancialRecord: (id: string) => { runSql("DELETE FROM financial WHERE id = ?", [id]); saveDb(); },
  getSettings: (): AppSettings => { const res = runSql("SELECT * FROM settings WHERE id = 'main'"); if (res.length > 0) return { ...DEFAULT_SETTINGS, ...res[0].data }; return DEFAULT_SETTINGS; },
  saveSettings: (settings: AppSettings) => { const exists = runSql("SELECT * FROM settings WHERE id = 'main'"); if (exists.length > 0) { runSql("UPDATE settings SET data = ? WHERE id = 'main'", [settings]); } else { runSql("INSERT INTO settings VALUES ?", [{id: 'main', data: settings}]); } saveDb(); },
  createBackup: () => { if (!window.alasql) return "{}"; const dump: Record<string, any[]> = {}; try { TABLE_LIST.forEach(tableName => { try { dump[tableName] = window.alasql(`SELECT * FROM ${tableName}`); } catch(e) {} }); return JSON.stringify(dump, null, 2); } catch(e) { return "{}"; } },
  restoreBackup: (jsonData: string) => { try { const data = JSON.parse(jsonData); Object.keys(data).forEach(table => { runSql(`DELETE FROM ${table}`); data[table].forEach((row: any) => runSql(`INSERT INTO ${table} VALUES ?`, [row])); }); saveDb(); return true; } catch (e) { return false; } },
  
  getClients: () => runSql("SELECT * FROM clients"),
  getClientByCpf: (cpf: string) => { const c = runSql("SELECT * FROM clients"); return c.find((x:any) => x.cpf.replace(/\D/g,'') === cpf.replace(/\D/g,'')); },
  saveClient: (c: Client) => { runSql("DELETE FROM clients WHERE id = ?", [c.id]); runSql("INSERT INTO clients VALUES ?", [c]); saveDb(); },
  logStockMovement: (m: any) => { runSql("INSERT INTO stock_movements VALUES ?", [{...m, id: crypto.randomUUID(), timestamp: Date.now(), userId: db.auth.getSession()?.name || 'System'}]); saveDb(); },
  getStockMovements: (pid?: string) => { let s = "SELECT * FROM stock_movements"; if(pid) s+=` WHERE productId='${pid}'`; s+=" ORDER BY timestamp DESC"; return runSql(s); },
  auth: {
      login: (uid: string, pin: string) => { const u = runSql("SELECT * FROM users WHERE id = ? AND pin = ?", [uid, pin]); if(u.length) { localStorage.setItem(SESSION_KEY, JSON.stringify(u[0])); return u[0]; } return null; },
      logout: () => localStorage.removeItem(SESSION_KEY),
      getSession: () => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  },
  cash: {
      getSessions: () => runSql("SELECT * FROM cash_sessions ORDER BY openedAt DESC"),
      getCurrentSession: () => runSql("SELECT * FROM cash_sessions WHERE status = 'OPEN'")[0],
      openSession: (bal: number, uid: string) => { const s = {id: crypto.randomUUID(), userId: uid, openedAt: Date.now(), openingBalance: bal, status: 'OPEN', movements: []}; runSql("INSERT INTO cash_sessions VALUES ?", [s]); saveDb(); return s; },
      addMovement: (type: string, amt: number, desc: string, uid: string) => { const s = db.cash.getCurrentSession(); if(!s) throw new Error("Caixa fechado"); const m = {id: crypto.randomUUID(), type, amount: amt, description: desc, timestamp: Date.now(), userId: uid}; const movs = s.movements || []; movs.push(m); runSql("UPDATE cash_sessions SET movements = ? WHERE id = ?", [movs, s.id]); saveDb(); },
      closeSession: (closed: number) => { const s = db.cash.getCurrentSession(); if(!s) throw new Error("Caixa fechado"); const sys = s.openingBalance; runSql("UPDATE cash_sessions SET status='CLOSED', closingBalance=?, systemBalance=? WHERE id=?", [closed, sys, s.id]); saveDb(); return {systemBalance: sys, diff: 0}; }
  }
};