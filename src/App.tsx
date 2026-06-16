/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Transaction, SalaryConfig, ActiveInvestment, User, CustomCategory, Bank, Extra, CardAlert } from './types';
import Dashboard from './components/Dashboard';
import SalaryPlanner from './components/SalaryPlanner';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import InvestmentPlanner from './components/InvestmentPlanner';
import Auth from './components/Auth';
import {
  Coins,
  History,
  TrendingUp,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  PiggyBank,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// STABLE INITIAL SAMPLES FOR PREMIUM USER DISCOVERY (Initial demonstration)
const INITIAL_SALARY_CONFIG: SalaryConfig = {
  baseSalary: 4500,
  otherIncomes: 800,
  essentialsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
};

const INITIAL_BANKS: Bank[] = [
  { id: 'b1', name: 'Nubank', color: '#820ad1', accountBalance: 2500, savingsBalance: 1000, creditLimit: 5000 },
  { id: 'b2', name: 'Itaú', color: '#ec5e1b', accountBalance: 4200, savingsBalance: 5000, creditLimit: 8000 },
  { id: 'b3', name: 'Bradesco', color: '#cc092f', accountBalance: 1200, savingsBalance: 2000, creditLimit: 2500 },
  { id: 'b4', name: 'Caixa', color: '#135c91', accountBalance: 3100, savingsBalance: 15000, creditLimit: 3000 }
];

const INITIAL_EXTRAS: Extra[] = [
  { id: 'e1', description: 'Freelance Website Dev', amount: 800, date: '2026-06-02' }
];

const INITIAL_ALERTS: CardAlert[] = [
  { id: 'a_init_1', message: '💳 Compra de R$ 520,00 aprovada no cartão Nubank', timestamp: '2026-06-02T18:30:00Z', type: 'approved', bankId: 'b1', bankName: 'Nubank', amount: 520 },
  { id: 'a_init_2', message: '💳 Compra de R$ 64,90 aprovada no cartão Nubank', timestamp: '2026-06-01T10:15:00Z', type: 'approved', bankId: 'b1', bankName: 'Nubank', amount: 64.9 }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    description: 'Salário Líquido Mensal',
    amount: 4500,
    type: 'receita',
    category: 'Salário',
    allocationCategory: 'essentials',
    date: '2026-06-01',
    paymentMethod: 'Transferência (TED/DOC)',
    bankId: 'b2', // Itaú
    notes: 'Creditado na conta corrente Itaú',
    isRecurring: true,
  },
  {
    id: 't2',
    description: 'Projeto Freelance UX/UI',
    amount: 800,
    type: 'receita',
    category: 'Renda Extra',
    allocationCategory: 'essentials',
    date: '2026-06-02',
    paymentMethod: 'Pix',
    bankId: 'b1', // Nubank
    notes: 'Entrega da primeira fase do projeto',
    isRecurring: false,
  },
  {
    id: 't3',
    description: 'Aluguel do Apartamento',
    amount: 1400,
    type: 'despesa',
    category: 'Moradia',
    allocationCategory: 'essentials',
    date: '2026-06-01',
    paymentMethod: 'Boleto Bancário',
    bankId: 'b2', // Itaú
    notes: 'Pago com desconto de pontualidade',
    isRecurring: true,
  },
  {
    id: 't4',
    description: 'Compras de Mercado',
    amount: 520,
    type: 'despesa',
    category: 'Alimentação',
    allocationCategory: 'essentials',
    date: '2026-06-02',
    paymentMethod: 'Cartão de Crédito',
    bankId: 'b1', // Nubank
    notes: 'Abastecimento quinzenal',
    isRecurring: false,
  },
  {
    id: 't5',
    description: 'Pedágio e Gasolina',
    amount: 180,
    type: 'despesa',
    category: 'Transporte',
    allocationCategory: 'essentials',
    date: '2026-06-03',
    paymentMethod: 'Pix',
    bankId: 'b3', // Bradesco
    notes: 'Ida para o escritório',
    isRecurring: false,
  },
  {
    id: 't6',
    description: 'Spotify + Assinatura Netflix',
    amount: 64.9,
    type: 'despesa',
    category: 'Assinaturas',
    allocationCategory: 'wants',
    date: '2026-06-01',
    paymentMethod: 'Cartão de Crédito',
    bankId: 'b1', // Nubank
    notes: 'Débito automático no cartão',
    isRecurring: true,
  },
  {
    id: 't7',
    description: 'Jantar Restaurante Fim de Semana',
    amount: 190,
    type: 'despesa',
    category: 'Restaurantes',
    allocationCategory: 'wants',
    date: '2026-06-03',
    paymentMethod: 'Cartão de Débito',
    bankId: 'b1', // Nubank
    notes: 'Encontro com amigos',
    isRecurring: false,
  },
  {
    id: 't8',
    description: 'Aporte CDB Renda Fixa Liquidez',
    amount: 400,
    type: 'despesa',
    category: 'CDB/Renda Fixa',
    allocationCategory: 'savings',
    date: '2026-06-03',
    paymentMethod: 'Pix',
    bankId: 'b2', // Itaú
    notes: 'Reserva investida para o teto de emergências',
    isRecurring: true,
  },
];

const INITIAL_INVESTMENTS: ActiveInvestment[] = [
  {
    id: 'i1',
    name: 'CDB Bradesco 110% CDI',
    type: 'CDB/Pós-fixados',
    amount: 4500,
    yieldRate: 11.2,
    yieldType: 'percentage',
    datePurchased: '2026-02-10',
    currentValue: 4620,
    contributions: [
      { id: 'c1', amount: 4500, date: '2026-02-10', notes: 'Aporte Original Inicial' },
    ],
  },
  {
    id: 'i2',
    name: 'Tesouro IPCA+ 2035',
    type: 'Tesouro Direto',
    amount: 6800,
    yieldRate: 12.1,
    yieldType: 'percentage',
    datePurchased: '2025-11-15',
    currentValue: 7150,
    contributions: [
      { id: 'c2', amount: 6800, date: '2025-11-15', notes: 'Aporte Alvo' },
    ],
  },
  {
    id: 'i3',
    name: 'Ações Itaú (ITUB4)',
    type: 'Ações',
    amount: 2100,
    yieldRate: 14.5,
    yieldType: 'percentage',
    datePurchased: '2026-01-20',
    currentValue: 2280,
    contributions: [
      { id: 'c3', amount: 2100, date: '2026-01-20', notes: 'Compra 70 cotas' },
    ],
  },
];

const DEFAULT_CATEGORIES: CustomCategory[] = [
  // Receitas
  { name: 'Salário', type: 'receita', allocation: 'essentials' },
  { name: 'Renda Extra', type: 'receita', allocation: 'essentials' },
  { name: 'Rendimentos', type: 'receita', allocation: 'essentials' },
  { name: 'Outros', type: 'receita', allocation: 'essentials' },
  // Despesas Essentials
  { name: 'Moradia', type: 'despesa', allocation: 'essentials', limit: 1600 },
  { name: 'Alimentação', type: 'despesa', allocation: 'essentials', limit: 800 },
  { name: 'Transporte', type: 'despesa', allocation: 'essentials', limit: 300 },
  { name: 'Saúde', type: 'despesa', allocation: 'essentials', limit: 250 },
  { name: 'Educação', type: 'despesa', allocation: 'essentials', limit: 500 },
  { name: 'Contas/Serviços', type: 'despesa', allocation: 'essentials', limit: 300 },
  { name: 'Imprevistos', type: 'despesa', allocation: 'essentials', limit: 350 }, // Mandatory
  // Despesas Wants
  { name: 'Lazer/Hobby', type: 'despesa', allocation: 'wants', limit: 350 },
  { name: 'Compras', type: 'despesa', allocation: 'wants', limit: 450 },
  { name: 'Viagens', type: 'despesa', allocation: 'wants', limit: 1200 },
  { name: 'Restaurantes', type: 'despesa', allocation: 'wants', limit: 300 },
  { name: 'Assinaturas', type: 'despesa', allocation: 'wants', limit: 100 },
  // Despesas Savings
  { name: 'CDB/Renda Fixa', type: 'despesa', allocation: 'savings' },
  { name: 'Ações/Bolsa', type: 'despesa', allocation: 'savings' },
  { name: 'FIIs', type: 'despesa', allocation: 'savings' },
  { name: 'Criptoativos', type: 'despesa', allocation: 'savings' },
  { name: 'Reserva Emergência', type: 'despesa', allocation: 'savings' },
  { name: 'Outros Investimentos', type: 'despesa', allocation: 'savings' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('poupa_logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'salary' | 'transactions' | 'investments'>(
    'dashboard'
  );

  // States with localStorage loaded selectively under active account id context
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>(INITIAL_SALARY_CONFIG);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>(INITIAL_INVESTMENTS);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [banks, setBanks] = useState<Bank[]>(INITIAL_BANKS);
  const [extras, setExtras] = useState<Extra[]>(INITIAL_EXTRAS);
  const [cardAlerts, setCardAlerts] = useState<CardAlert[]>(INITIAL_ALERTS);

  // Temporary editing state for Transactions (CRUD Update element)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load individual data pools matching logged-in identity
  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      
      const savedSalary = localStorage.getItem(`poupa_${userKey}_salary_config`);
      setSalaryConfig(savedSalary ? JSON.parse(savedSalary) : INITIAL_SALARY_CONFIG);

      const savedTxs = localStorage.getItem(`poupa_${userKey}_transactions`);
      setTransactions(savedTxs ? JSON.parse(savedTxs) : INITIAL_TRANSACTIONS);

      const savedInvs = localStorage.getItem(`poupa_${userKey}_investments`);
      setActiveInvestments(savedInvs ? JSON.parse(savedInvs) : INITIAL_INVESTMENTS);

      const savedCategories = localStorage.getItem(`poupa_${userKey}_categories`);
      setCustomCategories(savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES);

      const savedBanks = localStorage.getItem(`poupa_${userKey}_banks`);
      setBanks(savedBanks ? JSON.parse(savedBanks) : INITIAL_BANKS);

      const savedExtras = localStorage.getItem(`poupa_${userKey}_extras`);
      setExtras(savedExtras ? JSON.parse(savedExtras) : INITIAL_EXTRAS);

      const savedAlerts = localStorage.getItem(`poupa_${userKey}_alerts`);
      setCardAlerts(savedAlerts ? JSON.parse(savedAlerts) : INITIAL_ALERTS);
    }
  }, [currentUser]);

  // Save states modifications automatically linked to active logged session
  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_salary_config`, JSON.stringify(salaryConfig));
    }
  }, [salaryConfig, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_transactions`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_investments`, JSON.stringify(activeInvestments));
    }
  }, [activeInvestments, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_categories`, JSON.stringify(customCategories));
    }
  }, [customCategories, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_banks`, JSON.stringify(banks));
    }
  }, [banks, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_extras`, JSON.stringify(extras));
    }
  }, [extras, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id;
      localStorage.setItem(`poupa_${userKey}_alerts`, JSON.stringify(cardAlerts));
    }
  }, [cardAlerts, currentUser]);

  // Auth logins success triggers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('poupa_logged_in_user', JSON.stringify(user));
  };

  // Auth signouts
  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair do seu gerenciador financeiro?')) {
      setCurrentUser(null);
      localStorage.removeItem('poupa_logged_in_user');
      setEditingTransaction(null);
      setActiveTab('dashboard');
    }
  };

  // Appends automatic card alerts
  const triggerCardNotifications = (bank: Bank, txAmount: number, isCredit: boolean, newBalance: number) => {
    const alertId = `al_${Date.now()}_1`;
    const timestamp = new Date().toISOString();
    const approvedMsg = `💳 Compra de R$ ${txAmount.toFixed(2)} aprovada no cartão ${bank.name}`;
    
    const localAlerts: CardAlert[] = [
      {
        id: alertId,
        message: approvedMsg,
        timestamp,
        type: 'approved',
        bankId: bank.id,
        bankName: bank.name,
        amount: txAmount
      }
    ];

    if (newBalance < 0) {
      localAlerts.push({
        id: `al_${Date.now()}_2`,
        message: `⚠️ Saldo insuficiente no banco ${bank.name} para essa compra no cartão`,
        timestamp,
        type: 'warning',
        bankId: bank.id,
        bankName: bank.name,
        amount: txAmount
      });
    }

    setCardAlerts((prev) => [...localAlerts, ...prev]);
  };

  // Helper to apply balance modifications based on a single transaction impact
  // action can be "add" or "revert"
  const syncBankBalance = (tx: Transaction, action: 'add' | 'revert', currentBanks: Bank[]): Bank[] => {
    if (!tx.bankId) return currentBanks;
    
    const factor = action === 'add' ? 1 : -1;
    
    return currentBanks.map((b) => {
      if (b.id !== tx.bankId) return b;
      
      let updatedAccBalance = b.accountBalance;
      let updatedCreditLimit = b.creditLimit;

      if (tx.type === 'receita') {
        const addedAmount = tx.amount * factor;
        updatedAccBalance += addedAmount;
      } else {
        const subtractedAmount = tx.amount * factor;
        updatedAccBalance -= subtractedAmount;
        
        // If credit card, decrease/increase creditLimit as well based on action state
        const isCredit = tx.paymentMethod === 'Cartão de Crédito';
        if (isCredit) {
          updatedCreditLimit -= subtractedAmount;
        }

        // Only trigger alerts if this is a fresh manual "add" action, and is some card payment
        if (action === 'add' && (tx.paymentMethod === 'Cartão de Crédito' || tx.paymentMethod === 'Cartão de Débito')) {
          triggerCardNotifications(b, tx.amount, isCredit, updatedAccBalance);
        }
      }

      return {
        ...b,
        accountBalance: updatedAccBalance,
        creditLimit: Math.max(0, updatedCreditLimit)
      };
    });
  };

  // Core transaction managers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx_${Date.now()}`,
    };
    
    setTransactions((prev) => [tx, ...prev]);

    // Apply currency sync on associated bank
    if (tx.bankId) {
      setBanks((prevBanks) => syncBankBalance(tx, 'add', prevBanks));
    }

    // If transaction type is despesa and allocation is savings, automatically register on investments portfolio if it matches!
    if (tx.type === 'despesa' && tx.allocationCategory === 'savings') {
      const alreadyLogged = activeInvestments.some(
        (i) => i.name.toLowerCase() === tx.category.toLowerCase() || i.name.toLowerCase() === tx.description.toLowerCase()
      );
      if (!alreadyLogged) {
        // Log basic automatic asset skeleton
        const newInv: ActiveInvestment = {
          id: `inv_auto_${Date.now()}`,
          name: tx.category,
          type: 'Outros',
          amount: tx.amount,
          yieldRate: 10, // estimated target %
          yieldType: 'percentage',
          datePurchased: tx.date,
          currentValue: tx.amount,
          contributions: [{ id: `cont_${Date.now()}`, amount: tx.amount, date: tx.date, notes: `Lançado via Extrato: ${tx.description}` }]
        };
        setActiveInvestments((prev) => [newInv, ...prev]);
      }
    }
  };

  const handleUpdateTransaction = (id: string, updated: Transaction) => {
    // Revert old transaction calculations first, then apply new ones
    const txOld = transactions.find((t) => t.id === id);
    setBanks((prevBanks) => {
      let stepBanks = prevBanks;
      if (txOld) {
        // Reverse old impact
        stepBanks = syncBankBalance(txOld, 'revert', stepBanks);
      }
      // Apply new impact
      return syncBankBalance(updated, 'add', stepBanks);
    });

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Excluir esta transação do histórico permanentemente?')) {
      const txToDel = transactions.find((t) => t.id === id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      
      // Revert subtracted values from associated bank
      if (txToDel && txToDel.bankId) {
        setBanks((prevBanks) => syncBankBalance(txToDel, 'revert', prevBanks));
      }

      if (editingTransaction?.id === id) {
        setEditingTransaction(null);
      }
    }
  };

  // Salary automatic deposit feature ("Recebi meu salário")
  const handleReceiveSalary = (bankId: string) => {
    const totalIncomeToDeposit = salaryConfig.baseSalary;
    if (totalIncomeToDeposit <= 0) {
      alert('Ajuste primeiro um valor de salário líquido válido na aba Regra Salarial!');
      return;
    }

    const targetBank = banks.find((b) => b.id === bankId);
    if (!targetBank) return;

    const tx: Transaction = {
      id: `tx_sal_${Date.now()}`,
      description: `Salário Líquido Mensal - Depósito no ${targetBank.name}`,
      amount: totalIncomeToDeposit,
      type: 'receita',
      category: 'Salário',
      allocationCategory: 'essentials',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transferência (TED/DOC)',
      bankId,
      notes: `Salário base creditado na conta do ${targetBank.name} e reiniciada a contagem do mês de forma opcional.`,
      isRecurring: true,
    };

    // Add entry
    setTransactions((prev) => [tx, ...prev]);

    // Deposit directly in bank
    setBanks((prevBanks) =>
      prevBanks.map((b) => {
        if (b.id === bankId) {
          return {
            ...b,
            accountBalance: b.accountBalance + totalIncomeToDeposit,
          };
        }
        return b;
      })
    );

    alert(`🎉 Depósito de salário efetuado! R$ ${totalIncomeToDeposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi adicionado ao saldo do ${targetBank.name}!`);
  };

  // Extras CRUD operations
  const handleAddExtra = (newExtra: Omit<Extra, 'id'>) => {
    const freshExtra: Extra = {
      ...newExtra,
      id: `ext_${Date.now()}`,
    };
    setExtras((prev) => [freshExtra, ...prev]);
    alert(`Renda extra de R$ ${newExtra.amount.toFixed(2)} cadastrada com sucesso!`);
  };

  const handleUpdateExtra = (id: string, updated: Extra) => {
    setExtras((prev) => prev.map((e) => (e.id === id ? updated : e)));
    alert('Renda extra atualizada!');
  };

  const handleDeleteExtra = (id: string) => {
    if (window.confirm('Excluir este lançamento de renda extra?')) {
      setExtras((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // Category builders
  const handleAddCustomCategory = (newCat: CustomCategory) => {
    setCustomCategories((prev) => [...prev, newCat]);
  };

  // Core investment managers
  const handleAddInvestment = (newInv: Omit<ActiveInvestment, 'id'>) => {
    const inv: ActiveInvestment = {
      ...newInv,
      id: `inv_${Date.now()}`,
    };
    setActiveInvestments((prev) => [inv, ...prev]);
  };

  const handleUpdateInvestment = (id: string, updated: ActiveInvestment) => {
    setActiveInvestments((prev) =>
      prev.map((i) => (i.id === id ? updated : i))
    );
  };

  const handleDeleteInvestment = (id: string) => {
    if (window.confirm('Tem certeza que de remover este ativo de investimentos do seu portfólio?')) {
      setActiveInvestments((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Reset demo defaults helper
  const handleResetData = () => {
    if (window.confirm('Esta operação redefinirá todos os seus valores atuais (salário, extrato, categorias e ativos) de forma permanente para os dados demonstrativos de exemplo. Deseja prosseguir?')) {
      setSalaryConfig(INITIAL_SALARY_CONFIG);
      setTransactions(INITIAL_TRANSACTIONS);
      setActiveInvestments(INITIAL_INVESTMENTS);
      setCustomCategories(DEFAULT_CATEGORIES);
      setBanks(INITIAL_BANKS);
      setExtras(INITIAL_EXTRAS);
      setCardAlerts(INITIAL_ALERTS);
      setEditingTransaction(null);
      setActiveTab('dashboard');
    }
  };

  // Return unauthenticated view gate
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="main-app-shell" className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col antialiased relative overflow-x-hidden">
      
      {/* Dynamic Glow Visual Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none print:hidden"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none print:hidden"></div>
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none print:hidden"></div>

      {/* Primary Top Header Navbar */}
      <header className="bg-white/5 backdrop-blur-2xl border-b border-white/10 shrink-0 sticky top-0 z-50 text-white shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Design Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black font-display tracking-tight flex items-center gap-1.5 text-white leading-none">
                  PoupaMais <span className="text-[10px] bg-indigo-500/25 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider hidden sm:inline-block">Financeiro</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Regra 50/30/20 & Juros Exponenciais
                </p>
              </div>
            </div>

            {/* Application menu bar tabs */}
            <nav id="desktop-tabs" className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel Geral
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'salary'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Coins className="w-4 h-4" />
                Regra Salarial
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <History className="w-4 h-4" />
                Registros CRUD
              </button>
              <button
                onClick={() => setActiveTab('investments')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'investments'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Simular Ativos
              </button>
            </nav>

            {/* Profile greeting and Quick Actions (Reset & Logout) */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-350">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gestor: <b className="text-white">{currentUser.name.split(' ')[0]}</b></span>
              </div>
              
              <button
                onClick={handleResetData}
                type="button"
                className="flex items-center gap-1 text-[11px] text-indigo-350 hover:text-indigo-200 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                title="Redefinir aplicativo com dados simulados de exemplo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resetar</span>
              </button>

              <button
                onClick={handleLogout}
                type="button"
                className="flex items-center gap-1 text-[11px] text-rose-350 hover:text-rose-250 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                title="Encerrar sessão de forma segura"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-black uppercase tracking-wider">Sair</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Sync Security Banner */}
      <section className="bg-white/5 border-b border-white/10 text-slate-300 py-2.5 text-center px-4 shrink-0 text-xs font-bold flex items-center justify-center gap-2 flex-wrap z-10 relative backdrop-blur-md print:hidden">
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          Offline-First Ativado:
        </span>
        <span>Conta de {currentUser.name}. Seus dados estão criptografados na sandbox local de seu próprio navegador de forma 100% privada.</span>
      </section>

      {/* Main payload frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 z-10 relative print:p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                salaryConfig={salaryConfig}
                transactions={transactions}
                activeInvestments={activeInvestments}
                customCategories={customCategories}
                setActiveTab={setActiveTab}
                banks={banks}
                setBanks={setBanks}
                cardAlerts={cardAlerts}
                setCardAlerts={setCardAlerts}
                onReceiveSalary={handleReceiveSalary}
                extras={extras}
              />
            )}

            {activeTab === 'salary' && (
              <SalaryPlanner
                salaryConfig={salaryConfig}
                setSalaryConfig={setSalaryConfig}
                transactions={transactions}
                extras={extras}
                onAddExtra={handleAddExtra}
                onUpdateExtra={handleUpdateExtra}
                onDeleteExtra={handleDeleteExtra}
                banks={banks}
                onReceiveSalary={handleReceiveSalary}
              />
            )}

            {activeTab === 'transactions' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 lg:sticky lg:top-20 print:hidden font-sans">
                  <TransactionForm
                    onAddTransaction={handleAddTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    editingTransaction={editingTransaction}
                    setEditingTransaction={setEditingTransaction}
                    customCategories={customCategories}
                    onAddCustomCategory={handleAddCustomCategory}
                    banks={banks}
                  />
                </div>
                <div className="lg:col-span-7 print:col-span-12 font-sans">
                  <TransactionList
                    transactions={transactions}
                    onDeleteTransaction={handleDeleteTransaction}
                    onSelectEditTransaction={(tx) => {
                      setEditingTransaction(tx);
                      // Scroll to top of form smoothly on mobile layout
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    editingTransactionId={editingTransaction?.id}
                  />
                </div>
              </div>
            )}

            {activeTab === 'investments' && (
              <InvestmentPlanner
                activeInvestments={activeInvestments}
                onAddInvestment={handleAddInvestment}
                onDeleteInvestment={handleDeleteInvestment}
                onUpdateInvestment={handleUpdateInvestment}
                banks={banks}
                setBanks={setBanks}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom action mobile menu bar */}
      <footer id="mobile-tabs" className="md:hidden sticky bottom-0 bg-slate-900/60 backdrop-blur-3xl border-t border-white/10 text-white p-2.5 flex justify-around items-center z-50 print:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-450'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Painel</span>
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider ${
            activeTab === 'salary' ? 'text-indigo-400 font-bold' : 'text-slate-450'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span>Regra</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider ${
            activeTab === 'transactions' ? 'text-indigo-400 font-bold' : 'text-slate-450'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Extrato</span>
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider ${
            activeTab === 'investments' ? 'text-indigo-400 font-bold' : 'text-slate-450'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Simular</span>
        </button>
      </footer>
    </div>
  );
}
