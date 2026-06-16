/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, SalaryConfig, ActiveInvestment } from './types';

// Format dynamic currency values to BRL format
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format percentages
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

// Calculate compound interest month-by-month
export interface SimulationResult {
  month: number;
  year: number;
  totalInvested: number;
  totalInterest: number;
  totalValue: number;
}

export function simulateCompoundInterest(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
): SimulationResult[] {
  const results: SimulationResult[] = [];
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const totalMonths = years * 12;

  let currentValue = initial;
  let totalInvested = initial;

  // Add month 0
  results.push({
    month: 0,
    year: 0,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalInterest: 0,
    totalValue: Math.round(currentValue * 100) / 100,
  });

  for (let m = 1; m <= totalMonths; m++) {
    // Add monthly interest
    const interest = currentValue * monthlyRate;
    currentValue += interest;

    // Add monthly deposit
    currentValue += monthly;
    totalInvested += monthly;

    // Save annual snapshots or major milestones (e.g., every year, and the final month)
    // To make a beautiful readable chart, let's include every month or every year.
    // If years <= 5, include all months. If >5, include every 3 months.
    const shouldSave =
      years <= 3 ||
      (years <= 10 && m % 3 === 0) ||
      (years > 10 && m % 6 === 0) ||
      m === totalMonths;

    if (shouldSave) {
      results.push({
        month: m,
        year: Math.floor(m / 12),
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalInterest: Math.round((currentValue - totalInvested) * 100) / 100,
        totalValue: Math.round(currentValue * 100) / 100,
      });
    }
  }

  return results;
}

// Standard categories with predefined colors and icons
export const CATEGORY_DETAILS: Record<string, { color: string; bg: string; allocation: 'essentials' | 'wants' | 'savings' }> = {
  // Essentials
  'Moradia': { color: 'text-blue-600', bg: 'bg-blue-100', allocation: 'essentials' },
  'Alimentação': { color: 'text-amber-600', bg: 'bg-amber-100', allocation: 'essentials' },
  'Transporte': { color: 'text-cyan-600', bg: 'bg-cyan-100', allocation: 'essentials' },
  'Saúde': { color: 'text-emerald-600', bg: 'bg-emerald-100', allocation: 'essentials' },
  'Educação': { color: 'text-indigo-600', bg: 'bg-indigo-100', allocation: 'essentials' },
  'Contas/Serviços': { color: 'text-rose-600', bg: 'bg-rose-100', allocation: 'essentials' },
  
  // Wants
  'Lazer/Hobby': { color: 'text-violet-600', bg: 'bg-violet-100', allocation: 'wants' },
  'Compras': { color: 'text-purple-600', bg: 'bg-purple-100', allocation: 'wants' },
  'Viagens': { color: 'text-teal-600', bg: 'bg-teal-100', allocation: 'wants' },
  'Restaurantes': { color: 'text-pink-600', bg: 'bg-pink-100', allocation: 'wants' },
  'Assinaturas': { color: 'text-slate-600', bg: 'bg-slate-100', allocation: 'wants' },
  
  // Savings
  'CDB/Renda Fixa': { color: 'text-emerald-700', bg: 'bg-emerald-50', allocation: 'savings' },
  'Ações/Bolsa': { color: 'text-green-600', bg: 'bg-green-100', allocation: 'savings' },
  'FIIs': { color: 'text-blue-700', bg: 'bg-blue-50', allocation: 'savings' },
  'Criptoativos': { color: 'text-orange-600', bg: 'bg-orange-100', allocation: 'savings' },
  'Reserva Emergência': { color: 'text-lime-600', bg: 'bg-lime-100', allocation: 'savings' },
  'Outros Investimentos': { color: 'text-teal-700', bg: 'bg-teal-50', allocation: 'savings' }
};

export const ALLOCATION_NAMES = {
  essentials: {
    label: 'Necessidades Essenciais',
    description: 'Moradia, alimentação, contas básicas, transporte e saúde.',
    color: 'bg-sky-500',
    textColor: 'text-sky-600',
    borderColor: 'border-sky-200'
  },
  wants: {
    label: 'Desejos Pessoais',
    description: 'Lazer, compras, jantares fora, viagens e estilo de vida.',
    color: 'bg-pink-500',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200'
  },
  savings: {
    label: 'Investimentos & Futuro',
    description: 'Reserva de emergência, investimentos de longo prazo e poupança.',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200'
  }
};
