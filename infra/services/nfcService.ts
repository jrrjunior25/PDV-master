
import { AppSettings, CartItem, PaymentMethod } from "../../core/types";

export class NfcService {
  
  private getUfCode(state: string): string {
    const map: {[key: string]: string} = {
      'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15', 'AP': '16', 'TO': '17',
      'MA': '21', 'PI': '22', 'CE': '23', 'RN': '24', 'PB': '25', 'PE': '26', 'AL': '27', 'SE': '28', 'BA': '29',
      'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35', 'PR': '41', 'SC': '42', 'RS': '43',
      'MS': '50', 'MT': '51', 'GO': '52', 'DF': '53'
    };
    return map[state?.toUpperCase()] || '35'; 
  }

  private calculateAccessKeyDV(keyWithoutDV: string): string {
    let sum = 0;
    let weight = 2;
    for (let i = keyWithoutDV.length - 1; i >= 0; i--) {
      sum += parseInt(keyWithoutDV[i]) * weight;
      weight++;
      if (weight > 9) weight = 2;
    }
    const remainder = sum % 11;
    const dv = remainder < 2 ? 0 : 11 - remainder;
    return dv.toString();
  }

  private generateRandomCode(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('.')[0] + '-03:00';
  }

  public generateAccessKey(settings: AppSettings, nNF: number): string {
    const uf = this.getUfCode(settings.address?.slice(-2) || 'SP');
    const now = new Date();
    const aamm = now.getFullYear().toString().slice(2) + (now.getMonth() + 1).toString().padStart(2, '0');
    const cnpj = settings.cnpj.replace(/\D/g, '').padStart(14, '0');
    const mod = '65';
    const serie = settings.nfcSeries.toString().padStart(3, '0');
    const nNfStr = nNF.toString().padStart(9, '0');
    const tpEmis = '1';
    const cNf = this.generateRandomCode();

    const keyBase = `${uf}${aamm}${cnpj}${mod}${serie}${nNfStr}${tpEmis}${cNf}`;
    const dv = this.calculateAccessKeyDV(keyBase);
    
    return keyBase + dv;
  }

  public generateXML(
    settings: AppSettings, 
    cart: CartItem[], 
    nNF: number, 
    total: number, 
    paymentMethod: PaymentMethod,
    accessKey: string
  ): string {
    const now = new Date();
    const dateStr = this.formatDate(now);
    const ufCode = this.getUfCode(settings.address?.slice(-2) || 'SP');

    const detItems = cart.map((item, index) => `
        <det nItem="${index + 1}">
            <prod>
                <cProd>${item.code}</cProd>
                <cEAN>${item.code}</cEAN>
                <xProd>${item.name}</xProd>
                <NCM>${item.ncm || '00000000'}</NCM>
                <CFOP>${item.cfop || '5102'}</CFOP>
                <uCom>${item.unit}</uCom>
                <qCom>${item.quantity.toFixed(4)}</qCom>
                <vUnCom>${item.price.toFixed(2)}</vUnCom>
                <vProd>${item.total.toFixed(2)}</vProd>
                <cEANTrib>${item.code}</cEANTrib>
                <uTrib>${item.unit}</uTrib>
                <qTrib>${item.quantity.toFixed(4)}</qTrib>
                <vUnTrib>${item.price.toFixed(2)}</vUnTrib>
                <indTot>1</indTot>
            </prod>
            <imposto>
                <ICMS>
                    <ICMSSN102>
                        <orig>0</orig>
                        <CSOSN>102</CSOSN>
                    </ICMSSN102>
                </ICMS>
                <PIS>
                    <PISOutr>
                        <CST>99</CST>
                        <vBC>0.00</vBC>
                        <pPIS>0.00</pPIS>
                        <vPIS>0.00</vPIS>
                    </PISOutr>
                </PIS>
                <COFINS>
                    <COFINSOutr>
                        <CST>99</CST>
                        <vBC>0.00</vBC>
                        <pCOFINS>0.00</pCOFINS>
                        <vCOFINS>0.00</vCOFINS>
                    </COFINSOutr>
                </COFINS>
            </imposto>
        </det>
    `).join('');

    const payMap: {[key: string]: string} = {
        'DINHEIRO': '01',
        'CREDITO': '03',
        'DEBITO': '04',
        'PIX': '17'
    };

    const tPag = payMap[paymentMethod] || '99';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${accessKey}" versao="4.00">
        <ide>
            <cUF>${ufCode}</cUF>
            <cNF>${accessKey.substring(35, 43)}</cNF>
            <natOp>VENDA CONSUMIDOR</natOp>
            <mod>65</mod>
            <serie>${settings.nfcSeries}</serie>
            <nNF>${nNF}</nNF>
            <dhEmi>${dateStr}</dhEmi>
            <tpNF>1</tpNF>
            <idDest>1</idDest>
            <cMunFG>3550308</cMunFG>
            <tpImp>4</tpImp>
            <tpEmis>1</tpEmis>
            <cDV>${accessKey.slice(-1)}</cDV>
            <tpAmb>${settings.environment === 'PRODUCAO' ? '1' : '2'}</tpAmb>
            <finNFe>1</finNFe>
            <indFinal>1</indFinal>
            <indPres>1</indPres>
            <procEmi>0</procEmi>
            <verProc>MercadoMaster 2.0</verProc>
        </ide>
        <emit>
            <CNPJ>${settings.cnpj.replace(/\D/g, '')}</CNPJ>
            <xNome>${settings.companyName}</xNome>
            <enderEmit>
                <xLgr>${settings.address?.split(',')[0] || 'Rua'}</xLgr>
                <nro>S/N</nro>
                <xBairro>Centro</xBairro>
                <cMun>3550308</cMun>
                <xMun>Sao Paulo</xMun>
                <UF>SP</UF>
                <CEP>00000000</CEP>
                <cPais>1058</cPais>
                <xPais>BRASIL</xPais>
            </enderEmit>
            <IE>ISENTO</IE>
            <CRT>1</CRT>
        </emit>
        ${detItems}
        <total>
            <ICMSTot>
                <vBC>0.00</vBC>
                <vICMS>0.00</vICMS>
                <vICMSDeson>0.00</vICMSDeson>
                <vFCP>0.00</vFCP>
                <vBCST>0.00</vBCST>
                <vST>0.00</vST>
                <vFCPST>0.00</vFCPST>
                <vFCPSTRet>0.00</vFCPSTRet>
                <vProd>${total.toFixed(2)}</vProd>
                <vFrete>0.00</vFrete>
                <vSeg>0.00</vSeg>
                <vDesc>0.00</vDesc>
                <vII>0.00</vII>
                <vIPI>0.00</vIPI>
                <vIPIDevol>0.00</vIPIDevol>
                <vPIS>0.00</vPIS>
                <vCOFINS>0.00</vCOFINS>
                <vOutro>0.00</vOutro>
                <vNF>${total.toFixed(2)}</vNF>
            </ICMSTot>
        </total>
        <transp>
            <modFrete>9</modFrete>
        </transp>
        <pag>
            <detPag>
                <tPag>${tPag}</tPag>
                <vPag>${total.toFixed(2)}</vPag>
            </detPag>
        </pag>
        <infAdic>
            <infCpl>Val Aprox Trib R$ ${(total * 0.18).toFixed(2)} (18%) Fonte: IBPT</infCpl>
        </infAdic>
    </infNFe>
</NFe>`;

    return this.signXML(xml, settings.certificateData || '');
  }

  private signXML(xml: string, certificateData: string): string {
      // NOTE: Real XML Signing (XMLDSig) requires a specialized library like 'xml-crypto' or a backend service.
      // Browsers cannot easily access the private key from a .pfx/certificate without external helpers or WebCrypto API wrappers.
      // This is a PLACEHOLDER for the signed XML structure.

      if (!certificateData) {
          console.warn("Certificado Digital não configurado. O XML não foi assinado.");
          return xml;
      }

      // Em um cenário real, aqui usaríamos o certificado para assinar a tag <infNFe>
      // Como não temos acesso a libs de backend aqui, simularemos a tag de assinatura.

      const signedXml = xml.replace('</NFe>', `
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
            <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
            <Reference URI="#NFe${xml.match(/Id="NFe(\d+)"/)?.[1] || ''}">
                <Transforms>
                    <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                    <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                </Transforms>
                <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
                <DigestValue>BASE64_DIGEST_PLACEHOLDER</DigestValue>
            </Reference>
        </SignedInfo>
        <SignatureValue>BASE64_SIGNATURE_PLACEHOLDER_USING_CERTIFICATE</SignatureValue>
        <KeyInfo>
            <X509Data>
                <X509Certificate>${certificateData}</X509Certificate>
            </X509Data>
        </KeyInfo>
    </Signature>
</NFe>`);

      return signedXml;
  }

  public async transmitNFCe(xml: string, settings: AppSettings): Promise<{ success: boolean, protocol: string, message: string }> {
    // URLs reais da SEFAZ (Exemplo: SVRS - Sefaz Virtual RS, usada por vários estados)
    // Em produção real, cada estado pode ter sua URL específica (SP, PR, etc.)
    const SEFAZ_URLS = {
        HOMOLOGACAO: "https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx",
        PRODUCAO: "https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx"
    };

    const url = settings.environment === 'PRODUCAO' ? SEFAZ_URLS.PRODUCAO : SEFAZ_URLS.HOMOLOGACAO;

    // SOAP Envelope structure
    const soapEnvelope = `
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
    <soap:Header/>
    <soap:Body>
        <nfe:nfeDadosMsg>
            ${xml}
        </nfe:nfeDadosMsg>
    </soap:Body>
</soap:Envelope>`;

    try {
        // NOTE: SEFAZ generally blocks CORS (Cross-Origin Resource Sharing).
        // This request will likely fail if called directly from a browser without a Proxy.
        // In a real production env, you should point this to a local backend proxy (e.g. http://localhost:8080/sefaz-proxy)

        console.log(`Enviando para SEFAZ (${settings.environment}):`, url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                // SOAPAction usually required for older SOAP services, but NFe 4.0 uses straight post usually or specific header
            },
            body: soapEnvelope
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const responseText = await response.text();

        // Parse XML Response (Simplified logic)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(responseText, "text/xml");

        const cStat = xmlDoc.getElementsByTagName("cStat")[0]?.textContent;
        const xMotivo = xmlDoc.getElementsByTagName("xMotivo")[0]?.textContent;
        const nProt = xmlDoc.getElementsByTagName("nProt")[0]?.textContent;

        if (cStat === '100') { // 100 = Autorizado
             return {
                 success: true,
                 protocol: nProt || 'PROT-UNKNOWN',
                 message: xMotivo || 'Autorizado com sucesso'
             };
        } else {
             return {
                 success: false,
                 protocol: '',
                 message: `Rejeição (${cStat}): ${xMotivo}`
             };
        }

    } catch (error: any) {
        console.error("Erro de Transmissão SEFAZ:", error);

        // Fallback to simulation if configured to do so, or strict failure
        // For this "adjustment", we return the error to reflect real usage attempts.

        // If strictly needing to work in this demo environment without a proxy, we might fallback:
        if (error.message.includes("Failed to fetch") || error.name === 'TypeError') {
             return {
                 success: false,
                 protocol: '',
                 message: "Erro de Conexão: Provável bloqueio CORS da SEFAZ ou Falha de Rede. (Necessário Proxy Backend)"
             };
        }

        return {
            success: false,
            protocol: '',
            message: `Erro interno: ${error.message}`
        };
    }
  }
}
