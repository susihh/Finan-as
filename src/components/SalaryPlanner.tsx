import React, { useState, useEffect } from 'react';
import { Transaction, SalaryConfig, Extra, Bank } from '../types';
import { formatCurrency, ALLOCATION_NAMES } from '../utils';
import { Plus, Minus, Info, Calculator, Sparkles, Trash2, Edit2, Coins, Calendar, Tag, Check } from 'lucide-react';

interface SalaryPlannerProps {
  salaryConfig: SalaryConfig;
  setSalaryConfig: (config: SalaryConfig) => void;
  transactions: Transaction[];
  extras?: Extra[];
  onAddExtra?: (extra: Omit<Extra, 'id'>) => void;
  onUpdateExtra?: (id: string, updated: Extra) => void;
  onDeleteExtra?: (id: string) => void;
  banks?: Bank[];
  onReceiveSalary?: (bankId: string) => void;
}

export default function SalaryPlanner({
  salaryConfig,
  setSalaryConfig,
  transactions,
  extras = [],
  onAddExtra,
  onUpdateExtra,
  onDeleteExtra,
  banks = [],
  onReceiveSalary,
}: SalaryPlannerProps) {
  const [baseInput, setBaseInput] = useState(salaryConfig.baseSalary.toString());

  // Extras total sum calculation
  const totalExtrasAmount = extras.reduce((sum, e) => sum + e.amount, 0);
  const totalSalary = salaryConfig.baseSalary + totalExtrasAmount;

  // Add Extra Form State
  const [extraName, setExtraName] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [extraDate, setExtraDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Extra Mode State
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editExtraName, setEditExtraName] = useState('');
  const [editExtraAmount, setEditExtraAmount] = useState('');
  const [editExtraDate, setEditExtraDate] = useState('');

  // Sync general salary with parents when baseInput changes
  const handleUpdateSalary = (baseVal: number) => {
    setSalaryConfig({
      ...salaryConfig,
      baseSalary: baseVal,
      otherIncomes: totalExtrasAmount, // synchronize sum of extras automatically
    });
  };

  // Sync extra sum into otherIncomes whenever extras length/totals change
  useEffect(() => {
    setSalaryConfig({
      ...salaryConfig,
      otherIncomes: totalExtrasAmount,
    });
  }, [totalExtrasAmount]);

  // Submit new extra
  const handleAddExtraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(extraAmount);
    if (!extraName.trim() || isNaN(val) || val <= 0) {
      alert('Preencha os valores de renda extra corretamente.');
      return;
    }
    if (onAddExtra) {
      onAddExtra({
        description: extraName.trim(),
        amount: val,
        date: extraDate,
      });
    }
    setExtraName('');
    setExtraAmount('');
    setExtraDate(new Date().toISOString().split('T')[0]);
  };

  // Submit updated extra
  const handleSaveEditExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(editExtraAmount);
    if (!editExtraName.trim() || isNaN(val) || val <= 0 || !editingExtraId) {
      alert('Valores inválidos.');
      return;
    }
    if (onUpdateExtra) {
      onUpdateExtra(editingExtraId, {
        id: editingExtraId,
        description: editExtraName.trim(),
        amount: val,
        date: editExtraDate,
      });
    }
    setEditingExtraId(null);
  };

  // Start edit extra trigger
  const triggerEditExtra = (ext: Extra) => {
    setEditingExtraId(ext.id);
    setEditExtraName(ext.description);
    setEditExtraAmount(ext.amount.toString());
    setEditExtraDate(ext.date);
  };

  // Adjust percentages ensuring total is 100%
  const adjustPercentage = (category: 'essentials' | 'wants' | 'savings', change: number) => {
    let ess = salaryConfig.essentialsPercent;
    let wnt = salaryConfig.wantsPercent;
    let svg = salaryConfig.savingsPercent;

    if (category === 'essentials') {
      const newEss = Math.max(0, Math.min(100, ess + change));
      const diff = newEss - ess;
      if (wnt + svg > 0) {
        const wantsRatio = wnt / (wnt + svg || 1);
        wnt = Math.max(0, Math.round((wnt - diff * wantsRatio) * 10) / 10);
        svg = Math.max(0, Math.round((100 - newEss - wnt) * 10) / 10);
      } else {
        wnt = Math.max(0, Math.min(100, (100 - newEss) / 2));
        svg = Math.max(0, 100 - newEss - wnt);
      }
      ess = newEss;
    } else if (category === 'wants') {
      const newWnt = Math.max(0, Math.min(100, wnt + change));
      const diff = newWnt - wnt;
      if (ess + svg > 0) {
        const essentialsRatio = ess / (ess + svg || 1);
        ess = Math.max(0, Math.round((ess - diff * essentialsRatio) * 10) / 10);
        svg = Math.max(0, Math.round((100 - newWnt - ess) * 10) / 10);
      } else {
        ess = Math.max(0, Math.min(100, (100 - newWnt) / 2));
        svg = Math.max(0, 100 - newWnt - ess);
      }
      wnt = newWnt;
    } else {
      const newSvg = Math.max(0, Math.min(100, svg + change));
      const diff = newSvg - svg;
      if (ess + wnt > 0) {
        const essentialsRatio = ess / (ess + wnt || 1);
        ess = Math.max(0, Math.round((ess - diff * essentialsRatio) * 10) / 10);
        wnt = Math.max(0, Math.round((100 - newSvg - ess) * 10) / 10);
      } else {
        ess = Math.max(0, Math.min(100, (100 - newSvg) / 2));
        wnt = Math.max(0, 100 - newSvg - ess);
      }
      svg = newSvg;
    }

    const currentSum = ess + wnt + svg;
    if (currentSum !== 100) {
      const delta = 100 - currentSum;
      svg = Math.max(0, Math.round((svg + delta) * 10) / 10);
    }

    setSalaryConfig({
      ...salaryConfig,
      essentialsPercent: Math.round(ess),
      wantsPercent: Math.round(wnt),
      savingsPercent: Math.round(svg),
    });
  };

  const applyPreset = (ess: number, wnt: number, svg: number) => {
    setSalaryConfig({
      ...salaryConfig,
      essentialsPercent: ess,
      wantsPercent: wnt,
      savingsPercent: svg,
    });
  };

  // Compute actual expenditures in each category
  const actualExpenses = transactions
    .filter((t) => t.type === 'despesa')
    .reduce(
      (acc, t) => {
        acc[t.allocationCategory] = (acc[t.allocationCategory] || 0) + t.amount;
        return acc;
      },
      { essentials: 0, wants: 0, savings: 0 } as Record<'essentials' | 'wants' | 'savings', number>
    );

  const budgetLimits = {
    essentials: (totalSalary * salaryConfig.essentialsPercent) / 100,
    wants: (totalSalary * salaryConfig.wantsPercent) / 100,
    savings: (totalSalary * salaryConfig.savingsPercent) / 100,
  };

  return (
    <div id="salary-planner-container" className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/10">
        <div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">
            Fatiamento de Rendas
          </span>
          <h2 className="text-2xl font-bold font-display text-white mt-1.5">
            Gestão de Salário e Extras
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
            Configure seu salário líquido e adicione faturamentos extras. O montante será distribuído dinamicamente na regra de orçamento 50/30/20.
          </p>
        </div>
        <div className="flex items-center gap-2 text-indigo-300 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-xs">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>Fórmula ativa PoupaMais: <b>50%</b> Essencial, <b>30%</b> Lazer, <b>20%</b> Poupança</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Base Salary Input & Extras List (Spans 5 columns) */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2 border-b border-white/10 pb-2.5">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Minhas Receitas Mensais
            </h3>

            {/* Base wage */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Salário Base Mensal Líquido (R$)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-slate-400 font-bold text-xs">R$</span>
                </div>
                <input
                  type="number"
                  value={baseInput}
                  onChange={(e) => {
                    setBaseInput(e.target.value);
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateSalary(val);
                  }}
                  className="block w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-white font-bold placeholder-slate-400 focus:border-indigo-500 focus:outline-none text-sm transition-all"
                  placeholder="0,00"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">Seu salário líquido fixo regular creditado.</p>
            </div>

            {/* REGISTERED EXTRAS LIST (Requirement 1) */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Rendas Extras & Freelas
                </label>
                <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-500/10 px-2 rounded-md">
                  Total: {formatCurrency(totalExtrasAmount)}
                </span>
              </div>

              {/* Dynamic editing form for extras */}
              {editingExtraId ? (
                <form onSubmit={handleSaveEditExtra} className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-white uppercase block">Atualizar Extra</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={editExtraName}
                      onChange={(e) => setEditExtraName(e.target.value)}
                      placeholder="Descrição do extra..."
                      className="bg-slate-950 p-1.5 rounded border border-white/10 text-white text-[11px]"
                    />
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={editExtraAmount}
                      onChange={(e) => setEditExtraAmount(e.target.value)}
                      placeholder="Valor R$..."
                      className="bg-slate-950 p-1.5 rounded border border-white/10 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <input
                      type="date"
                      required
                      value={editExtraDate}
                      onChange={(e) => setEditExtraDate(e.target.value)}
                      className="bg-slate-950 p-1 rounded border border-white/10 text-white text-[10px] font-mono"
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setEditingExtraId(null)} className="bg-white/10 text-[10px] px-2 py-1 rounded">Cancelar</button>
                      <button type="submit" className="bg-amber-500 text-[10px] font-bold text-slate-950 px-2 py-1 rounded">Salvar</button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Dynamic creation form for extras */
                <form onSubmit={handleAddExtraSubmit} className="grid grid-cols-1 gap-2.5 bg-slate-900/40 p-3 rounded-2xl border border-white/5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        value={extraName}
                        onChange={(e) => setExtraName(e.target.value)}
                        placeholder="Ex: Freela Logo, Bônus, Venda..."
                        className="w-full bg-slate-950 p-2 rounded-lg border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                        <span className="text-slate-400 font-bold text-[10px]">R$</span>
                      </div>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={extraAmount}
                        onChange={(e) => setExtraAmount(e.target.value)}
                        placeholder="R$ Valor..."
                        className="w-full bg-slate-950 py-2 pl-7 pr-2 rounded-lg border border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="date"
                      required
                      value={extraDate}
                      onChange={(e) => setExtraDate(e.target.value)}
                      className="bg-slate-950 p-1.5 rounded-lg border border-white/10 text-white text-[10px] font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-500 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Extra
                    </button>
                  </div>
                </form>
              )}

              {/* List table of active extras */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {extras.length === 0 ? (
                  <p className="text-[10px] text-slate-450 italic text-center py-4">Nenhuma renda extra cadastrada neste mês.</p>
                ) : (
                  extras.map((ext) => (
                    <div key={ext.id} className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block truncate max-w-[120px]">{ext.description}</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1.5">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>{new Date(ext.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-300 font-extrabold">{formatCurrency(ext.amount)}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => triggerEditExtra(ext)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="Editar renda extra"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteExtra && onDeleteExtra(ext.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Deletar renda extra"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Consolidated Income Display Card */}
          <div className="bg-indigo-950/30 border border-white/10 text-white p-4 rounded-2xl relative overflow-hidden mt-6">
            <span className="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider">Recursos Totais Consolidados (Fatiados)</span>
            <p className="text-2xl font-black mt-1 font-mono tracking-tight">{formatCurrency(totalSalary)}</p>
            <p className="text-[9px] text-slate-400 leading-tight mt-1 font-medium">Salário base fixo + soma de todas as rendas extras lançadas no mês.</p>
          </div>

          <div className="pt-2">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Presetações Rápidas de Percentual</h4>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(50, 30, 20)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                  salaryConfig.essentialsPercent === 50 &&
                  salaryConfig.wantsPercent === 30 &&
                  salaryConfig.savingsPercent === 20
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-450 border-white/10 hover:bg-white/10'
                }`}
              >
                50/30/20
              </button>
              <button
                type="button"
                onClick={() => applyPreset(60, 20, 20)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                  salaryConfig.essentialsPercent === 60 &&
                  salaryConfig.wantsPercent === 20 &&
                  salaryConfig.savingsPercent === 20
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-450 border-white/10 hover:bg-white/10'
                }`}
              >
                60/20/20
              </button>
              <button
                type="button"
                onClick={() => applyPreset(40, 30, 30)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                  salaryConfig.essentialsPercent === 40 &&
                  salaryConfig.wantsPercent === 30 &&
                  salaryConfig.savingsPercent === 30
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-450 border-white/10 hover:bg-white/10'
                }`}
              >
                40/30/30
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Salary Split visualizers (Spans 7 columns) */}
        <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold font-display text-white">
              Cálculo Dinâmico dos Limites Fatiados
            </h3>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-lg">
              Soma: 100%
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Essentials Row */}
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 rounded-full h-2 bg-sky-400 animate-pulse"></div>
                    <span className="font-bold text-white text-xs">
                      {ALLOCATION_NAMES.essentials.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal font-medium">
                    {ALLOCATION_NAMES.essentials.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-black text-sky-400 text-lg">
                    {salaryConfig.essentialsPercent}%
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    Limite: {formatCurrency(budgetLimits.essentials)}
                  </div>
                </div>
              </div>

              {/* Dynamic Adjuster Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustPercentage('essentials', -5)}
                  className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                  disabled={salaryConfig.essentialsPercent <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${salaryConfig.essentialsPercent}%` }}
                  ></div>
                </div>
                <button
                  type="button"
                  onClick={() => adjustPercentage('essentials', 5)}
                  className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                  disabled={salaryConfig.essentialsPercent >= 100}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real Spend Tracker indicator */}
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Incorrido:</span>
                  <span>
                    {formatCurrency(actualExpenses.essentials)} de{' '}
                    {formatCurrency(budgetLimits.essentials)}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      actualExpenses.essentials > budgetLimits.essentials
                        ? 'bg-rose-500'
                        : 'bg-sky-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        budgetLimits.essentials > 0
                          ? (actualExpenses.essentials / budgetLimits.essentials) * 100
                          : 0
                      )}%`,
                    }}
                  ></div>
                </div>
                {actualExpenses.essentials > budgetLimits.essentials && (
                  <p className="text-[10px] font-semibold text-rose-455 flex items-center gap-1 mt-1 leading-none">
                    <Info className="w-3 h-3 shrink-0" />
                    Você estourou seu orçamento para necessidades essenciais!
                  </p>
                )}
              </div>
            </div>

            {/* Wants Row */}
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 rounded-full h-2 bg-pink-400 animate-pulse"></div>
                    <span className="font-bold text-white text-xs">
                      {ALLOCATION_NAMES.wants.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal font-medium">
                    {ALLOCATION_NAMES.wants.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-black text-pink-400 text-lg">
                    {salaryConfig.wantsPercent}%
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    Limite: {formatCurrency(budgetLimits.wants)}
                  </div>
                </div>
              </div>

              {/* Dynamic Adjuster Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustPercentage('wants', -5)}
                  className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                  disabled={salaryConfig.wantsPercent <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-400 transition-all duration-300"
                    style={{ width: `${salaryConfig.wantsPercent}%` }}
                  ></div>
                </div>
                <button
                  type="button"
                  onClick={() => adjustPercentage('wants', 5)}
                  className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                  disabled={salaryConfig.wantsPercent >= 100}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real Spend Tracker indicator */}
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Incorrido:</span>
                  <span>
                    {formatCurrency(actualExpenses.wants)} de{' '}
                    {formatCurrency(budgetLimits.wants)}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      actualExpenses.wants > budgetLimits.wants ? 'bg-rose-500' : 'bg-pink-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        budgetLimits.wants > 0
                          ? (actualExpenses.wants / budgetLimits.wants) * 100
                          : 0
                      )}%`,
                    }}
                  ></div>
                </div>
                {actualExpenses.wants > budgetLimits.wants && (
                  <p className="text-[10px] font-semibold text-rose-455 flex items-center gap-1 mt-1 leading-none">
                    <Info className="w-3 h-3 shrink-0" />
                    Você ultrapassou a verba limite definida para desejos e compras!
                  </p>
                )}
              </div>
            </div>

            {/* Savings Row */}
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 rounded-full h-2 bg-emerald-400 animate-pulse"></div>
                    <span className="font-bold text-white text-xs">
                      {ALLOCATION_NAMES.savings.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal font-medium">
                    {ALLOCATION_NAMES.savings.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-400 text-lg">
                    {salaryConfig.savingsPercent}%
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    Limite: {formatCurrency(budgetLimits.savings)}
                  </div>
                </div>
              </div>

              {/* Dynamic Adjuster Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustPercentage('savings', -5)}
                  className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                  disabled={salaryConfig.savingsPercent <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${salaryConfig.savingsPercent}%` }}
                  ></div>
                </div>
                <button
                  type="button"
                  onClick={() => adjustPercentage('savings', 5)}
                  className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                  disabled={salaryConfig.savingsPercent >= 100}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real Spend Tracker indicator */}
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Atual Aplicado:</span>
                  <span>
                    {formatCurrency(actualExpenses.savings)} /{' '}
                    {formatCurrency(budgetLimits.savings)}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        budgetLimits.savings > 0
                          ? (actualExpenses.savings / budgetLimits.savings) * 100
                          : 0
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[10px] font-medium text-slate-450 leading-snug pt-1 border-t border-white/10">
                  Economize esse valor mensal recomendado e aporte em simulações na aba <b>Simular</b>!
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
