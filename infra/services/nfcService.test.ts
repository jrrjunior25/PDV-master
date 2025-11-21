import { describe, it, expect, vi } from 'vitest';
import { NfcService } from './nfcService';
import { AppSettings, CartItem } from '../../core/types';

describe('NfcService', () => {
  const service = new NfcService();

  const mockSettings: AppSettings = {
    companyName: 'Test Company',
    cnpj: '12.345.678/0001-90',
    address: 'Rua Teste, 123 - Centro, Sao Paulo - SP',
    pixKey: '',
    pixKeyType: 'CNPJ',
    printerWidth: 80,
    certificateName: '',
    certificateData: '',
    environment: 'HOMOLOGACAO',
    nfcSeries: 1,
    nextNfcNumber: 1,
    cscToken: '123456',
    cscId: '1',
    logoData: ''
  };

  it('should generate a valid access key', () => {
    const key = service.generateAccessKey(mockSettings, 1);

    expect(key).toHaveLength(44);
    // Check UF code for SP (35)
    expect(key.substring(0, 2)).toBe('35');
    // Check CNPJ (12345678000190)
    expect(key.substring(6, 20)).toBe('12345678000190');
    // Check Model (65)
    expect(key.substring(20, 22)).toBe('65');
    // Check Series (001)
    expect(key.substring(22, 25)).toBe('001');
    // Check Number (000000001)
    expect(key.substring(25, 34)).toBe('000000001');
    // Check Emission Type (1)
    expect(key.substring(34, 35)).toBe('1');
  });

  it('should generate XML content', () => {
    const cart: CartItem[] = [
        { id: '1', code: '123', name: 'Test Product', price: 10.00, quantity: 2, total: 20.00, unit: 'UN', stock: 10, costPrice: 5, category: 'General', wholesalePrice: 0, wholesaleMinQuantity: 0 }
    ];
    const accessKey = '352310123456780001906500100000000110000000000000'; // Mock key

    const xml = service.generateXML(mockSettings, cart, 1, 20.00, 'DINHEIRO', accessKey);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<NFe xmlns="http://www.portalfiscal.inf.br/nfe">');
    expect(xml).toContain(`<infNFe Id="NFe${accessKey}" versao="4.00">`);
    expect(xml).toContain('<xNome>Test Company</xNome>');
    expect(xml).toContain('<CNPJ>12345678000190</CNPJ>');
    expect(xml).toContain('<cProd>123</cProd>');
    expect(xml).toContain('<vProd>20.00</vProd>');
    expect(xml).toContain('<tPag>01</tPag>'); // DINHEIRO
  });

  it('should simulate NFC-e transmission', async () => {
    const result = await service.transmitNFCe('<xml></xml>', mockSettings);
    expect(result.success).toBe(true);
    expect(result.protocol).toBeDefined();
    expect(result.message).toContain('Autorizado');
  });
});
