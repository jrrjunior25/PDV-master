
import { AppSettings } from "../../core/types";

export class PixPayload {
  private merchantName: string;
  private merchantCity: string;
  private pixKey: string;
  private amount: string;
  private txId: string;

  constructor(name: string, city: string, key: string, amount: number, txId: string = '***') {
    this.merchantName = this.formatString(name, 25);
    this.merchantCity = this.formatString(city, 15);
    this.pixKey = key.trim();
    this.amount = amount.toFixed(2);
    this.txId = txId;
  }

  private formatString(value: string, maxLength: number): string {
    if (!value) return 'NAO INFORMADO';
    const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleaned = normalized.replace(/[^a-zA-Z0-9 ]/g, " ");
    return cleaned.trim().substring(0, maxLength).toUpperCase();
  }

  private formatValue(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private getCRC16(payload: string): string {
    // Adiciona o ID (63) e o tamanho (04) do CRC para o cálculo
    payload += '6304';
    const polynomial = 0x1021;
    let crc = 0xFFFF;

    for (let i = 0; i < payload.length; i++) {
      let c = payload.charCodeAt(i);
      crc ^= (c << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial);
        } else {
          crc = (crc << 1);
        }
        crc = crc & 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  public getPayload(): string {
    let payload = '';
    payload += this.formatValue('00', '01'); // Payload Format Indicator
    const gui = this.formatValue('00', 'br.gov.bcb.pix');
    const key = this.formatValue('01', this.pixKey);
    payload += this.formatValue('26', gui + key); // Merchant Account Information
    payload += this.formatValue('52', '0000'); // Merchant Category Code
    payload += this.formatValue('53', '986'); // Transaction Currency (BRL)
    payload += this.formatValue('54', this.amount); // Transaction Amount
    payload += this.formatValue('58', 'BR'); // Country Code
    payload += this.formatValue('59', this.merchantName); // Merchant Name
    payload += this.formatValue('60', this.merchantCity); // Merchant City

    // Additional Data Field Template (TxID)
    const txIdVal = this.formatValue('05', this.txId || '***');
    payload += this.formatValue('62', txIdVal);

    // Cálculo do CRC16 (inclui '6304' no cálculo)
    const crc = this.getCRC16(payload);

    // Retorna string completa: Dados + ID CRC (63) + Len CRC (04) + Valor CRC
    return payload + '6304' + crc;
  }
}

export class PixService {
    /**
     * Verifica o status de um pagamento PIX em tempo real.
     *
     * NOTA IMPORTANTE PARA USO REAL:
     * Ao contrário da NFe (que tem um padrão nacional), a API de consulta PIX
     * depende do PSP (Payment Service Provider) do recebedor (banco ou fintech).
     * Exemplos: Banco do Brasil, Itaú, Bradesco, Inter, Gerencianet (Efi), Mercado Pago, etc.
     *
     * Cada PSP tem sua própria URL e método de autenticação (geralmente mTLS ou OAuth2).
     * Navegadores bloqueiam chamadas diretas a essas APIs por segurança (CORS) e
     * pela impossibilidade de usar certificados clientes (mTLS) diretamente via fetch.
     *
     * Esta função deve apontar para o SEU backend intermediário.
     */
    public async checkPaymentStatus(txId: string, settings: AppSettings): Promise<{ paid: boolean, message: string }> {
        // URL fictícia de um Proxy de Backend do usuário
        const API_BASE_URL = settings.environment === 'PRODUCAO'
            ? 'https://api.sualoja.com.br/v1/pix/status'
            : 'http://localhost:8080/api/pix/status';

        try {
            console.log(`Consultando status PIX para TxID: ${txId}`);

            // Exemplo de chamada a um backend próprio
            const response = await fetch(`${API_BASE_URL}/${txId}`, {
                method: 'GET',
                headers: {
                   'Authorization': `Bearer ${settings.cscToken || 'TOKEN_DE_ACESSO'}`, // Token do sistema interno
                   'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Simulação de erro de rede ou 404
                throw new Error(`PSP respondeu com status ${response.status}`);
            }

            const data = await response.json();
            // Supondo que o backend retorne { status: 'CONCLUIDA' }

            if (data.status === 'CONCLUIDA' || data.status === 'PAID') {
                return { paid: true, message: 'Pagamento Confirmado' };
            } else {
                return { paid: false, message: 'Aguardando Pagamento...' };
            }

        } catch (error: any) {
            console.warn("Erro na verificação PIX (CORS/Rede):", error);

            // FALLBACK PARA MODO DE TESTE SEM BACKEND
            // Em homologação, se falhar a conexão, simulamos sucesso após 5 segundos para testes visuais
            if (settings.environment === 'HOMOLOGACAO') {
                return new Promise(resolve => {
                   // Randomly simulate payment success logic for UI testing
                   // (In real logic, simply return false)
                   const isRandomlyPaid = Math.random() > 0.7;
                   if (isRandomlyPaid) {
                       resolve({ paid: true, message: 'Pagamento Confirmado (Simulação Local)' });
                   } else {
                       resolve({ paid: false, message: 'Aguardando (Simulação Local)' });
                   }
                });
            }

            return { paid: false, message: 'Erro de conexão com API PIX' };
        }
    }
}
