import React, { useState } from 'react';
import { ActiveInvestment, InvestmentContribution, Bank } from '../types';
import { formatCurrency } from '../utils';
import {
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  PlusCircle,
  Trash2,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Coins,
  History,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Scale
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface InvestmentPlannerProps {
  activeInvestments: ActiveInvestment[];
  onAddInvestment: (inv: Omit<ActiveInvestment, 'id'>) => void;
  onDeleteInvestment: (id: string) => void;
  onUpdateInvestment: (id: string, updated: ActiveInvestment) => void;
  banks?: Bank[];
  setBanks?: React.Dispatch<React.SetStateAction<Bank[]>>;
}

export default function InvestmentPlanner({
  activeInvestments,
  onAddInvestment,
  onDeleteInvestment,
  onUpdateInvestment,
  banks = [],
  setBanks,
}: InvestmentPlannerProps) {
  // Simulator State
  const [initial, setInitial] = useState(1000);
  const [monthly, setMonthly] = useState(200);
  const [rate, setRate] = useState(11.5); // % annual 
  const [years, setYears] = useState(10);

  // Active Portfolio Adder State
  const [invName, setInvName] = useState('');
  const [invType, setInvType] = useState<ActiveInvestment['type']>('CDB/Pós-fixados');
  const [invAmount, setInvAmount] = useState('');
  const [invYield, setInvYield] = useState('');
  const [invYieldType, setInvYieldType] = useState<'percentage' | 'fixed'>('percentage');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);

  // Expandable individual asset id
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  // Quick states for adding an aporte
  const [newAporteAmount, setNewAporteAmount] = useState('');
  const [newAporteDate, setNewAporteDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAporteNotes, setNewAporteNotes] = useState('');

  // Redeeming (resgate) states
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemBankId, setRedeemBankId] = useState('');

  // Quick state for updating Current Valuation
  const [updatedValuationMap, setUpdatedValuationMap] = useState<Record<string, string>>({});

  // Calculations for passive portfolio summary
  const totalAppliedPortfolio = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  
  const totalValueWithReturn = activeInvestments.reduce((sum, i) => {
    return sum + (i.currentValue !== undefined ? i.currentValue : i.amount);
  }, 0);

  const totalGains = totalValueWithReturn - totalAppliedPortfolio;
  const totalYieldPercentage = totalAppliedPortfolio > 0 ? (totalGains / totalAppliedPortfolio) * 100 : 0;

  // Handle active portfolio submits
  const handleAddInvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(invAmount);
    const yld = parseFloat(invYield) || 0;
    if (!invName.trim() || isNaN(amt) || amt <= 0) return;

    onAddInvestment({
      name: invName.trim(),
      type: invType,
      amount: amt,
      yieldRate: yld,
      yieldType: invYieldType,
      datePurchased: invDate,
      currentValue: amt,
      contributions: [
        {
          id: `cont_${Date.now()}`,
          amount: amt,
          date: invDate,
          notes: 'Aporte Inicial de Abertura',
        },
      ],
    });

    setInvName('');
    setInvAmount('');
    setInvYield('');
  };

  // Add a contribution (aporte) to an existing asset
  const handleAddContribution = (asset: ActiveInvestment) => {
    const amt = parseFloat(newAporteAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Insira um valor de aporte extra válido!');
      return;
    }

    const newCont: InvestmentContribution = {
      id: `cont_${Date.now()}`,
      amount: amt,
      date: newAporteDate,
      notes: newAporteNotes.trim() || 'Aporte Extra Realizado',
    };

    const updatedContributions = [...(asset.contributions || []), newCont];
    const newAppliedTotal = asset.amount + amt;
    const currentValCopy = asset.currentValue !== undefined ? asset.currentValue + amt : newAppliedTotal;

    onUpdateInvestment(asset.id, {
      ...asset,
      amount: newAppliedTotal,
      currentValue: currentValCopy,
      contributions: updatedContributions,
    });

    setNewAporteAmount('');
    setNewAporteNotes('');
  };

  // Redeem / Liquidate investment asset back to bank accounts
  const handleRedeemAsset = (asset: ActiveInvestment) => {
    const amt = parseFloat(redeemAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Insira um valor de resgate válido!');
      return;
    }
    const currentVal = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
    if (amt > currentVal) {
      alert(`Você não pode resgatar R$ ${amt.toFixed(2)} pois o valor atualizado deste ativo é R$ ${currentVal.toFixed(2)}.`);
      return;
    }
    if (!redeemBankId) {
      alert('Selecione primeiro qual banco receberá os fundos resgatados!');
      return;
    }

    // 1. Process credit deposit on selected Bank
    if (setBanks) {
      setBanks((prev) =>
        prev.map((b) => {
          if (b.id === redeemBankId) {
            return {
              ...b,
              accountBalance: b.accountBalance + amt,
            };
          }
          return b;
        })
      );
    }

    // 2. Adjust investment asset
    const remainingVal = currentVal - amt;
    if (remainingVal === 0) {
      onDeleteInvestment(asset.id);
      alert(`🎉 Ativo ${asset.name} foi liquidado na totalidade! R$ ${amt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi depositado com sucesso no seu banco.`);
    } else {
      const remainingApplied = Math.max(0, asset.amount - amt);
      onUpdateInvestment(asset.id, {
        ...asset,
        amount: remainingApplied,
        currentValue: remainingVal,
        contributions: [
          ...(asset.contributions || []),
          {
            id: `cont_red_${Date.now()}`,
            amount: -amt,
            date: new Date().toISOString().split('T')[0],
            notes: 'Resgate Líquido para Conta',
          },
        ],
      });
      alert(`🎉 Resgate parcial de R$ ${amt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} efetuado com sucesso! Saldo creditado e ativo reajustado.`);
    }

    setRedeemAmount('');
    setRedeemBankId('');
  };

  // Update current market value manually
  const handleUpdateValuation = (asset: ActiveInvestment) => {
    const newValuationStr = updatedValuationMap[asset.id];
    const newValuation = parseFloat(newValuationStr);
    
    if (isNaN(newValuation) || newValuation < 0) {
      alert('Insira uma cotação de mercado válida!');
      return;
    }

    onUpdateInvestment(asset.id, {
      ...asset,
      currentValue: newValuation,
    });

    setUpdatedValuationMap((prev) => ({ ...prev, [asset.id]: '' }));
    alert('Valor de mercado atualizado com sucesso! Veja o cálculo de rentabilidade atualizado.');
  };

  // Quick autofill for Simulator using actual portfolio stats 
  const handleAutofillSimulatorFromPortfolio = () => {
    if (activeInvestments.length === 0) {
      alert('Cadastre primeiro alguns ativos na sua carteira para simular com base neles!');
      return;
    }

    let weightedRateSum = 0;
    activeInvestments.forEach((i) => {
      if (i.yieldType === 'percentage') {
        const weight = i.amount / (totalAppliedPortfolio || 1);
        weightedRateSum += i.yieldRate * weight;
      }
    });

    setInitial(Math.round(totalValueWithReturn));
    if (weightedRateSum > 0) {
      setRate(Math.round(weightedRateSum * 100) / 100);
    }
    alert('Dados carregados! Simulador atualizado com seu saldo atual e taxa ponderada da sua carteira.');
  };

  // Run Simulation compounding calculations
  const calculateCompoundInterestResults = (
    initialAmt: number,
    monthlyAmt: number,
    annualPct: number,
    numYears: number
  ) => {
    const results = [];
    const monthlyRate = Math.pow(1 + annualPct / 100, 1 / 12) - 1;
    const totalMonths = numYears * 12;

    let currentValue = initialAmt;
    let totalInvested = initialAmt;

    results.push({
      month: 0,
      year: 0,
      totalInvested: Math.round(totalInvested),
      totalInterest: 0,
      totalValue: Math.round(currentValue),
    });

    for (let m = 1; m <= totalMonths; m++) {
      const interest = currentValue * monthlyRate;
      currentValue += interest;

      currentValue += monthlyAmt;
      totalInvested += monthlyAmt;

      const shouldSave =
        numYears <= 3 ||
        (numYears <= 10 && m % 3 === 0) ||
        (numYears > 10 && m % 6 === 0) ||
        m === totalMonths;

      if (shouldSave) {
        results.push({
          month: m,
          year: Math.floor(m / 12),
          totalInvested: Math.round(totalInvested),
          totalInterest: Math.round(currentValue - totalInvested),
          totalValue: Math.round(currentValue),
        });
      }
    }
    return results;
  };

  const simulationData = calculateCompoundInterestResults(initial, monthly, rate, years);
  const finalSnapshot = simulationData[simulationData.length - 1] || {
    totalValue: 0,
    totalInvested: 0,
    totalInterest: 0,
  };

  // Group portfolio assets by asset categories
  const portfolioGrouped = activeInvestments.reduce((acc, inv) => {
    const matched = acc.find((item) => item.name === inv.type);
    const valueToAdd = inv.currentValue !== undefined ? inv.currentValue : inv.amount;
    
    if (matched) {
      matched.value += valueToAdd;
    } else {
      acc.push({ name: inv.type, value: valueToAdd });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

  return (
    <div id="investment-planner-extended-root" className="space-y-6 animate-none">
      
      {/* Portfolio overview banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Invested */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Valor Aplicado (Nominal)</span>
            <p className="text-xl font-black text-white leading-tight font-mono mt-0.5">{formatCurrency(totalAppliedPortfolio)}</p>
            <p className="text-[10px] text-slate-400 font-medium">Soma histórica de todos os seus aportes</p>
          </div>
        </div>

        {/* Current Valuation estimation */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <LineIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Valor de Mercado (Equity)</span>
            <p className="text-xl font-black text-white leading-tight font-mono mt-0.5">{formatCurrency(totalValueWithReturn)}</p>
            <p className="text-[10px] text-slate-400 font-medium">Saldo consolidado investido recalculado</p>
          </div>
        </div>

        {/* Global profit yield marker */}
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg flex items-center gap-4">
          <div className={`p-3 rounded-2xl border ${totalGains >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border-rose-500/20'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Rentabilidade Consolidada</span>
            <p className={`text-xl font-black leading-tight font-mono mt-0.5 ${totalGains >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalGains >= 0 ? '+' : ''}
              {formatCurrency(totalGains)} ({totalGains >= 0 ? '+' : ''}
              {totalYieldPercentage.toFixed(2)}%)
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Ganhos de juros e dividendos líquidos</p>
          </div>
        </div>
      </div>

      {/* Grid: Simulator on left, Portfolio tracker on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COMPOUND SIMULATOR */}
        <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/10 space-y-5 text-white flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Simulador de Crescimento Exponencial
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Projete sua segurança e juros compostos a longo prazo.</p>
              </div>
              <button
                type="button"
                onClick={handleAutofillSimulatorFromPortfolio}
                className="text-[10px] text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-lg font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Auto-carregar Carteira
              </button>
            </div>

            {/* Inputs sliders / entries */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] text-slate-450 uppercase mb-1">Aporte Inicial</label>
                <div className="relative rounded-lg">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-[11px]">R$</span>
                  <input
                    type="number"
                    value={initial}
                    onChange={(e) => setInitial(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="block w-full bg-slate-950 border border-white/10 rounded-lg p-2 pl-7 font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-455 uppercase mb-1">Aporte Mensal</label>
                <div className="relative rounded-lg">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-[11px]">R$</span>
                  <input
                    type="number"
                    value={monthly}
                    onChange={(e) => setMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="block w-full bg-slate-950 border border-white/10 rounded-lg p-2 pl-7 font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-455 uppercase mb-1">Rendimento (a.a. %)</label>
                <div className="relative rounded-lg">
                  <input
                    type="number"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="block w-full bg-slate-950 border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none pr-5 text-emerald-400"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-455 uppercase mb-1">Prazo (Anos)</label>
                <div className="relative rounded-lg">
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Math.max(1, Math.min(45, parseInt(e.target.value) || 1)))}
                    className="block w-full bg-slate-950 border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none pr-8 text-indigo-400"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2 flex items-center text-[10px] text-slate-450 font-bold">Anos</span>
                </div>
              </div>
            </div>

            {/* Results snapshot */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900/40 border border-white/10 rounded-xl p-3 mt-4 text-xs font-semibold">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Total ao Final</span>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{formatCurrency(finalSnapshot.totalValue)}</p>
              </div>
              <div className="border-l border-white/15 pl-2.5">
                <span className="text-[9px] uppercase font-bold text-slate-400">Total Nominal</span>
                <p className="text-base font-black text-slate-205 font-mono mt-0.5">{formatCurrency(finalSnapshot.totalInvested)}</p>
              </div>
              <div className="border-l border-white/15 pl-2.5">
                <span className="text-[9px] uppercase font-bold text-slate-400">Lucro Estimado</span>
                <p className="text-base font-black text-indigo-400 font-mono mt-0.5">{formatCurrency(finalSnapshot.totalInterest)}</p>
              </div>
            </div>

            {/* Area capital growth display */}
            <div className="h-56 mt-4 font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m) => (m === 0 ? 'Início' : m % 12 === 0 ? `Ano ${m / 12}` : '')}
                    fontSize={9}
                    stroke="#94a3b8"
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    fontSize={9}
                    stroke="#94a3b8"
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), '']}
                    labelFormatter={(lbl) => `Mês ocorrido: ${lbl}`}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    name="Projeção Acumulada"
                    dataKey="totalValue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    name="Total Principal Poupado"
                    dataKey="totalInvested"
                    stroke="#6366f1"
                    strokeWidth={1}
                    fill="none"
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic flex items-center gap-1 leading-normal border-t border-white/5 pt-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            Metodologia baseada na regra exponencial PoupaMais sobre depósitos constantes.
          </p>
        </div>

        {/* PORTFOLIO ENTRY & ASSETS DIRECTORY */}
        <div className="lg:col-span-5 flex flex-col gap-5 text-white">
          
          {/* Asset entry form */}
          <div className="bg-white/5 backdrop-blur-xl p-5 border border-white/10 rounded-3xl shadow-lg space-y-3.5">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <PlusCircle className="w-4 h-4 text-emerald-400 animate-spin-slow" /> Registrar Novo Ativo comprado
            </h3>
 
            <form onSubmit={handleAddInvSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nome Fantasia do Ativo</label>
                <input
                  type="text"
                  required
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="Ex: Tesouro Selic 2029, Itaú SA (ITUB4)..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none placeholder-slate-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tipo de Investimento</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="CDB/Pós-fixados" className="bg-slate-800 text-white">Renda Fixa / CDB</option>
                    <option value="Ações" className="bg-slate-800 text-white">Ações Bolsa (B3)</option>
                    <option value="FIIs" className="bg-slate-800 text-white">FII (Imobiliário)</option>
                    <option value="Tesouro Direto" className="bg-slate-800 text-white">Tesouro Direto</option>
                    <option value="Poupança" className="bg-slate-800 text-white">Poupança</option>
                    <option value="Cripto" className="bg-slate-800 text-white">Criptoativos</option>
                    <option value="Outros" className="bg-slate-800 text-white">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Rentabilidade Alva</label>
                  <div className="relative rounded-xl">
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={invYield}
                      onChange={(e) => setInvYield(e.target.value)}
                      placeholder="11.5%, CDB 120%"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none font-extrabold placeholder-slate-500 pr-12 text-indigo-400"
                    />
                    <select
                      value={invYieldType}
                      onChange={(e) => setInvYieldType(e.target.value as any)}
                      className="absolute right-1 top-1 bg-slate-800 border-none outline-none font-bold text-[9px] p-1.5 rounded-lg text-slate-300"
                    >
                      <option value="percentage">% a.a.</option>
                      <option value="fixed">R$ fixo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Aporte Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 font-bold text-white focus:outline-none placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Data de Compra</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl hover:bg-emerald-400 transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                Gravar no Portfólio
              </button>
            </form>
          </div>

          {/* Portfolio visualization list */}
          <div className="bg-white/5 backdrop-blur-xl p-5 border border-white/10 rounded-3xl shadow-lg flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-emerald-400" /> Ativos Cadastrados
                </h3>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {activeInvestments.length} Ativo(s)
                </span>
              </div>

              {activeInvestments.length === 0 ? (
                <div className="py-12 text-center text-slate-450 text-xs font-semibold">
                  <p className="font-semibold text-slate-350">Nenhum ativo cadastrado na carteira</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Adicione seus fundos imobiliários, fundos de previdência, ações ou CDBs no formulário acima para automatizar o seu patrimônio financeiro.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recharts Pie representation */}
                  <div className="h-40 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolioGrouped}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={48}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {portfolioGrouped.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => formatCurrency(Number(v))}
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px', borderRadius: '8px' }}
                        />
                        <Legend
                          iconSize={6}
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', paddingTop: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* List of active elements with accordion (history, aportes, manual quotation, redemptions back to bank cards) */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {activeInvestments.map((inv) => {
                      const isExpanded = expandedAssetId === inv.id;
                      const applied = inv.amount;
                      const valuation = inv.currentValue !== undefined ? inv.currentValue : applied;
                      const yieldAbsolute = valuation - applied;
                      const yieldPct = applied > 0 ? (yieldAbsolute / applied) * 100 : 0;

                      return (
                        <div
                          key={inv.id}
                          className="flex flex-col p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-xs"
                        >
                          {/* Top row */}
                          <div className="flex items-center justify-between">
                            <div
                              onClick={() => {
                                setExpandedAssetId(isExpanded ? null : inv.id);
                                // Reset redeem inputs on toggle
                                setRedeemAmount('');
                                setRedeemBankId('');
                              }}
                              className="flex items-center gap-2 cursor-pointer flex-1"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                              <div>
                                <h4 className="font-bold text-white leading-tight">{inv.name}</h4>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                                  <span>{inv.type}</span>
                                  <span>•</span>
                                  <span className="text-indigo-300 font-bold">
                                    {inv.yieldRate}{inv.yieldType === 'percentage' ? '%' : ' R$'} {inv.yieldType === 'percentage' ? 'a.a.' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className="font-bold font-mono text-white block">{formatCurrency(valuation)}</span>
                                <span className={`text-[9.5px] font-bold block leading-none mt-0.5 ${yieldAbsolute >= 0 ? 'text-emerald-405' : 'text-rose-455'}`}>
                                  {yieldAbsolute >= 0 ? '+' : ''}{yieldPct.toFixed(1)}%
                                </span>
                              </div>
                              <button
                                onClick={() => onDeleteInvestment(inv.id)}
                                className="p-1 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                title="Remover este ativo em absoluto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded accordion block */}
                          {isExpanded && (
                            <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-3.5 bg-slate-900/40 p-3 rounded-lg border border-white/5 text-[11px] font-semibold">
                              {/* Valuation update */}
                              <div className="space-y-1">
                                <span className="block text-[10px] text-slate-300 font-extrabold uppercase tracking-wide">Cotação do Ativo (Market Value)</span>
                                <div className="flex gap-1.5">
                                  <div className="relative rounded-lg flex-1">
                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] text-slate-400">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Definir cotação de mercado..."
                                      value={updatedValuationMap[inv.id] || ''}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setUpdatedValuationMap((prev) => ({ ...prev, [inv.id]: v }));
                                      }}
                                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 pl-6 text-white text-[11px] font-bold focus:outline-none"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateValuation(inv)}
                                    className="bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg font-bold text-[10px]"
                                  >
                                    Cotas
                                  </button>
                                </div>
                              </div>

                              {/* Aporte Extra Form */}
                              <div className="space-y-1.5 text-[10px]">
                                <span className="block text-[10px] text-slate-300 font-extrabold uppercase tracking-wide">Efetuar Aporte Complementar</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-slate-450 block mb-0.5">Valor do Aporte R$</label>
                                    <input
                                      type="number"
                                      placeholder="R$ 0,00"
                                      value={newAporteAmount}
                                      onChange={(e) => setNewAporteAmount(e.target.value)}
                                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-1 text-white text-xs font-bold focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-slate-455 block mb-0.5">Data da Operação</label>
                                    <input
                                      type="date"
                                      value={newAporteDate}
                                      onChange={(e) => setNewAporteDate(e.target.value)}
                                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-1 text-white text-[10px] focus:outline-none font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-1.5 mt-1">
                                  <input
                                    type="text"
                                    placeholder="Obs do aporte extra..."
                                    value={newAporteNotes}
                                    onChange={(e) => setNewAporteNotes(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-1.5 text-[10px] text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddContribution(inv)}
                                    className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-extrabold"
                                  >
                                    Aportar
                                  </button>
                                </div>
                              </div>

                              {/* LIQUIDATE / REDEEM ACTIVE TO BANK CARD (New linked requirement) */}
                              {banks.length > 0 && (
                                <div className="space-y-1.5 border-t border-white/5 pt-2 text-[10px]">
                                  <span className="block text-[10px] text-rose-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                                    <Coins className="w-3.5 h-3.5" /> Liquidar / Resgatar Capital Ativo
                                  </span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-slate-400 block mb-0.5">Valor a Resgatar (R$)</label>
                                      <input
                                        type="number"
                                        placeholder="R$ 0,00"
                                        value={redeemAmount}
                                        onChange={(e) => setRedeemAmount(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-1 text-rose-400 font-bold focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-slate-400 block mb-0.5">Depositar no Banco</label>
                                      <select
                                        value={redeemBankId}
                                        onChange={(e) => setRedeemBankId(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-1 text-white focus:outline-none"
                                      >
                                        <option value="">Escolha destino...</option>
                                        {banks.map((b) => (
                                          <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRedeemAsset(inv)}
                                    className="w-full bg-rose-500/20 text-rose-300 border border-rose-500/25 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-rose-500/35 transition-all text-center block mt-1.5 cursor-pointer"
                                  >
                                    Confirmar Resgate para Conta Bancária
                                  </button>
                                </div>
                              )}

                              {/* Historical view */}
                              <div className="space-y-1 pt-1.5 border-t border-white/5">
                                <span className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wide flex items-center gap-1">
                                  <History className="w-3 h-3" /> Histórico ocorridos
                                </span>
                                <div className="max-h-24 overflow-y-auto space-y-1 text-[9.5px]">
                                  {(inv.contributions || []).map((cont, idx) => (
                                    <div key={cont.id || idx} className="flex justify-between items-center p-1.5 bg-slate-950/40 rounded border border-white/5 text-slate-300">
                                      <div>
                                        <span className={`font-bold block ${cont.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(cont.amount)}</span>
                                        <span className="text-slate-450 italic block leading-none mt-0.5">{cont.notes || 'Aporte Extra'}</span>
                                      </div>
                                      <span className="text-slate-400 font-mono">{new Date(cont.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
