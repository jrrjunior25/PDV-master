import { Product, Sale, CartItem, PaymentMethod, User, FinancialRecord, AppSettings, Supplier, Carrier, ImportPreviewData, ImportItem, CashSession, CashMovement, Client, StockMovement } from '../core/types';
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
  cscId: ''
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

// Helper SQL seguro
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

// Persistência do Banco Inteiro
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
    
    // Wait for AlaSQL
    let retries = 0;
    while (!window.alasql && retries < 30) { 
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    // Fallback
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

    if (!window.alasql) {
        console.error("CRITICAL ERROR: AlaSQL failed to load.");
        throw new Error("Falha crítica: O motor de banco de dados (AlaSQL) não pôde ser carregado."); 
    }

    // Create Tables
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
    } catch(e) {
        console.error("Error creating tables", e);
    }

    // Restore Data
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
        } catch (e) {
            console.error("Erro ao carregar DB salvo", e);
        }
    }

    // Initial Data
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

  // --- PARSE NFE ROBUSTO ---
  parseNFe: (xmlContent: string): ImportPreviewData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Arquivo XML inválido ou corrompido.");
    }

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
    } catch (e) { console.warn("Erro lendo total NFe", e); }

    try {
        const emitTags = xmlDoc.getElementsByTagName('emit');
        if (emitTags.length > 0) {
          const emit = emitTags[0];
          const cnpj = getTagValue(emit, 'CNPJ');
          if (cnpj) {
              supplier = {
                id: cnpj, 
                cnpj, 
                name: getTagValue(emit, 'xNome') || 'Fornecedor Desconhecido', 
                tradeName: getTagValue(emit, 'xFant'),
                address: `${getTagValue(emit, 'xLgr')}, ${getTagValue(emit, 'nro')} - ${getTagValue(emit, 'xBairro')}`,
                city: getTagValue(emit, 'xMun'), 
                phone: getTagValue(emit, 'fone'), 
                ie: getTagValue(emit, 'IE')
              };
          }
        }
    } catch (e) { console.warn("Erro lendo emitente", e); }

    try {
        const transpTags = xmlDoc.getElementsByTagName('transporta');
        if (transpTags.length > 0) {
          const transp = transpTags[0];
          const cnpj = getTagValue(transp, 'CNPJ');
          if (cnpj) {
            carrier = { 
                id: cnpj, 
                cnpj, 
                name: getTagValue(transp, 'xNome') || 'Transportadora', 
                uf: getTagValue(transp, 'UF') 
            };
            const veicTags = xmlDoc.getElementsByTagName('veicTransp');
            if(veicTags.length > 0) carrier.plate = getTagValue(veicTags[0], 'placa');
          }
        }
    } catch (e) { console.warn("Erro lendo transportadora", e); }

    const detTags = xmlDoc.getElementsByTagName('det');
    let currentProducts: Product[] = [];
    try { currentProducts = db.getProducts(); } catch(e) {}

    for (let i = 0; i < detTags.length; i++) {
      try {
          const prodTag = detTags[i].getElementsByTagName('prod')[0];
          if (!prodTag) continue;

          let code = getTagValue(prodTag, 'cEAN');
          if (!code || code === 'SEM GTIN' || code === '') {
              code = getTagValue(prodTag, 'cProd');
          }
          if (!code) code = `GEN-${Date.now()}-${i}`;

          const name = getTagValue(prodTag, 'xProd') || 'Produto Sem Nome';
          const quantity = parseFloat(getTagValue(prodTag, 'qCom')) || 0;
          const costPrice = parseFloat(getTagValue(prodTag, 'vUnCom')) || 0;
          const unit = getTagValue(prodTag, 'uCom') || 'UN';
          
          const exists = currentProducts.some(p => p.code === code);

          items.push({
            code, 
            name, 
            quantity, 
            costPrice,
            unit, 
            ncm: getTagValue(prodTag, 'NCM'),
            cfop: getTagValue(prodTag, 'CFOP'), 
            cest: getTagValue(prodTag, 'CEST'), 
            isNew: !exists
          });
      } catch (errItem) {
          console.error("Erro ao ler item " + i, errItem);
      }
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
    const summary = { productsCreated: 0, productsUpdated: 0, financeRecordsCreated: 0 };

    if (data.supplier && data.supplier.cnpj) {
      try {
          const existing = runSql("SELECT * FROM suppliers WHERE cnpj = ?", [data.supplier.cnpj]);
          if (existing.length > 0) {
             runSql("DELETE FROM suppliers WHERE cnpj = ?", [data.supplier.cnpj]);
          }
          runSql("INSERT INTO suppliers VALUES ?", [data.supplier]);
      } catch(e) { console.error("Erro salvando fornecedor", e); }
    }

    if (data.carrier && data.carrier.cnpj) {
      try {
          const existing = runSql("SELECT * FROM carriers WHERE cnpj = ?", [data.carrier.cnpj]);
          if (existing.length > 0) {
             runSql("DELETE FROM carriers WHERE cnpj = ?", [data.carrier.cnpj]);
          }
          runSql("INSERT INTO carriers VALUES ?", [data.carrier]);
      } catch(e) { console.error("Erro salvando transportadora", e); }
    }
    
    data.items.forEach(item => {
      try {
          const existing = runSql("SELECT * FROM products WHERE code = ?", [item.code]);
          let productId = '';
          let previousStock = 0;
          let productName = item.name;
          let productToSave: Product;
          let isUpdate = false;

          if (existing.length > 0) {
            const prod = existing[0];
            productId = prod.id;
            previousStock = prod.stock || 0;
            isUpdate = true;
            
            // Garante que todos os campos estejam presentes e sanitizados
            productToSave = {
                id: productId,
                code: prod.code,
                name: prod.name,
                price: prod.price,
                costPrice: item.costPrice, // Atualiza custo vindo da nota
                stock: previousStock + item.quantity, // Soma estoque
                category: prod.category || 'Geral',
                unit: prod.unit || 'UN',
                imageUrl: prod.imageUrl || 'https://via.placeholder.com/200?text=No+Image',
                wholesalePrice: prod.wholesalePrice || 0,
                wholesaleMinQuantity: prod.wholesaleMinQuantity || 0,
                ncm: item.ncm || prod.ncm || '',
                cfop: item.cfop || prod.cfop || '',
                cest: item.cest || prod.cest || '',
                taxRate: prod.taxRate || 0
            };
          } else {
            productId = crypto.randomUUID();
            productToSave = {
              id: productId, 
              code: item.code, 
              name: item.name,
              price: item.costPrice * 1.5, // Margem sugerida
              costPrice: item.costPrice, 
              stock: item.quantity,
              category: 'Importado XML', 
              unit: (item.unit || 'UN').substring(0, 2).toUpperCase(),
              imageUrl: 'https://via.placeholder.com/200?text=No+Image',
              wholesalePrice: 0,
              wholesaleMinQuantity: 0,
              ncm: item.ncm || '', 
              cfop: item.cfop || '', 
              cest: item.cest || '',
              taxRate: 0
            };
          }

          if (isUpdate) {
              runSql("DELETE FROM products WHERE id = ?", [productId]);
              summary.productsUpdated++;
          } else {
              summary.productsCreated++;
          }
          runSql("INSERT INTO products VALUES ?", [productToSave]);

          db.logStockMovement({
              productId: productId,
              productName: productName,
              type: 'ENTRY_XML',
              quantity: item.quantity,
              previousStock: previousStock,
              newStock: previousStock + item.quantity,
              costPrice: item.costPrice,
              description: `Entrada via NFe - Forn: ${data.supplier?.name || 'N/A'}`
          });
      } catch (e) {
          console.error("Erro ao salvar produto importado", item.code, e);
      }
    });

    if (data.finance.totalValue > 0) {
      try {
          const totalVal = Number(data.finance.totalValue);
          const numInstallments = Math.max(1, Number(data.finance.installments));
          const installmentValue = totalVal / numInstallments;
          const baseDate = new Date(data.finance.firstDueDate);
          baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

          for (let i = 0; i < numInstallments; i++) {
            const dueDate = new Date(baseDate); 
            dueDate.setMonth(dueDate.getMonth() + i);
            const finRec = {
              id: crypto.randomUUID(), 
              type: 'DESPESA',
              description: `Compra NFe - ${data.supplier?.name || 'Fornecedor'} (Parc ${i + 1}/${numInstallments})`,
              amount: Number(installmentValue.toFixed(2)), 
              date: dueDate.getTime(), 
              category: 'Fornecedores'
            };
            runSql("INSERT INTO financial VALUES ?", [finRec]);
            summary.financeRecordsCreated++;
          }
      } catch(e) { console.error("Erro gerando financeiro", e); }
    }

    saveDb();
    return summary;
  },

  // --- RESTO DO SISTEMA ---
  logStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp' | 'userId'>) => {
    try {
        const currentUser = db.auth.getSession();
        const newMovement: StockMovement = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            userId: currentUser?.name || 'Sistema',
            ...movement
        };
        runSql("INSERT INTO stock_movements VALUES ?", [newMovement]);
        saveDb();
    } catch(e) { console.error("Log Kardex error", e); }
  },

  getStockMovements: (productId?: string): StockMovement[] => {
      try {
          let sql = "SELECT * FROM stock_movements";
          if (productId) {
              sql += ` WHERE productId = '${productId}'`;
          }
          sql += " ORDER BY timestamp DESC";
          return runSql(sql);
      } catch(e) { return []; }
  },

  auth: {
    login: (userId: string, pin: string): User | null => {
        const users = runSql("SELECT * FROM users WHERE id = ? AND pin = ?", [userId, pin]);
        if (users.length > 0) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(users[0]));
            return users[0];
        }
        return null;
    },
    logout: () => {
        localStorage.removeItem(SESSION_KEY);
    },
    getSession: (): User | null => {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }
  },

  cash: {
      getSessions: (): CashSession[] => runSql("SELECT * FROM cash_sessions ORDER BY openedAt DESC"),
      getCurrentSession: (): CashSession | undefined => {
          const sessions = runSql("SELECT * FROM cash_sessions WHERE status = 'OPEN'");
          return sessions.length > 0 ? sessions[0] : undefined;
      },
      openSession: (openingBalance: number, userId: string): CashSession => {
          const current = db.cash.getCurrentSession();
          if(current) throw new Error("Já existe um caixa aberto.");
          const newSession: CashSession = { id: crypto.randomUUID(), userId, openedAt: Date.now(), openingBalance, status: 'OPEN', movements: [] };
          runSql("INSERT INTO cash_sessions VALUES ?", [newSession]);
          saveDb();
          return newSession;
      },
      addMovement: (type: 'SANGRIA' | 'SUPRIMENTO', amount: number, description: string, userId: string) => {
          const sessions = runSql("SELECT * FROM cash_sessions WHERE status = 'OPEN'");
          if(sessions.length === 0) throw new Error("Nenhum caixa aberto.");
          const session = sessions[0];
          
          const movements = session.movements || [];
          const movement: CashMovement = { id: crypto.randomUUID(), type, amount, description, timestamp: Date.now(), userId };
          movements.push(movement);
          
          runSql("UPDATE cash_sessions SET movements = ? WHERE id = ?", [movements, session.id]);
          
          if(type === 'SANGRIA') {
              db.addFinancialRecord({ id: crypto.randomUUID(), type: 'DESPESA', category: 'Sangria de Caixa', description: `Sangria PDV: ${description}`, amount: amount, date: Date.now() });
          }
          saveDb();
      },
      closeSession: (closingBalance: number) => {
          const sessions = runSql("SELECT * FROM cash_sessions WHERE status = 'OPEN'");
          if(sessions.length === 0) throw new Error("Nenhum caixa aberto.");
          const session = sessions[0];
          
          const sales = db.getSales();
          const cashSales = sales.filter(s => s.timestamp >= session.openedAt && s.paymentMethod === 'DINHEIRO').reduce((acc, s) => acc + s.total, 0);
          
          const movements = session.movements || [];
          const totalSangrias = movements.filter((m: any) => m.type === 'SANGRIA').reduce((acc: any, m: any) => acc + m.amount, 0);
          const totalSuprimentos = movements.filter((m: any) => m.type === 'SUPRIMENTO').reduce((acc: any, m: any) => acc + m.amount, 0);
          
          const systemBalance = session.openingBalance + cashSales + totalSuprimentos - totalSangrias;
          
          runSql("UPDATE cash_sessions SET status = 'CLOSED', closedAt = ?, closingBalance = ?, systemBalance = ? WHERE id = ?", 
              [Date.now(), closingBalance, systemBalance, session.id]);
          saveDb();
          return { systemBalance, diff: closingBalance - systemBalance };
      }
  },

  getClients: (): Client[] => runSql("SELECT * FROM clients"),
  getClientByCpf: (cpf: string): Client | undefined => {
      const cleanCpf = cpf.replace(/\D/g, '');
      const clients = runSql("SELECT * FROM clients");
      return clients.find((c: Client) => c.cpf.replace(/\D/g, '') === cleanCpf);
  },
  saveClient: (client: Client) => {
      const exists = runSql("SELECT id FROM clients WHERE id = ?", [client.id]);
      if (exists.length > 0) {
          runSql("UPDATE clients SET name = ?, cpf = ?, phone = ?, points = ?, lastPurchase = ? WHERE id = ?", 
              [client.name, client.cpf, client.phone, client.points, client.lastPurchase, client.id]);
      } else {
          runSql("INSERT INTO clients VALUES ?", [client]);
      }
      saveDb();
  },

  getProducts: (): Product[] => runSql("SELECT * FROM products"),
  getProductByCode: (code: string): Product | undefined => {
    const res = runSql("SELECT * FROM products WHERE code = ?", [code.trim()]);
    return res.length > 0 ? res[0] : undefined;
  },
  saveProduct: (product: Product) => {
    const exists = runSql("SELECT * FROM products WHERE id = ?", [product.id]);
    if (exists.length > 0) {
      const oldProduct = exists[0];
      if (oldProduct.stock !== product.stock) {
         const diff = product.stock - oldProduct.stock;
         db.logStockMovement({
            productId: product.id, productName: product.name, type: diff > 0 ? 'MANUAL_ADJUST' : 'LOSS',
            quantity: diff, previousStock: oldProduct.stock, newStock: product.stock, costPrice: product.costPrice, description: 'Ajuste Manual'
         });
      }
      runSql("DELETE FROM products WHERE id = ?", [product.id]);
      runSql("INSERT INTO products VALUES ?", [product]);
    } else {
      db.logStockMovement({
          productId: product.id, productName: product.name, type: 'MANUAL_ADJUST',
          quantity: product.stock, previousStock: 0, newStock: product.stock, costPrice: product.costPrice, description: 'Cadastro Inicial'
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
    const XLSX = window.XLSX;
    if (!XLSX) return alert("Erro: Biblioteca Excel não carregada.");
    const headers = ["CODIGO_BARRAS*", "NOME_PRODUTO*", "PRECO_VENDA", "PRECO_CUSTO", "ESTOQUE", "UNIDADE", "CATEGORIA", "NCM", "CFOP", "CEST"];
    const exampleRow = ["7891234567890", "Produto Exemplo 1KG", 10.50, 5.00, 100, "UN", "Alimentos", "12345678", "5102", "1234567"];
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação");
    XLSX.writeFile(wb, "Modelo_Importacao_Produtos.xlsx");
  },

  exportProductsToExcel: () => {
    const XLSX = window.XLSX;
    if (!XLSX) return alert("Erro: Biblioteca Excel não carregada.");
    const products = db.getProducts();
    const exportData = products.map(p => ({
      "CODIGO_BARRAS*": p.code, "NOME_PRODUTO*": p.name, "PRECO_VENDA": p.price, "PRECO_CUSTO": p.costPrice,
      "ESTOQUE": p.stock, "UNIDADE": p.unit, "CATEGORIA": p.category, "NCM": p.ncm || '', "CFOP": p.cfop || '', "CEST": p.cest || ''
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
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          if (jsonData.length === 0) return reject("Planilha vazia.");
          let created = 0, updated = 0;
          jsonData.forEach((row: any) => {
            const code = (row["CODIGO_BARRAS*"] || row["CODIGO"] || row["CODE"])?.toString();
            const name = row["NOME_PRODUTO*"] || row["NOME"] || row["NAME"];
            if (!code || !name) return;
            const existing = runSql("SELECT * FROM products WHERE code = ?", [code]);
            
            let productData: Product;
            
            if (existing.length > 0) {
               const prod = existing[0];
               const stockFromExcel = row["ESTOQUE"] !== undefined ? Number(row["ESTOQUE"]) : prod.stock;
               
               if(stockFromExcel !== prod.stock) {
                   db.logStockMovement({
                       productId: prod.id, productName: prod.name, type: 'MANUAL_ADJUST', quantity: stockFromExcel - prod.stock,
                       previousStock: prod.stock, newStock: stockFromExcel, costPrice: prod.costPrice, description: 'Importação Excel'
                   });
               }
               
               productData = {
                  id: prod.id,
                  code: prod.code,
                  name,
                  price: Number(row["PRECO_VENDA"] || prod.price),
                  costPrice: Number(row["PRECO_CUSTO"] || prod.costPrice),
                  stock: stockFromExcel,
                  unit: row["UNIDADE"] || prod.unit,
                  category: row["CATEGORIA"] || prod.category,
                  ncm: row["NCM"] ? String(row["NCM"]) : prod.ncm,
                  cfop: row["CFOP"] ? String(row["CFOP"]) : prod.cfop,
                  cest: row["CEST"] ? String(row["CEST"]) : prod.cest,
                  imageUrl: prod.imageUrl,
                  wholesalePrice: prod.wholesalePrice || 0,
                  wholesaleMinQuantity: prod.wholesaleMinQuantity || 0,
                  taxRate: prod.taxRate || 0
               };
               
               runSql("DELETE FROM products WHERE id = ?", [prod.id]); 
               runSql("INSERT INTO products VALUES ?", [productData]); 
               updated++;
            } else { 
               const newId = crypto.randomUUID(); const stock = Number(row["ESTOQUE"] || 0);
               productData = {
                  id: newId, code, name, price: Number(row["PRECO_VENDA"] || 0), costPrice: Number(row["PRECO_CUSTO"] || 0),
                  stock: stock, unit: row["UNIDADE"] || 'UN', category: row["CATEGORIA"] || 'Geral',
                  ncm: row["NCM"] ? String(row["NCM"]) : undefined, cfop: row["CFOP"] ? String(row["CFOP"]) : undefined,
                  cest: row["CEST"] ? String(row["CEST"]) : undefined, imageUrl: 'https://via.placeholder.com/200?text=No+Image',
                  wholesalePrice: 0, wholesaleMinQuantity: 0, taxRate: 0
               };
               runSql("INSERT INTO products VALUES ?", [productData]);
               db.logStockMovement({ productId: newId, productName: name, type: 'MANUAL_ADJUST', quantity: stock, previousStock: 0, newStock: stock, costPrice: productData.costPrice, description: 'Importação Excel (Novo)' });
               created++; 
            }
          });
          saveDb();
          resolve(`Importação: ${created} novos, ${updated} atualizados.`);
        } catch (err) { reject("Erro ao processar Excel."); }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  getSuppliers: (): Supplier[] => runSql("SELECT * FROM suppliers"),
  getCarriers: (): Carrier[] => runSql("SELECT * FROM carriers"),

  getSales: (): Sale[] => runSql("SELECT * FROM sales"),

  createSale: async (items: CartItem[], paymentMethod: PaymentMethod, client: Client | null = null, redeemPoints: number = 0): Promise<Sale> => {
    const session = db.cash.getCurrentSession();
    if (!session) throw new Error("Caixa Fechado!");
    
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const discount = redeemPoints > 0 ? redeemPoints : 0; 
    const finalTotal = Math.max(0, subtotal - discount);
    const settings = db.getSettings();
    const nNF = settings.nextNfcNumber || 1;
    
    const accessKey = nfcService.generateAccessKey(settings, nNF);
    const xml = nfcService.generateXML(settings, items, nNF, finalTotal, paymentMethod, accessKey);
    const transmission = await nfcService.transmitNFCe(xml, settings);

    const pointsEarned = Math.floor(finalTotal / 10);
    if (client && client.id !== 'default') {
        client.points = (client.points || 0) - redeemPoints + pointsEarned;
        client.lastPurchase = Date.now();
        db.saveClient(client);
    }

    const newSale: Sale = {
      id: crypto.randomUUID(), timestamp: Date.now(), items, total: finalTotal, subtotal: subtotal,
      discount: discount, paymentMethod, status: 'COMPLETED', fiscalCode: accessKey,
      xmlContent: xml, protocol: transmission.protocol, environment: settings.environment,
      clientId: client?.id, clientName: client?.name, clientCpf: client?.cpf,
      pointsEarned, pointsRedeemed: redeemPoints
    };

    runSql("INSERT INTO sales VALUES ?", [newSale]);

    items.forEach(item => {
      const res = runSql("SELECT * FROM products WHERE id = ?", [item.id]);
      if (res.length > 0) {
        const product = res[0];
        const previous = product.stock;
        product.stock -= item.quantity;
        runSql("UPDATE products SET stock = ? WHERE id = ?", [product.stock, product.id]);
        db.logStockMovement({
            productId: product.id, productName: product.name, type: 'SALE', quantity: -item.quantity,
            previousStock: previous, newStock: product.stock, costPrice: product.costPrice, description: `Venda NFC-e #${nNF}`
        });
      }
    });

    db.addFinancialRecord({ id: crypto.randomUUID(), type: 'RECEITA', description: `Venda PDV #${nNF} (${paymentMethod})`, amount: finalTotal, date: Date.now(), category: 'Vendas' });
    settings.nextNfcNumber = nNF + 1;
    db.saveSettings(settings);
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

  getSettings: (): AppSettings => {
    const res = runSql("SELECT * FROM settings WHERE id = 'main'");
    if (res.length > 0) return { ...DEFAULT_SETTINGS, ...res[0].data };
    return DEFAULT_SETTINGS;
  },
  saveSettings: (settings: AppSettings) => {
      const exists = runSql("SELECT * FROM settings WHERE id = 'main'");
      if (exists.length > 0) { runSql("UPDATE settings SET data = ? WHERE id = 'main'", [settings]); } 
      else { runSql("INSERT INTO settings VALUES ?", [{id: 'main', data: settings}]); }
      saveDb();
  },

  createBackup: () => {
    if (!window.alasql) return "{}";
    const dump: Record<string, any[]> = {};
    try {
        TABLE_LIST.forEach(tableName => { try { dump[tableName] = window.alasql(`SELECT * FROM ${tableName}`); } catch(e) {} });
        return JSON.stringify(dump, null, 2);
    } catch(e) { return "{}"; }
  },
  restoreBackup: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      Object.keys(data).forEach(table => {
           runSql(`DELETE FROM ${table}`);
           data[table].forEach((row: any) => runSql(`INSERT INTO ${table} VALUES ?`, [row]));
      });
      saveDb();
      return true;
    } catch (e) { return false; }
  }
};