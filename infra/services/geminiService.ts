
import { GoogleGenAI } from "@google/genai";
import { Sale, Product } from "../../core/types";

const apiKey = process.env.API_KEY || ''; 

export const geminiService = {
  analyzeBusiness: async (sales: Sale[], products: Product[]) => {
    if (!apiKey) {
      return "Configuração de API Key necessária para análise inteligente.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const salesSummary = sales.slice(-50).map(s => ({
        total: s.total,
        method: s.paymentMethod,
        items: s.items.map(i => i.name).join(', ')
      }));

      const prompt = `
        Atue como um Consultor de Varejo Sênior. Analise os seguintes dados de vendas recentes de um supermercado e forneça 3 insights curtos e acionáveis para aumentar o faturamento.
        Dados recentes: ${JSON.stringify(salesSummary)}
        Responda em português do Brasil, formato markdown bullet points.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error("Erro na análise Gemini:", error);
      return "Não foi possível gerar a análise no momento.";
    }
  },
  
  generateProductDescription: async (productName: string) => {
     if (!apiKey) return "Descrição padrão.";
     try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Crie uma descrição curta e atraente para etiqueta de gôndola para o produto: ${productName}. Máximo 20 palavras.`,
        });
        return response.text;
     } catch (e) {
         return "Descrição indisponível.";
     }
  }
};
