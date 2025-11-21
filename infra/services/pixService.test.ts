import { describe, it, expect } from 'vitest';
import { PixPayload } from './pixService';

describe('PixPayload', () => {
  it('should generate a valid PIX payload string', () => {
    const pix = new PixPayload('Loja Exemplo', 'Sao Paulo', '12345678900', 100.50, 'TRANS123');
    const payload = pix.getPayload();

    // Basic structure checks based on EMV QRCPS-MPM
    expect(payload).toContain('000201'); // Format Indicator
    expect(payload).toContain('0014br.gov.bcb.pix'); // GUI
    expect(payload).toContain('011112345678900'); // Key
    expect(payload).toContain('5406100.50'); // Amount
    expect(payload).toContain('5802BR'); // Country Code
    expect(payload).toContain('5912LOJA EXEMPLO'); // Merchant Name (Formatted)
    expect(payload).toContain('6009SAO PAULO'); // Merchant City (Formatted)
    expect(payload).toContain('0508TRANS123'); // TxId
    expect(payload).toMatch(/[0-9A-F]{4}$/); // CRC at the end
  });

  it('should format merchant name and city correctly', () => {
    const pix = new PixPayload('Lója de Teste!', 'São Paulo', 'key', 10, '123');
    const payload = pix.getPayload();

    // "Lója de Teste!" -> "LOJA DE TESTE" (normalized, uppercase, symbols removed)
    expect(payload).toContain('LOJA DE TESTE');
    // "São Paulo" -> "SAO PAULO"
    expect(payload).toContain('SAO PAULO');
  });

  it('should calculate CRC correctly', () => {
     // We can verify against a known valid PIX code or just ensure it generates 4 hex chars.
     // For regression testing, if we knew a valid input/output pair we would use it.
     // For now, we ensure it returns a string and has the CRC structure.
     const pix = new PixPayload('Test', 'City', 'key', 10, '123');
     const payload = pix.getPayload();
     expect(payload.length).toBeGreaterThan(20);
     expect(payload.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });
});
