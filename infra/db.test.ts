import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from './db';
import alasql from 'alasql';
import { Product, CartItem, PaymentMethod, Client } from '../core/types';

// Mock window.alasql and window.XLSX
// Since alasql is a library, we can use the real one for testing logic,
// but we need to attach it to window because db.ts expects it there.
// However, JSDOM window is not the global scope in Vitest by default in the same way.
// We need to make sure db.ts sees it.

describe('Database Logic (db.ts)', () => {

  beforeEach(async () => {
    // Reset mocks and storage
    vi.clearAllMocks();
    localStorage.clear();

    // Setup AlaSQL for testing
    (window as any).alasql = alasql;
    (window as any).XLSX = {
        utils: {
            json_to_sheet: vi.fn(),
            book_new: vi.fn(),
            book_append_sheet: vi.fn(),
            sheet_to_json: vi.fn()
        },
        writeFile: vi.fn(),
        read: vi.fn()
    };

    // Re-initialize DB tables for each test
    alasql(`CREATE TABLE IF NOT EXISTS products (id STRING PRIMARY KEY, code STRING, name STRING, price NUMBER, costPrice NUMBER, stock NUMBER, category STRING, unit STRING, imageUrl STRING, wholesalePrice NUMBER, wholesaleMinQuantity NUMBER, ncm STRING, cfop STRING, cest STRING, taxRate NUMBER)`);
    alasql(`CREATE TABLE IF NOT EXISTS sales (id STRING PRIMARY KEY, timestamp NUMBER, [total] NUMBER, subtotal NUMBER, discount NUMBER, paymentMethod STRING, status STRING, fiscalCode STRING, xmlContent STRING, protocol STRING, environment STRING, clientId STRING, clientName STRING, clientCpf STRING, pointsEarned NUMBER, pointsRedeemed NUMBER, items JSON)`);
    alasql(`CREATE TABLE IF NOT EXISTS users (id STRING PRIMARY KEY, name STRING, role STRING, pin STRING)`);
    alasql(`CREATE TABLE IF NOT EXISTS clients (id STRING PRIMARY KEY, name STRING, cpf STRING, phone STRING, points NUMBER, lastPurchase NUMBER)`);
    alasql(`CREATE TABLE IF NOT EXISTS financial (id STRING PRIMARY KEY, type STRING, description STRING, amount NUMBER, date NUMBER, category STRING)`);
    alasql(`CREATE TABLE IF NOT EXISTS suppliers (id STRING PRIMARY KEY, cnpj STRING, name STRING, tradeName STRING, address STRING, city STRING, phone STRING, ie STRING)`);
    alasql(`CREATE TABLE IF NOT EXISTS carriers (id STRING PRIMARY KEY, cnpj STRING, name STRING, plate STRING, uf STRING)`);
    alasql(`CREATE TABLE IF NOT EXISTS settings (id STRING PRIMARY KEY, data JSON)`);
    alasql(`CREATE TABLE IF NOT EXISTS cash_sessions (id STRING PRIMARY KEY, userId STRING, openedAt NUMBER, closedAt NUMBER, openingBalance NUMBER, closingBalance NUMBER, systemBalance NUMBER, status STRING, movements JSON)`);
    alasql(`CREATE TABLE IF NOT EXISTS stock_movements (id STRING PRIMARY KEY, productId STRING, productName STRING, type STRING, quantity NUMBER, previousStock NUMBER, newStock NUMBER, costPrice NUMBER, timestamp NUMBER, description STRING, userId STRING)`);

    // Explicitly insert a product for testing
    alasql("INSERT INTO products VALUES ?", [{ id: '1', code: '7891000100103', name: 'Arroz Branco Tipo 1 5kg', price: 24.90, wholesalePrice: 22.90, wholesaleMinQuantity: 6, costPrice: 18.50, stock: 100, category: 'Alimentos', unit: 'UN', imageUrl: 'https://picsum.photos/id/1/200/200' }]);

    // Explicitly insert a user for testing
    alasql("INSERT INTO users VALUES ?", [{ id: '1', name: 'Administrador', role: 'ADMIN', pin: '1234' }]);

    // Also call init to set isInitialized flag
    await db.init();
  });

  afterEach(() => {
    // Drop tables to clean up
    alasql('DROP TABLE IF EXISTS products');
    alasql('DROP TABLE IF EXISTS sales');
    alasql('DROP TABLE IF EXISTS users');
    alasql('DROP TABLE IF EXISTS clients');
    alasql('DROP TABLE IF EXISTS financial');
    alasql('DROP TABLE IF EXISTS suppliers');
    alasql('DROP TABLE IF EXISTS carriers');
    alasql('DROP TABLE IF EXISTS settings');
    alasql('DROP TABLE IF EXISTS cash_sessions');
    alasql('DROP TABLE IF EXISTS stock_movements');
  });

  it('should initialize database with default data', () => {
    const products = db.getProducts();
    expect(products.length).toBeGreaterThan(0); // Should have initial products
    const users = db.getUsers();
    expect(users.length).toBeGreaterThan(0); // Should have initial users
  });

  it('should create a sale and update stock', async () => {
    // Open a cash session first
    const user = db.getUsers()[0];
    expect(user).toBeDefined();
    db.cash.openSession(100, user.id);

    const product = db.getProducts()[0];
    const initialStock = product.stock;
    const cartItem: CartItem = {
        ...product,
        quantity: 2,
        total: product.price * 2
    };

    const sale = await db.createSale([cartItem], 'DINHEIRO', null, 0, false);

    expect(sale).toBeDefined();
    expect(sale.total).toBe(cartItem.total);
    expect(sale.status).toBe('COMPLETED');

    const updatedProduct = db.getProductByCode(product.code);
    expect(updatedProduct?.stock).toBe(initialStock - 2);

    // Check financial record
    const finRecords = db.getFinancialRecords();
    expect(finRecords.length).toBeGreaterThan(0);
    const lastRecord = finRecords[finRecords.length - 1];
    expect(lastRecord.amount).toBe(sale.total);
    expect(lastRecord.type).toBe('RECEITA');
  });

  it('should create a client and save it', () => {
    const newClient: Client = {
        id: 'client-1',
        name: 'Test Client',
        cpf: '123.456.789-00',
        points: 0
    };

    db.saveClient(newClient);
    const retrieved = db.getClientByCpf('12345678900');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Client');
  });

  it('should handle stock movements logging', () => {
    const product = db.getProducts()[0];
    expect(product).toBeDefined();

    db.logStockMovement({
        productId: product.id,
        productName: product.name,
        type: 'LOSS',
        quantity: -1,
        previousStock: 10,
        newStock: 9,
        costPrice: 5,
        description: 'Broken'
    });

    const movements = db.getStockMovements(product.id);
    expect(movements.length).toBeGreaterThan(0);
    expect(movements[0].type).toBe('LOSS');
  });

  it('should correctly parse NFe XML (mocked)', () => {
    const validXml = `
        <nfeProc>
            <NFe>
                <infNFe>
                    <emit><CNPJ>12345678000190</CNPJ><xNome>Supplier</xNome></emit>
                    <det nItem="1">
                        <prod>
                            <cProd>CODE123</cProd>
                            <xProd>Product 1</xProd>
                            <qCom>10</qCom>
                            <vUnCom>5.00</vUnCom>
                        </prod>
                    </det>
                    <total><ICMSTot><vNF>50.00</vNF></ICMSTot></total>
                </infNFe>
            </NFe>
        </nfeProc>
    `;

    const result = db.parseNFe(validXml);
    expect(result.supplier?.cnpj).toBe('12345678000190');
    expect(result.items.length).toBe(1);
    expect(result.items[0].code).toBe('CODE123');
    expect(result.finance.totalValue).toBe(50);
  });
});
