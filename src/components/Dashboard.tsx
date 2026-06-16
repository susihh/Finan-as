import React, { useState } from 'react';
import { Transaction, SalaryConfig, ActiveInvestment, CustomCategory, Bank, CardAlert, Extra } from '../types';
import { formatCurrency, formatPercent, ALLOCATION_NAMES } from '../utils';
import {
  TrendingUp,
  ArrowDownRight,
  Target,
  Sparkles,
  Award,
  AlertOctagon,
  Percent,
  TrendingDown,
  Coins,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Activity,
  History,
  CheckCircle,
  HelpCircle,
  PiggyBank
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  salaryConfig: SalaryConfig;
  transactions: Transaction[];
  activeInvestments: ActiveInvestment[];
  customCategories: CustomCategory[];
  setActiveTab: (tab: 'dashboard' | 'salary' | 'transactions' | 'investments') => void;
  banks: Bank[];
  setBanks: React.Dispatch<React.SetStateAction<Bank[]>>;
  cardAlerts: CardAlert[];
  setCardAlerts: React.Dispatch<React.SetStateAction<CardAlert[]>>;
  onReceiveSalary: (bankId: string) => void;
  extras: Extra[];
}

const DASH_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308', '#ec4899', '#3b82f6'];

export default function Dashboard({
  salaryConfig,
  transactions,
  activeInvestments,
  customCategories,
  setActiveTab,
  banks,
  setBanks,
  cardAlerts,
  setCardAlerts,
  onReceiveSalary,
  extras,
}: DashboardProps) {
  // SALARY + EXTRAS INCOME CALCULATIONS
  const baseIncome = salaryConfig.baseSalary;
  const extrasIncome = extras.reduce((sum, e) => sum + e.amount, 0);
  const totalSalary = baseIncome + extrasIncome;

  // Receitas from manual transactions
  const totalIncomesFromTransactions = transactions
    .filter((t) => t.type === 'receita' && t.category !== 'Salário') // skip salary transaction to avoid double counting baseline
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Inflow = base Salary + extra inputs registered + recipes
  const totalPrimaryInflow = totalSalary + totalIncomesFromTransactions;

  // Expenses
  const totalExpenses = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  // Remaining Balance (Liquid Cash in Hand)
  const remainingBalance = totalPrimaryInflow - totalExpenses;

  // Long-term active portfolio total
  const totalInvestedPortfolio = activeInvestments.reduce((sum, t) => {
    return sum + (t.currentValue !== undefined ? t.currentValue : t.amount);
  }, 0);

  // BANK CALCULATIONS (Requirement 7)
  const totalSomaBancos = banks.reduce((sum, b) => sum + b.accountBalance + b.savingsBalance, 0);
  
  // Saldo Total = Banks money + long term active investments
  const totalPatrimony = totalSomaBancos + totalInvestedPortfolio;

  // Saldo Disponível = balances in account of all banks
  const saldoDisponivel = banks.reduce((sum, b) => sum + b.accountBalance, 0);
  const totalPoupançaBancos = banks.reduce((sum, b) => sum + b.savingsBalance, 0);

  // Category Expense decomposition (Pie Chart)
  const expenseDecomposition = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => {
      const matched = acc.find((item) => item.name === t.category);
      if (matched) {
        matched.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  // Budget ceilings
  const actualEssentials = transactions
    .filter((t) => t.type === 'despesa' && t.allocationCategory === 'essentials')
    .reduce((sum, t) => sum + t.amount, 0);

  const actualWants = transactions
    .filter((t) => t.type === 'despesa' && t.allocationCategory === 'wants')
    .reduce((sum, t) => sum + t.amount, 0);

  const actualSavings = transactions
    .filter((t) => t.type === 'despesa' && t.allocationCategory === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const targetEssentials = (totalSalary * salaryConfig.essentialsPercent) / 100;
  const targetWants = (totalSalary * salaryConfig.wantsPercent) / 100;
  const targetSavings = (totalSalary * salaryConfig.savingsPercent) / 100;

  // Timeline snapshot
  const getPatrimonyEvolutionData = () => {
    const sortedTxs = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let runningBanks = totalSomaBancos;
    let runningPortfolio = totalInvestedPortfolio;

    const snapshots = sortedTxs.map((t) => {
      if (t.type === 'receita') {
        runningBanks += t.amount;
      } else {
        runningBanks -= t.amount;
        if (t.allocationCategory === 'savings') {
          runningPortfolio += t.amount;
        }
      }
      return {
        date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
        'Saldo Disponível': Math.round(Math.max(0, runningBanks)),
        'Reservas Investidas': Math.round(runningPortfolio),
        'Patrimônio Consolidado': Math.round(Math.max(0, runningBanks) + runningPortfolio),
      };
    });

    if (snapshots.length === 0) {
      return [
        { date: 'Hoje', 'Saldo Disponível': Math.round(saldoDisponivel), 'Reservas Investidas': Math.round(totalInvestedPortfolio), 'Patrimônio Consolidado': Math.round(totalPatrimony) }
      ];
    }
    return snapshots.slice(-8);
  };

  const evolutionData = getPatrimonyEvolutionData();

  // Commit proportions
  const essentialCommitmentRate = totalSalary > 0 ? (actualEssentials / totalSalary) * 100 : 0;
  const wantsCommitmentRate = totalSalary > 0 ? (actualWants / totalSalary) * 100 : 0;
  const savingsCommitmentRate = totalSalary > 0 ? (actualSavings / totalSalary) * 100 : 0;
  const totalCommittedRate = essentialCommitmentRate + wantsCommitmentRate;

  // Bank management state variables
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankColor, setBankColor] = useState('#820ad1');
  const [bankAccBal, setBankAccBal] = useState('');
  const [bankSavBal, setBankSavBal] = useState('');
  const [bankLimit, setBankLimit] = useState('');

  // Editing state for bank balances
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editAccBal, setEditAccBal] = useState('');
  const [editSavBal, setEditSavBal] = useState('');
  const [editLimit, setEditLimit] = useState('');

  // Quick salary deposit dropdown selector
  const [salaryDepositBankId, setSalaryDepositBankId] = useState('');

  // Handles adding bank
  const handleCreateBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;
    const fresh: Bank = {
      id: `b_${Date.now()}`,
      name: bankName.trim(),
      color: bankColor,
      accountBalance: parseFloat(bankAccBal) || 0,
      savingsBalance: parseFloat(bankSavBal) || 0,
      creditLimit: parseFloat(bankLimit) || 0,
    };
    setBanks((prev) => [...prev, fresh]);
    setBankName('');
    setBankAccBal('');
    setBankSavBal('');
    setBankLimit('');
    setShowAddBank(false);
  };

  // Handles quick balance update
  const handleSaveBankBalances = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBankId) return;
    setBanks((prev) =>
      prev.map((b) => {
        if (b.id === editingBankId) {
          return {
            ...b,
            accountBalance: parseFloat(editAccBal) || 0,
            savingsBalance: parseFloat(editSavBal) || 0,
            creditLimit: parseFloat(editLimit) || 0,
          };
        }
        return b;
      })
    );
    setEditingBankId(null);
  };

  const handleDeleteBank = (id: string, name: string) => {
    if (banks.length <= 1) {
      alert('Você precisa ter pelo menos um banco cadastrado para realizar operações de débito e crédito!');
      return;
    }
    if (window.confirm(`Tem certeza de excluir o banco ${name}?`)) {
      setBanks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const startEditBank = (b: Bank) => {
    setEditingBankId(b.id);
    setEditAccBal(b.accountBalance.toString());
    setEditSavBal(b.savingsBalance.toString());
    setEditLimit(b.creditLimit.toString());
  };

  // Salary claim routine
  const triggerSalaryDeposit = () => {
    if (!salaryDepositBankId) {
      alert('Selecione primeiro uma das contas bancárias para simular o depósito de salário!');
      return;
    }
    onReceiveSalary(salaryDepositBankId);
    setSalaryDepositBankId('');
  };

  // Overbudget categories checking
  const overbudgetAlerts = customCategories
    .map((cat) => {
      if (!cat.limit || cat.limit <= 0) return null;
      const spent = transactions
        .filter((t) => t.type === 'despesa' && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent > cat.limit) {
        return {
          categoryName: cat.name,
          currentSpending: spent,
          ceilingLimit: cat.limit,
          excess: spent - cat.limit
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ categoryName: string; currentSpending: number; ceilingLimit: number; excess: number }>;

  // Diagnostic
  const savingsRate = totalPrimaryInflow > 0 ? (remainingBalance / totalPrimaryInflow) * 100 : 0;
  let healthScore = 'Saudável';
  let healthColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
  let healthDesc = 'Excelente! Suas finanças estão robustas, seus gastos estão sob controle e você possui caixa positivo.';

  if (saldoDisponivel < 0) {
    healthScore = 'Negativo';
    healthColor = 'text-rose-400 border-rose-500/20 bg-rose-500/5';
    healthDesc = 'CRÍTICO: O saldo disponível nos bancos está negativo! Você corre o risco de pagar multas ou juros de cheque especial.';
  } else if (remainingBalance < 0) {
    healthScore = 'Déficit';
    healthColor = 'text-rose-400 border-rose-500/20 bg-rose-500/5';
    healthDesc = 'Atenção: A contagem de despesas deste mês superou suas entradas. Revise as fatias de gastos no extrato.';
  } else if (savingsRate < 10) {
    healthScore = 'Ajustável';
    healthColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    healthDesc = 'Seu caixa está positivo, mas sua fatia poupada está minguando. Reduza gastos supérfluos hoje mesmo.';
  }

  return (
    <div id="dashboard-financial-root" className="space-y-6">
      
      {/* Dynamic Alerts row (Requirement 2 & 5) */}
      {overbudgetAlerts.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl text-rose-300 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>Alerta de Orçamento: Tetos Estourados</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
            {overbudgetAlerts.map((alert) => (
              <div key={alert.categoryName} className="p-2.5 bg-slate-900/40 rounded-xl border border-rose-500/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block text-xs">{alert.categoryName}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Gasto: <b className="text-white font-mono">{formatCurrency(alert.currentSpending)}</b> de <span className="font-mono">{formatCurrency(alert.ceilingLimit)}</span>
                  </span>
                </div>
                <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md self-center shrink-0">
                  + {formatCurrency(alert.excess)} excedido
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Summary Tiles: Available Cash, Total Assets, Invested Assets (Requirement 7) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
        
        {/* TOTAL CASH NET WORTH */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Patrimônio Total</span>
            <p className="text-2xl font-black mt-0.5 font-mono">{formatCurrency(totalPatrimony)}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-medium">Contas + Poupanças + Ativos</p>
          </div>
        </div>

        {/* LIQUID AVAILABLE CASH */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Saldo Disponível</span>
            <p className={`text-2xl font-black mt-0.5 font-mono ${saldoDisponivel >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(saldoDisponivel)}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-medium">Contas correntes de todos os bancos</p>
          </div>
        </div>

        {/* BANK SAVINGS TOTAL */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Saldo Poupança</span>
            <p className="text-2xl font-black mt-0.5 font-mono text-blue-300">{formatCurrency(totalPoupançaBancos)}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-medium">Total bloqueado em poupanças</p>
          </div>
        </div>

        {/* INVESTED ACTIVE ASSETS */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-450 rounded-2xl border border-purple-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Carteira de Ativos</span>
            <p className="text-2xl font-black mt-0.5 font-mono text-purple-300">{formatCurrency(totalInvestedPortfolio)}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-medium">CDBs, Bolsa, FIIs e Criptoativos</p>
          </div>
        </div>

      </div>

      {/* GRID: BANK MANAGEMENT CARDS & CARD ALERT HISTORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMP: REGISTERED BANK CATALOG (Requirement 3) */}
        <div className="lg:col-span-8 bg-white/5 backdrop-blur-xl p-6 border border-white/10 rounded-3xl shadow-xl text-white space-y-4">
          
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Dossiê das Contas e Bancos Cadastrados
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Gerencie saldos correntes, poupanças e crédito correspondente.</p>
            </div>
            
            <button
              onClick={() => setShowAddBank(!showAddBank)}
              className="text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white hover:bg-slate-800 transition-colors px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Banco
            </button>
          </div>

          {/* New Bank Adder form */}
          {showAddBank && (
            <form onSubmit={handleCreateBankSubmit} className="p-4 bg-slate-900/40 rounded-2xl border border-indigo-500/20 space-y-3.5 text-xs">
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Registrar instituição bancária</span>
                <span className="text-indigo-400 font-mono">BRL currency sync</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nome do Banco</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú, C6..."
                    className="w-full bg-slate-950 border border-white/15 p-2 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cor do Card</label>
                  <select
                    value={bankColor}
                    onChange={(e) => setBankColor(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 p-2 rounded-lg text-white"
                  >
                    <option value="#820ad1">Roxo (Nubank)</option>
                    <option value="#ec5e1b">Laranja (Itaú)</option>
                    <option value="#cc092f">Vermelho (Bradesco)</option>
                    <option value="#135c91">Azul Escuro (Caixa)</option>
                    <option value="#06b6d4">Ciano (Inter/Neon)</option>
                    <option value="#eab308">Amarelo (Banco do Brasil)</option>
                    <option value="#334155">Cinza Metálico</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Saldo Conta Corrente (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bankAccBal}
                    onChange={(e) => setBankAccBal(e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full bg-slate-950 border border-white/15 p-2 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Saldo da Poupança (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bankSavBal}
                    onChange={(e) => setBankSavBal(e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full bg-slate-950 border border-white/15 p-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Limite do Cartão de Crédito (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bankLimit}
                    onChange={(e) => setBankLimit(e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full bg-slate-950 border border-white/15 p-2 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddBank(false)}
                  className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 text-white font-black px-3.5 py-1.5 rounded-lg"
                >
                  Registrar
                </button>
              </div>
            </form>
          )}

          {/* Edit balances modal form */}
          {editingBankId && (
            <form onSubmit={handleSaveBankBalances} className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/25 space-y-3.5 text-xs animate-none">
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Atualizar saldos do {banks.find(b => b.id === editingBankId)?.name}</span>
                <span className="text-emerald-400 text-[9px] font-bold">Modo de Segurança</span>
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1">S. Corrente (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editAccBal}
                    onChange={(e) => setEditAccBal(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 p-1.5 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1">Poupança (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editSavBal}
                    onChange={(e) => setEditSavBal(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 p-1.5 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1">L. Cartão (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 p-1.5 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setEditingBankId(null)}
                  className="bg-white/5 px-2.5 py-1 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 text-white font-bold px-3 py-1 rounded"
                >
                  Gravar Saldos
                </button>
              </div>
            </form>
          )}

          {/* Cards dynamic list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banks.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-lg min-h-[160px]"
                style={{
                  background: `linear-gradient(135deg, ${b.color}c0 0%, #1e1b4b 100%)`
                }}
              >
                {/* Visual Glow Orb */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

                <div className="flex justify-between items-start z-10">
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wide leading-none">{b.name}</h4>
                    <span className="text-[9px] text-slate-350 font-bold tracking-wider mt-1 block">CONTA FINANCEIRA</span>
                  </div>
                  
                  {/* Action tags */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEditBank(b)}
                      className="p-1 px-1.5 bg-white/10 hover:bg-white/20 rounded font-bold text-[10px] transition-all flex items-center gap-0.5 cursor-pointer border border-white/10"
                      title="Atualizar saldos deste banco"
                    >
                      <Edit2 className="w-2.5 h-2.5" /> Saldo
                    </button>
                    <button
                      onClick={() => handleDeleteBank(b.id, b.name)}
                      className="p-1 text-slate-300 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded cursor-pointer transition-colors"
                      title="Excluir banco do gerenciador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance Rows */}
                <div className="my-4 space-y-1.5 font-mono z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-200">Saldo CC / Débito:</span>
                    <span className={`text-sm font-black ${b.accountBalance >= 0 ? 'text-white' : 'text-rose-300'}`}>{formatCurrency(b.accountBalance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-300">Poupança:</span>
                    <span className="text-xs text-blue-300 font-bold">{formatCurrency(b.savingsBalance)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-[10px]">Limite do Cartão:</span>
                    <span className="text-xs font-semibold">{formatCurrency(b.creditLimit)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] text-slate-350 bg-slate-950/20 border border-white/5 py-1 px-2.5 rounded-lg self-start z-10 font-bold">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>Cartão Visa/Master Ativo</span>
                </div>
              </div>
            ))}
          </div>

          {/* GRAND TOTAL ROW */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 font-semibold text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Soma Global Financeira (Saldos Correntes + Poupanças de todos os bancos):
            </span>
            <span className="text-base font-black text-indigo-300 font-mono self-end sm:self-center">
              {formatCurrency(totalSomaBancos)}
            </span>
          </div>

          {/* QUICK ACTION: SIMULATED SALARY ACCREDITATION (Requirement 6) */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-400 animate-bounce" />
              <h4 className="text-xs font-black uppercase text-white tracking-wide">Ação Rápida: Depósito de Salário</h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal font-medium">
              Simule o dia do pagamento! Clique no botão abaixo para creditar instantaneamente seu salário mensal (<b>{formatCurrency(baseIncome)}</b>) + extras registradas na conta de sua livre escolha.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={salaryDepositBankId}
                onChange={(e) => setSalaryDepositBankId(e.target.value)}
                className="bg-slate-950 border border-white/15 p-2 rounded-xl text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="">Selecione a conta de destino...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Saldo: R$ {b.accountBalance.toFixed(2)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={triggerSalaryDeposit}
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold px-3 py-2 rounded-xl text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
              >
                <PiggyBank className="w-3.5 h-3.5" /> Recebi meu salário de {formatCurrency(baseIncome)}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COMP: CREDIT/DEBIT CARD LIVE NOTIFICATION LOG (Requirement 5 & 8) */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl p-5 border border-white/10 rounded-3xl shadow-xl text-white space-y-3 pb-4">
          
          <div className="border-b border-white/10 pb-2.5">
            <h3 className="text-sm font-bold font-displayName text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              Histórico de Notificações de Cartões
            </h3>
            <p className="text-[10px] tracking-wide text-slate-400 font-medium mt-0.5">Alertas de segurança e confirmação de compras nos bancos associados.</p>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {cardAlerts.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-semibold">
                <AlertTriangle className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                <p>Nenhum alerta de cartão registrado</p>
                <p className="text-[10px] text-slate-450 mt-1">Gaste no cartão nas abas de extrato para visualizar as compras processadas.</p>
              </div>
            ) : (
              cardAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex gap-2.5 text-[11px] transition-all ${
                    alert.type === 'warning'
                      ? 'bg-rose-500/15 border-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  <span className="text-[15px] shrink-0 self-start mt-0.5">
                    {alert.type === 'warning' ? '⚠️' : '💳'}
                  </span>
                  <div className="space-y-1">
                    <p className="leading-normal font-bold text-white pr-2">{alert.message}</p>
                    <div className="flex items-center gap-2 text-[9.5px] text-slate-400 font-mono mt-0.5">
                      <span>{alert.bankName}</span>
                      <span>•</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick history clear logs button */}
          {cardAlerts.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza de limpar o histórico de notificações de cartões do painel?')) {
                  setCardAlerts([]);
                }
              }}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors py-1.5 p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center block cursor-pointer border border-white/5"
            >
              Limpar logs
            </button>
          )}

        </div>

      </div>

      {/* CHART PLOTS COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph: Planned vs Actual limit budget: spans 7 columns */}
        <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-white">Metas Propostas vs. Gasto Líquido</h3>
                <p className="text-xs text-slate-450">Teto definido na regra 50/30/20 vs o que você de fato consumiu.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('salary')}
                className="text-xs text-indigo-300 font-bold hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Ajustar Metas
              </button>
            </div>

            {/* Bar Chart comparing ceilings */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Essenciais', 'Orçamento Planejado': Math.round(targetEssentials), 'Gasto Real': Math.round(actualEssentials) },
                  { name: 'Lazer e Desejos', 'Orçamento Planejado': Math.round(targetWants), 'Gasto Real': Math.round(actualWants) },
                  { name: 'Investimentos', 'Orçamento Planejado': Math.round(targetSavings), 'Gasto Real': Math.round(actualSavings) },
                ]} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={(v) => `R$ ${v}`} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                  <Bar dataKey="Orçamento Planejado" fill="rgba(255, 255, 255, 0.15)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gasto Real" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[10px] text-slate-450 border-t border-white/5 pt-2 italic leading-tight mt-3">
            * O monitoramento compara a receita e despesas alocadas às fatias da PoupaMais no mês.
          </p>
        </div>

        {/* Graph 2: Expense categorization breakdown: spans 5 columns */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-white border-b border-white/10 pb-3 mb-2">Despesas por Categoria</h3>
            {expenseDecomposition.length === 0 ? (
              <div className="py-20 text-center text-slate-450 text-xs">
                <p className="font-semibold">Nenhum custo cadastrado</p>
                <p className="text-[10px] text-slate-400 mt-1">Lançamentos de despesas aparecerão distribuídos por fatia de categoria aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseDecomposition}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseDecomposition.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={DASH_COLORS[index % DASH_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatCurrency(Number(val))}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-350 max-h-24 overflow-y-auto pr-1 leading-snug">
                  {expenseDecomposition.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5 truncate">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DASH_COLORS[index % DASH_COLORS.length] }}></div>
                      <span className="truncate">{item.name}:</span>
                      <span className="text-white font-bold ml-auto font-mono">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-[9.5px] text-slate-400 leading-normal border-t border-white/5 pt-2 mt-4">
            Utilizado para analisar se alimentação, moradia ou lazer está consumindo além da verba autorizada.
          </p>
        </div>

      </div>

      {/* Evolution Timeline area & Diagnostic indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Timeline area chart */}
        <div id="patrimony-evolution-timeline" className="lg:col-span-8 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-white border-b border-white/10 pb-3 mb-4">Evolução do Patrimônio Consolidado</h3>
            <p className="text-xs text-slate-450 mb-4">Curva progressiva do seu patrimônio juntando saldo disponível acumulado e investimentos.</p>
            
            <div className="h-60 font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="date" fontSize={9} stroke="#94a3b8" tickLine={false} />
                  <YAxis tickFormatter={(v) => `R$ ${v}`} fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" name="Patrimônio Consolidado" dataKey="Patrimônio Consolidado" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPat)" />
                  <Area type="monotone" name="Reservas Investidas" dataKey="Reservas Investidas" stroke="#10b981" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[10px] text-slate-450 border-t border-white/5 pt-2 italic mt-4 leading-normal">
            Os dados variam automaticamente conforme os saldos de seus bancos sobem e descem.
          </p>
        </div>

        {/* Diagnosis status block */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl border flex flex-col justify-between h-72 backdrop-blur-xl ${healthColor}`}>
            <div className="space-y-3 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <Award className="w-4 h-4" /> Diagnóstico de Finanças
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider border rounded-md px-2 py-0.5 bg-white/10 border-white/10">
                  {healthScore}
                </span>
              </div>

              <div>
                <p className="text-[10px] text-slate-350 font-bold uppercase tracking-wider leading-none">Taxa de Poupança Líquida</p>
                <p className="text-3xl font-black font-display text-white mt-1.5">{formatPercent(savingsRate)}</p>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-slate-200">
                {healthDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-300 border-t border-white/10 pt-2 font-bold cursor-pointer hover:text-white" onClick={() => setActiveTab('investments')}>
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Deseja rentabilizar mais seu capital? Planejar juros compostos.</span>
            </div>
          </div>

          {/* Progress commitments breakdowns */}
          <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 space-y-4 text-white">
            <h4 className="text-xs font-black font-display text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Percent className="w-4 h-4 text-indigo-400" /> Comprometimento de Salário
            </h4>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Gasto Total / Recursos</span>
                  <span>{totalCommittedRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-sky-400" style={{ width: `${Math.min(essentialCommitmentRate, 100)}%` }}></div>
                  <div className="h-full bg-pink-400" style={{ width: `${Math.min(wantsCommitmentRate, 100 - essentialCommitmentRate)}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-400">
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-sky-300 block">Essencial</span>
                  <span className="text-white block mt-0.5 font-mono">{essentialCommitmentRate.toFixed(0)}%</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-pink-300 block">Desejos</span>
                  <span className="text-white block mt-0.5 font-mono">{wantsCommitmentRate.toFixed(0)}%</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-emerald-300 block">Investido</span>
                  <span className="text-white block mt-0.5 font-mono">{savingsCommitmentRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
