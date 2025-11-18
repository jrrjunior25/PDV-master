
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
    payload += this.formatValue('00', '01');
    const gui = this.formatValue('00', 'br.gov.bcb.pix');
    const key = this.formatValue('01', this.pixKey);
    payload += this.formatValue('26', gui + key);
    payload += this.formatValue('52', '0000');
    payload += this.formatValue('53', '986');
    payload += this.formatValue('54', this.amount);
    payload += this.formatValue('58', 'BR');
    payload += this.formatValue('59', this.merchantName);
    payload += this.formatValue('60', this.merchantCity);
    const txIdVal = this.formatValue('05', this.txId);
    payload += this.formatValue('62', txIdVal);
    const crc = this.getCRC16(payload);
    return payload + crc;
  }
}
