import React, { useState } from 'react';
import { Transaction, Bank } from '../types';
import { formatCurrency } from '../utils';
import {
  Trash2,
  Edit3,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Inbox,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Notebook,
  Repeat,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onSelectEditTransaction: (tx: Transaction) => void;
  editingTransactionId?: string;
  banks?: Bank[];
}

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  onSelectEditTransaction,
  editingTransactionId,
  banks = [],
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [allocationFilter, setAllocationFilter] = useState<'todos' | 'essentials' | 'wants' | 'savings'>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');

  // Expanded transactional row state to toggle notes/details
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Helper to resolve associated Bank Name
  const getBankName = (bankId?: string) => {
    if (!bankId) return null;
    const found = banks.find((b) => b.id === bankId);
    return found ? found.name : null;
  };

  // Dynamic lists of years/months present in the transactions
  const monthOptions = Array.from(
    new Set(
      transactions.map((t) => {
        const parts = t.date.split('-'); // YYYY-MM-DD
        return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '';
      })
    )
  )
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a)); // Newest months first

  // Filter main dataset
  const filteredTransactions = transactions.filter((t) => {
    const bankName = getBankName(t.bankId) || '';
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'todos' || t.type === typeFilter;

    const matchesAllocation =
      allocationFilter === 'todos' ||
      (t.type === 'despesa' && t.allocationCategory === allocationFilter);

    const matchesMonth =
      selectedMonth === 'todos' || t.date.startsWith(selectedMonth);

    return matchesSearch && matchesType && matchesAllocation && matchesMonth;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Nenhuma transação disponível para exportação com os filtros atuais.');
      return;
    }

    const headers = [
      'ID',
      'Descrição',
      'Valor (R$)',
      'Tipo (Receita/Despesa)',
      'Categoria',
      'Banco Originador',
      'Alocação',
      'Data de Lançamento',
      'Forma de Pagamento',
      'Despesa Recorrente (Sim/Não)',
      'Observações'
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.type === 'receita' ? 'Receita' : 'Despesa',
      `"${t.category}"`,
      `"${getBankName(t.bankId) || 'Nenhum'}"`,
      t.type === 'receita' ? 'Entrada' : t.allocationCategory,
      t.date,
      `"${t.paymentMethod || 'Pix'}"`,
      t.isRecurring ? 'Sim' : 'Não',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM representation for Excel
      [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PoupaMais_Relatorio_${selectedMonth === 'todos' ? 'Geral' : selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable screen trigger
  const handlePrintReport = () => {
    window.print();
  };

  // Group aggregates for active filtered set
  const totalInflow = filteredTransactions
    .filter((t) => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = filteredTransactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  return (
    <div id="transaction-list-root" className="space-y-4">
      {/* Printable report header */}
      <div className="hidden print:block bg-white text-slate-900 p-8 rounded-none space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900">PoupaMais Financeiro</h1>
            <p className="text-xs text-slate-500">Relatório Consolidado de Mensalidades & Despesas</p>
          </div>
          <p className="text-sm font-bold text-slate-800">
            Período: {selectedMonth === 'todos' ? 'Todo o Histórico' : selectedMonth}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Receitas Totais</span>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalInflow)}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Despesas Totais</span>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(totalOutflow)}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Saldo Líquido</span>
            <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Primary list filter dashboard */}
      <div id="list-card-container" className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/10 flex flex-col text-white print:hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold font-display text-white">
              Histórico de Lançamentos
            </h3>
            <p className="text-xs text-slate-300">
              Gerencie receitas e gastos por banco originador. Clique em uma linha para ver observações do lançamento.
            </p>
          </div>

          {/* Export and Print actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-sm hover:bg-emerald-500/20"
              title="Exportar dados filtrados no formato Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-sm hover:bg-indigo-500/20"
              title="Gerar PDF para impressão oficial"
            >
              <FileText className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Inputs and filters panel */}
        <div className="space-y-4 my-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="Pesquisar por nome, categoria, banco ou notas..."
              />
            </div>

            {/* Selected Month criteria */}
            <div className="md:col-span-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-sm text-white focus:outline-none transition-all font-semibold"
              >
                <option value="todos" className="bg-slate-800 text-white">Todos os Meses</option>
                {monthOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-800 text-white">
                    {new Date(opt + '-05').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', timeZone: 'UTC' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick type Selection */}
            <div className="md:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-sm text-white focus:outline-none transition-all font-semibold"
              >
                <option value="todos" className="bg-slate-800 text-white">Fluxo: Todos</option>
                <option value="receita" className="bg-slate-800 text-white">Fluxo: Receita</option>
                <option value="despesa" className="bg-slate-800 text-white">Fluxo: Despesa</option>
              </select>
            </div>
          </div>

          {/* Allocation fatias Segment */}
          {typeFilter !== 'receita' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Fatias 50/30/20:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllocationFilter('todos')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                    allocationFilter === 'todos'
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Todas as Fatias
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationFilter('essentials')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                    allocationFilter === 'essentials'
                      ? 'border-sky-500/30 bg-sky-500/20 text-sky-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Essenciais (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationFilter('wants')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                    allocationFilter === 'wants'
                      ? 'border-pink-500/30 bg-pink-500/20 text-pink-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Desejos (30%)
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationFilter('savings')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                    allocationFilter === 'savings'
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Investimentos (20%)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Aggregate balance boxes */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 mb-4 font-semibold">
          <div>
            Entradas Período: <span className="font-mono font-bold text-emerald-400 block sm:inline">{formatCurrency(totalInflow)}</span>
          </div>
          <div className="border-l border-white/10 pl-3">
            Gastos Período: <span className="font-mono font-bold text-rose-450 block sm:inline">{formatCurrency(totalOutflow)}</span>
          </div>
          <div className="border-l border-white/10 pl-3">
            Saldo Período: <span className={`font-mono font-bold block sm:inline ${netBalance >= 0 ? 'text-blue-405 font-extrabold' : 'text-rose-455 font-extrabold'}`}>{formatCurrency(netBalance)}</span>
          </div>
        </div>

        {/* Scrollable list box */}
        <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-dashed border-white/10 my-2 p-6">
              <Inbox className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-slate-300">Nenhum resultado de busca encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste os filtros de pesquisa ou insira novos dados e receitas no formulário.
              </p>
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const isIncome = t.type === 'receita';
              const isExpanded = expandedTxId === t.id;
              const isBeingEdited = editingTransactionId === t.id;
              const originBank = getBankName(t.bankId);

              return (
                <div
                  key={t.id}
                  className={`flex flex-col p-3.5 rounded-2xl border transition-all ${
                    isBeingEdited
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/5'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  {/* Primary row */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => setExpandedTxId(isExpanded ? null : t.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 user-select-none"
                    >
                      {/* Flow Indicator Icon */}
                      <div className={`p-2 rounded-lg shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-slate-300'}`}>
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white font-display leading-snug flex items-center gap-1.5">
                          {t.description}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-400 font-medium">
                          <span>
                            {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                          
                          {originBank && (
                            <>
                              <span>•</span>
                              <span className="text-[9.5px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                🏦 {originBank}
                              </span>
                            </>
                          )}

                          <span>•</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md font-semibold text-slate-300">
                            {t.category}
                          </span>
                          {!isIncome && (
                            <>
                              <span>•</span>
                              <span
                                className={`text-[9px] font-bold uppercase py-0.5 px-1.5 rounded-sm ${
                                  t.allocationCategory === 'essentials'
                                    ? 'bg-sky-500/15 text-sky-300'
                                    : t.allocationCategory === 'wants'
                                    ? 'bg-pink-500/15 text-pink-300'
                                    : 'bg-emerald-500/15 text-emerald-300'
                                  }`}
                              >
                                {t.allocationCategory === 'essentials'
                                  ? 'Essencial'
                                  : t.allocationCategory === 'wants'
                                  ? 'Desejo'
                                  : 'Futuro'}
                              </span>
                            </>
                          )}
                          {t.isRecurring && (
                            <span className="bg-rose-500/20 text-rose-300 text-[9px] font-extrabold uppercase py-0.5 px-1.5 rounded-sm">
                              Recorrente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right shrink-0">
                      <div>
                        <span
                          className={`text-sm font-bold font-mono ${
                            isIncome ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectEditTransaction(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-colors cursor-pointer"
                          title="Editar lançamento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir lançamento permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable details segment */}
                  {isExpanded && (
                    <div className="mt-3 bg-white/5 p-3 rounded-xl border border-white/10 leading-relaxed text-xs font-semibold text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Método de Pagamento:</span>
                          <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-bold uppercase">
                            {t.paymentMethod || 'Pix'}
                          </span>
                        </div>
                        {originBank && (
                          <div className="flex items-center gap-2">
                            <span>Banco Vinculado:</span>
                            <span className="text-emerald-400 bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                              {originBank}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Periodicidade:</span>
                          <span className="text-white bg-slate-800 px-2 py-0.5 rounded font-bold">
                            {t.isRecurring ? 'Recorrente Mensal' : 'Lançamento Único'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 select-all">
                        <span className="flex items-center gap-1.5 text-indigo-300">
                          <Notebook className="w-3.5 h-3.5" /> Notas da Transação:
                        </span>
                        <p className="text-[11px] text-slate-400 font-normal leading-normal italic pl-5">
                          {t.notes ? `"${t.notes}"` : 'Sem anotações vinculadas.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Print representation styles */}
      <div className="hidden print:block bg-white text-slate-900 border mt-4 p-4 rounded-none">
        <h3 className="text-sm font-black border-b pb-2 text-slate-800 uppercase mb-4">Detalhamento dos Lançamentos</h3>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b text-slate-500 font-bold">
              <th className="py-2">Data</th>
              <th className="py-2">Descrição</th>
              <th className="py-2">Banco Originador</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Forma de Pagamento</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="py-2 font-bold select-all">
                  {t.description} {t.isRecurring ? '(Recorrente)' : ''}
                </td>
                <td className="py-2">{getBankName(t.bankId) || 'Nenhum'}</td>
                <td className="py-2">{t.category}</td>
                <td className="py-2">{t.paymentMethod || 'Pix'}</td>
                <td className={`py-2 text-right font-mono font-bold ${t.type === 'receita' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 text-center text-[10px] text-slate-400 border-t pt-4">
          Gerado pelo consolidar PoupaMais Finanças de forma automática.
        </div>
      </div>
    </div>
  );
}
