import React, { useState, useEffect } from 'react';
import { Transaction, CustomCategory, Bank } from '../types';
import { ALLOCATION_NAMES } from '../utils';
import {
  PlusCircle,
  Tag,
  ArrowUpLeft,
  ArrowDownRight,
  Layers,
  Sparkles,
  CreditCard,
  Notebook,
  Repeat,
  FolderPlus,
  AlertTriangle,
  X,
  UserCheck
} from 'lucide-react';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, updated: Transaction) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  customCategories: CustomCategory[];
  onAddCustomCategory: (category: CustomCategory) => void;
  banks?: Bank[];
}

const PAYMENT_METHODS = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto Bancário',
  'Transferência (TED/DOC)'
];

export default function TransactionForm({
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  setEditingTransaction,
  customCategories,
  onAddCustomCategory,
  banks = [],
}: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('');
  const [allocationCategory, setAllocationCategory] = useState<'essentials' | 'wants' | 'savings'>('essentials');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // New transaction attributes
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [bankId, setBankId] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Custom Category quick adder modal / inline state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAllocation, setNewCatAllocation] = useState<'essentials' | 'wants' | 'savings'>('essentials');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [catFormError, setCatFormError] = useState('');

  // Dynamically filter categories matching type
  const activeCategories = customCategories.filter((c) => c.type === type);

  // Synchronize when editing changes
  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAllocationCategory(editingTransaction.allocationCategory);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod || 'Pix');
      setBankId(editingTransaction.bankId || '');
      setNotes(editingTransaction.notes || '');
      setIsRecurring(editingTransaction.isRecurring || false);
    } else {
      setDescription('');
      setAmount('');
      setType('despesa');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Pix');
      setBankId(banks[0]?.id || '');
      setNotes('');
      setIsRecurring(false);
    }
  }, [editingTransaction, banks]);

  // Handle category fallback lists matching selected type
  useEffect(() => {
    if (!editingTransaction) {
      if (activeCategories.length > 0) {
        setCategory(activeCategories[0].name);
      } else {
        setCategory(type === 'receita' ? 'Salário' : 'Outros');
      }
    }
  }, [type, customCategories, editingTransaction]);

  // Adjust allocation auto-category when selected category changes
  useEffect(() => {
    if (type === 'receita') {
      setAllocationCategory('essentials');
      return;
    }
    const matched = customCategories.find((c) => c.name === category);
    if (matched) {
      setAllocationCategory(matched.allocation);
    }
  }, [category, type, customCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const payload = {
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      allocationCategory,
      date,
      paymentMethod,
      bankId: paymentMethod !== 'Dinheiro' ? (bankId || undefined) : undefined,
      notes: notes.trim(),
      isRecurring,
    };

    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, {
        ...payload,
        id: editingTransaction.id,
      });
      setEditingTransaction(null);
    } else {
      onAddTransaction(payload);
    }

    // Reset standard states
    setDescription('');
    setAmount('');
    setNotes('');
    setIsRecurring(false);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError('');

    if (!newCatName.trim()) {
      setCatFormError('Insira um nome válido para a categoria.');
      return;
    }

    // Prevent duplicates
    const duplicated = customCategories.some(
      (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase() && c.type === type
    );

    if (duplicated) {
      setCatFormError('Esta categoria já existe para este tipo.');
      return;
    }

    const limitVal = parseFloat(newCatLimit);
    onAddCustomCategory({
      name: newCatName.trim(),
      type: type,
      allocation: type === 'receita' ? 'essentials' : newCatAllocation,
      limit: isNaN(limitVal) || limitVal <= 0 ? undefined : limitVal,
    });

    // Populate newly created category instantly
    setCategory(newCatName.trim());
    setNewCatName('');
    setNewCatLimit('');
    setShowCategoryForm(false);
  };

  return (
    <div id="transaction-form-box" className="space-y-4">
      {/* Principal Card */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 text-white relative">
        {editingTransaction && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setEditingTransaction(null)}
              className="p-1 px-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-white/10 cursor-pointer"
            >
              <X className="w-3 h-3" /> Cancelar Edição
            </button>
          </div>
        )}

        <h3 className="text-base font-bold font-display text-white mb-4 flex items-center gap-2">
          {editingTransaction ? (
            <Sparkles className="w-5 h-5 text-amber-400" />
          ) : (
            <PlusCircle className="w-5 h-5 text-indigo-400" />
          )}
          {editingTransaction ? 'Editar Lançamento' : 'Lançar Nova Transação'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Type button */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              type="button"
              disabled={!!editingTransaction}
              onClick={() => setType('despesa')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'despesa'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-40'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Despesa / Gasto
            </button>
            <button
              type="button"
              disabled={!!editingTransaction}
              onClick={() => setType('receita')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'receita'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-40'
              }`}
            >
              <ArrowUpLeft className="w-4 h-4" />
              Receita / Entrada
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Valor (R$)
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-400 font-semibold text-xs">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-white font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all placeholder-slate-500 text-sm"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-white font-medium focus:border-indigo-500 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição / Título do Lançamento
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3.5 text-white font-medium focus:border-indigo-500 focus:outline-none text-sm transition-all placeholder-slate-500"
              placeholder="Ex: Supermercado Carioca, Prestação Carro, Netflix..."
            />
          </div>

          {/* Category Dropdown & Custom Category Adder inline trigger */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categoria
              </label>
              <button
                type="button"
                onClick={() => {
                  setCatFormError('');
                  setShowCategoryForm(!showCategoryForm);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Criar categoria personalizada"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Nova Categoria
              </button>
            </div>

            {/* Inline add category card */}
            {showCategoryForm && (
              <div className="p-4 bg-slate-800 rounded-2xl border border-indigo-500/30 space-y-3 shadow-md">
                <h4 className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Criar Categoria para {type === 'receita' ? 'Receitas' : 'Despesas'}</span>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </h4>

                {catFormError && (
                  <p className="text-[10px] text-rose-400 font-semibold bg-rose-950/20 p-1.5 rounded-md">
                    {catFormError}
                  </p>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Nome da Categoria
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ex: Pets, Consultas, Streaming..."
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                    />
                  </div>

                  {type === 'despesa' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                        Estilo de Alocação (Regra 50/30/20)
                      </label>
                      <select
                        value={newCatAllocation}
                        onChange={(e) => setNewCatAllocation(e.target.value as any)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                      >
                        <option value="essentials">Necessidades Fundamentais (50%)</option>
                        <option value="wants">Lazer / Desejos Pessoais (30%)</option>
                        <option value="savings">Investimentos / Futuro (20%)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Teto de Orçamentos (Limite Mensal - Opcional)
                    </label>
                    <input
                      type="number"
                      value={newCatLimit}
                      onChange={(e) => setNewCatLimit(e.target.value)}
                      placeholder="Ex: R$ 300 (Deixa em branco se ilimitado)"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="w-full bg-indigo-500 text-white font-bold p-2 rounded-lg text-center"
                  >
                    Salvar Categoria
                  </button>
                </div>
              </div>
            )}

            <div className="relative rounded-xl">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-white font-medium focus:border-indigo-500 focus:outline-none text-sm transition-all"
              >
                {activeCategories.map((cat) => (
                  <option key={`${cat.name}_${cat.type}`} value={cat.name} className="bg-slate-800 text-white">
                    {cat.name} {cat.limit ? `(Limite: R$ ${cat.limit})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Recurring Option */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forma de Pagamento */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-white font-medium focus:border-indigo-500 focus:outline-none text-sm transition-all"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-slate-800 text-white">
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Banco Vinculado */}
            {paymentMethod !== 'Dinheiro' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Banco da Transação
                </label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-white font-medium focus:border-indigo-500 focus:outline-none text-sm transition-all"
                  required
                >
                  <option value="" className="bg-slate-800 text-slate-400">Escolha o banco...</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-800 text-white">
                      {b.name} (Saldo: R$ {b.accountBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recorrente vs Avulsa */}
            {type === 'despesa' && (
              <div className={paymentMethod === 'Dinheiro' ? '' : 'md:col-span-2'}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" /> Periodicidade
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsRecurring(false)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      !isRecurring
                        ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Despesa Avulsa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(true)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      isRecurring
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-400/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Despesa fixa recorrente todos os meses"
                  >
                    Despesa Fixa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Observations / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Notebook className="w-3.5 h-3.5 text-indigo-400" /> Observações / Anotações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-white font-medium focus:border-indigo-500 focus:outline-none text-xs transition-all placeholder-slate-500 min-h-[50px] max-h-[100px]"
              placeholder="Adicione notas rápidas ou justificativas sobre este gasto..."
            />
          </div>

          {/* Dynamic rule allocation panel (Only shown for expenditures) */}
          {type === 'despesa' && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Impacto na Regra de Orçamento
              </span>
              <div className="flex gap-2">
                {(['essentials', 'wants', 'savings'] as const).map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setAllocationCategory(cat)}
                    className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center cursor-pointer ${
                      allocationCategory === cat
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow shadow-indigo-500/20'
                        : 'bg-transparent text-slate-400 border-dashed border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {ALLOCATION_NAMES[cat].label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Vinculado a: <b>{ALLOCATION_NAMES[allocationCategory].label}</b>.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white font-black py-3 px-4 rounded-xl hover:bg-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all uppercase tracking-wider text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {editingTransaction ? 'Salvar Edições' : 'Gravar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
