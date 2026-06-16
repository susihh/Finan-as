/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Stored in Local Storage
  securityAnswer: string; // For password recovery verification
}

export interface Bank {
  id: string;
  name: string;
  color: string; // Estética: cor do card (hex ou classe tailwind)
  accountBalance: number; // Saldo em conta corrente / débito
  savingsBalance: number; // Saldo aplicado na poupança
  creditLimit: number; // Limite disponível do cartão de crédito
}

export interface Extra {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface CardAlert {
  id: string;
  message: string;
  timestamp: string;
  type: 'approved' | 'warning';
  bankId?: string;
  bankName: string;
  amount: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  allocationCategory: 'essentials' | 'wants' | 'savings';
  date: string;
  paymentMethod?: string; // Forma de pagamento: Pix, Cartão de Crédito, Cartão de Débito, Dinheiro, Boleto
  bankId?: string;        // ID do banco correspondente para débito automático ou compras em cartão
  notes?: string;         // Observações
  isRecurring?: boolean;  // Despesa fixa (mensal) vs despesa avulsa
}

export interface InvestmentContribution {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface ActiveInvestment {
  id: string;
  name: string;
  type: 'CDB/Pós-fixados' | 'Ações' | 'FIIs' | 'Tesouro Direto' | 'Poupança' | 'Cripto' | 'Outros';
  amount: number; // Total investido/aplicado
  yieldRate: number; // Percentual de rentabilidade (ex: 11.5) ou valor fixo
  yieldType: 'percentage' | 'fixed'; // % ou R$
  datePurchased: string;
  currentValue?: number; // Valor atualizado com rendimentos
  contributions: InvestmentContribution[]; // Histórico de aportes
}

export interface SalaryConfig {
  baseSalary: number;
  otherIncomes: number;
  essentialsPercent: number; // ex: 50
  wantsPercent: number;      // ex: 30
  savingsPercent: number;    // ex: 20
}

export interface CustomCategory {
  name: string;
  type: 'receita' | 'despesa';
  allocation: 'essentials' | 'wants' | 'savings';
  limit?: number; // Orcamento limite para alertas de estouro por categoria
}

export interface InvestmentSimulation {
  initialAmount: number;
  monthlyContribution: number;
  annualRate: number;
  years: number;
}
