import React, { useMemo } from 'react';
import { 
  Zap, 
  IndianRupee, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Lightbulb, 
  ArrowUpRight,
  ScanLine,
  BarChart3,
  BrainCircuit,
  Radio,
  Flame,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { BillRecord, UserProfile, PredictionResult, GeminiInsight } from '../types';
import { useSmartMeterSimulator } from '../hooks/useSmartMeterSimulator.js';

interface DashboardViewProps {
  user: UserProfile;
  bills: BillRecord[];
  prediction: PredictionResult | null;
  insight: GeminiInsight | null;
  isLoadingInsight: boolean;
  onNavigateUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  bills,
  prediction,
  insight,
  isLoadingInsight,
  onNavigateUpload,
}) => {
  // Live Smart Meter Simulator hook
  const {
    isActive: isSimulating,
    telemetry,
    history: liveHistory,
    toggleSimulation,
    resetAccumulated,
  } = useSmartMeterSimulator(false);

  const latestBill = bills[0] || { units: 0, amount: 0, tariffSlab: 'Standard' };

  // Calculate live cumulative usage when simulator is ON vs static when OFF
  const totalUnits = isSimulating 
    ? parseFloat((latestBill.units + telemetry.accumulatedKWh).toFixed(3))
    : latestBill.units;

  const budgetLimit = user.budgetLimit || 2500;
  const projectedAmount = prediction ? prediction.predictedAmount : latestBill.amount;
  const isBudgetExceeded = prediction 
    ? prediction.predictedAmount > budgetLimit 
    : latestBill.amount > budgetLimit;
  const excessAmount = Math.max(0, projectedAmount - budgetLimit);
  const budgetUsagePct = budgetLimit > 0 ? Math.min(200, Math.round((projectedAmount / budgetLimit) * 100)) : 0;

  // Chart dataset with forecast and live smooth telemetry wiring
  const chartData = useMemo(() => {
    const rawData = prediction?.monthlyHistory || [];
    if (!isSimulating || rawData.length === 0) {
      return rawData;
    }

    // Clone data and update current active billing period with live simulated consumption
    return rawData.map((item, idx) => {
      const isCurrentMonth = item.month.toLowerCase().includes('current') || 
        (!item.isForecast && idx === rawData.length - 1) ||
        (!item.isForecast && rawData[idx + 1]?.isForecast);

      if (isCurrentMonth) {
        return {
          ...item,
          units: parseFloat((item.units + telemetry.accumulatedKWh).toFixed(2)),
        };
      }
      return item;
    });
  }, [prediction?.monthlyHistory, isSimulating, telemetry.accumulatedKWh]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Energy Overview</h1>
            {isSimulating && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm animate-pulse">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                LIVE 2s STREAM
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time energy tracking for <span className="font-semibold text-emerald-600">{user.state} ({user.board})</span> • <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{user.billingCycle || 'Bi-Monthly'} Cycle</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Simulate Live Smart Meter Toggle Button */}
          <button
            onClick={toggleSimulation}
            type="button"
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer border ${
              isSimulating
                ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 ring-2 ring-emerald-500/50'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={isSimulating ? 'Stop Live Smart Meter Simulation' : 'Start Live Smart Meter Simulation'}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>Simulate Live Smart Meter</span>
            <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isSimulating ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
              <div className="bg-white w-3.5 h-3.5 rounded-full shadow-md"></div>
            </div>
          </button>

          <button
            onClick={onNavigateUpload}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm"
          >
            <ScanLine className="w-4 h-4" />
            <span>+ Scan Electricity Bill</span>
          </button>
        </div>
      </div>

      {/* Prominent Red Warning Banner when Projected Cost Exceeds Budget Limit */}
      {isBudgetExceeded && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 text-white flex-shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base tracking-tight text-white">⚠️ Budget Exceeded Warning</h3>
                <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/30 uppercase tracking-wider">
                  Critical Alert
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                Projected monthly electricity cost of <span className="font-extrabold text-white underline decoration-rose-300">₹{projectedAmount.toLocaleString('en-IN')}</span> exceeds your defined monthly budget limit of <span className="font-extrabold text-white">₹{budgetLimit.toLocaleString('en-IN')}</span> by <span className="font-extrabold text-white bg-rose-900/80 px-1.5 py-0.5 rounded">₹{excessAmount.toLocaleString('en-IN')}</span> ({budgetUsagePct}% of budget target).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-extrabold text-white bg-rose-950/70 px-3 py-1.5 rounded-xl border border-rose-400/40 whitespace-nowrap shadow-sm">
              +₹{excessAmount.toLocaleString('en-IN')} Over Budget
            </span>
          </div>
        </div>
      )}

      {/* 4 Live Smart Meter Telemetry Cards */}
      <div className={`rounded-2xl transition-all duration-300 ${
        isSimulating 
          ? 'p-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 shadow-xl shadow-emerald-950/20' 
          : 'p-5 bg-white border border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSimulating ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isSimulating ? 'text-white' : 'text-slate-900'}`}>
                  Smart Meter Telemetry Stream
                </h3>
                {isSimulating ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    2s Interval Active
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Standby (Toggle ON above)
                  </span>
                )}
              </div>
              <p className={`text-xs ${isSimulating ? 'text-slate-400' : 'text-slate-500'}`}>
                Indian Single-Phase BIS IS 16444 AMI Specification
              </p>
            </div>
          </div>
          {isSimulating && telemetry.accumulatedKWh > 0 && (
            <button
              onClick={resetAccumulated}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer transition-colors"
              title="Reset accumulated simulated kWh counter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Counter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Load (Watts) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSimulating 
              ? 'bg-slate-800/70 border-slate-700/70 text-white' 
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSimulating ? 'text-slate-400' : 'text-slate-500'}`}>
                Active Load
              </span>
              <div className={`p-1.5 rounded-lg ${isSimulating ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {telemetry.activePower.toLocaleString('en-IN')}{' '}
              <span className={`text-sm font-semibold ${isSimulating ? 'text-amber-400' : 'text-slate-500'}`}>W</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={isSimulating ? 'text-slate-400' : 'text-slate-500'}>
                {(telemetry.activePower / 1000).toFixed(2)} kW
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                telemetry.activePower > 2500 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {telemetry.activePower > 2500 ? 'High Load' : 'Normal'}
              </span>
            </div>
          </div>

          {/* Card 2: Grid Voltage (V) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSimulating 
              ? 'bg-slate-800/70 border-slate-700/70 text-white' 
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSimulating ? 'text-slate-400' : 'text-slate-500'}`}>
                Grid Voltage
              </span>
              <div className={`p-1.5 rounded-lg ${isSimulating ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {telemetry.voltage.toFixed(1)}{' '}
              <span className={`text-sm font-semibold ${isSimulating ? 'text-sky-400' : 'text-slate-500'}`}>V</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={isSimulating ? 'text-slate-400' : 'text-slate-500'}>
                Nominal 230V AC
              </span>
              <span className="text-[10px] font-medium text-sky-400">
                50 Hz Single-Phase
              </span>
            </div>
          </div>

          {/* Card 3: Current Draw (A) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSimulating 
              ? telemetry.isCompressorSpike 
                ? 'bg-rose-950/40 border-rose-500/50 text-white ring-1 ring-rose-500/50' 
                : 'bg-slate-800/70 border-slate-700/70 text-white' 
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSimulating ? 'text-slate-400' : 'text-slate-500'}`}>
                Current Draw
              </span>
              <div className={`p-1.5 rounded-lg ${
                telemetry.isCompressorSpike 
                  ? 'bg-rose-500 text-white animate-bounce' 
                  : isSimulating ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {telemetry.isCompressorSpike ? <Flame className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {telemetry.current.toFixed(2)}{' '}
              <span className={`text-sm font-semibold ${telemetry.isCompressorSpike ? 'text-rose-400' : isSimulating ? 'text-indigo-400' : 'text-slate-500'}`}>A</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={isSimulating ? 'text-slate-400' : 'text-slate-500'}>
                Range: 2.5A - 16A
              </span>
              {telemetry.isCompressorSpike ? (
                <span className="text-[10px] font-extrabold text-rose-300 bg-rose-600/40 px-1.5 py-0.5 rounded border border-rose-500/40 animate-pulse">
                  Compressor Surge
                </span>
              ) : (
                <span className="text-[10px] font-medium text-emerald-400">
                  Steady Draw
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Power Factor (PF) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSimulating 
              ? 'bg-slate-800/70 border-slate-700/70 text-white' 
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSimulating ? 'text-slate-400' : 'text-slate-500'}`}>
                Power Factor
              </span>
              <div className={`p-1.5 rounded-lg ${isSimulating ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {telemetry.powerFactor.toFixed(2)}{' '}
              <span className={`text-sm font-semibold ${isSimulating ? 'text-emerald-400' : 'text-slate-500'}`}>PF</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={isSimulating ? 'text-slate-400' : 'text-slate-500'}>
                Lagging Inductive
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                telemetry.powerFactor >= 0.95 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {telemetry.powerFactor >= 0.95 ? 'Optimal' : 'Standard'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Current Usage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">Current Usage</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight transition-all">
            {totalUnits.toLocaleString('en-IN', { minimumFractionDigits: isSimulating ? 3 : 0, maximumFractionDigits: 3 })}{' '}
            <span className="text-base font-normal text-slate-500">kWh</span>
          </p>
          {isSimulating ? (
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1.5 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0"></span>
              Live: +{telemetry.accumulatedKWh.toFixed(4)} kWh streamed
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
              Period: {latestBill.billingPeriod || 'Current'}
            </p>
          )}
        </div>

        {/* Card 2: Estimated Bill */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">Latest Billed</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{latestBill.amount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-2 truncate">
            Slab: <span className="font-medium text-slate-700">{latestBill.tariffSlab}</span>
          </p>
        </div>

        {/* Card 3: Projected Monthly Cost with Red Warning Highlight */}
        <div className={`p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
          isBudgetExceeded 
            ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20' 
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
              Projected Cost
            </span>
            <div className={`p-2 rounded-xl ${isBudgetExceeded ? 'bg-rose-500 text-white shadow-sm' : 'bg-emerald-50 text-emerald-600'}`}>
              {isBudgetExceeded ? <AlertTriangle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isBudgetExceeded ? 'text-rose-700' : 'text-slate-900'}`}>
            ₹{projectedAmount.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 flex items-center justify-between gap-1">
            {isBudgetExceeded ? (
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1 bg-rose-200/80 px-2 py-0.5 rounded-md truncate">
                ⚠️ Exceeds by ₹{excessAmount.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-md truncate">
                <CheckCircle2 className="w-3.5 h-3.5" /> Within Budget
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Monthly Budget Target & Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase">Budget Target</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{budgetLimit.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-[11px] font-semibold">
              <span className={isBudgetExceeded ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                {budgetUsagePct}% used
              </span>
              <span className={isBudgetExceeded ? 'text-rose-600 font-bold uppercase' : 'text-slate-400'}>
                {isBudgetExceeded ? 'Exceeded' : 'On Target'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${isBudgetExceeded ? 'bg-rose-600' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, budgetUsagePct)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live 2-Second Telemetry Waveform Stream (visible when simulation is active) */}
      {isSimulating && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live 2-Second Telemetry Waveform (Load & Current)
              </h3>
              <p className="text-xs text-slate-400">
                Rolling 20-tick high-frequency stream of Active Power (Watts) & Current Draw (Amperes)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active Power (W)
              </span>
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span> Current (A)
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="watts" tick={{ fontSize: 11, fill: '#10b981' }} domain={['auto', 'auto']} />
                <YAxis yAxisId="amps" orientation="right" tick={{ fontSize: 11, fill: '#38bdf8' }} domain={[0, 18]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: '1px solid #334155' }}
                  formatter={(value: any, name: any) => [
                    name === 'activePower' ? `${value} W` : `${value} A`,
                    name === 'activePower' ? 'Active Power' : 'Current Draw',
                  ]}
                />
                <Line
                  yAxisId="watts"
                  type="monotone"
                  dataKey="activePower"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Line
                  yAxisId="amps"
                  type="monotone"
                  dataKey="current"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: '#38bdf8' }}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Scikit-Learn Forecast Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Scikit-Learn AI Forecast Engine</h2>
              <p className="text-xs text-slate-500">Linear regression model analyzing historical energy trends</p>
            </div>
          </div>
          {prediction && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              {prediction.confidencePct}% Model Confidence
            </span>
          )}
        </div>

        {prediction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Predicted Usage Next Month</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {prediction.predictedUnits} <span className="text-sm font-normal text-slate-600">units</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl border transition-all ${
                isBudgetExceeded 
                  ? 'bg-rose-100/70 border-rose-300 text-rose-950' 
                  : 'bg-emerald-50/60 border-emerald-200/60 text-slate-900'
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Forecasted Payable Cost</p>
                  {isBudgetExceeded && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      <AlertTriangle className="w-3 h-3" /> Exceeds Budget
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-extrabold mt-0.5 ${isBudgetExceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                  ₹{prediction.predictedAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Smart Budget Warning Logic */}
            {prediction.predictedAmount > budgetLimit ? (
              <div className="bg-rose-50 border-2 border-rose-500 p-4 rounded-xl text-rose-950 shadow-sm relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-600 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-rose-950">⚠️ High Cost Warning: Monthly Budget Exceeded</h4>
                      <span className="text-[10px] font-extrabold bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full border border-rose-300">
                        +₹{excessAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      Your forecasted electricity bill (<strong className="font-extrabold text-rose-950">₹{prediction.predictedAmount.toLocaleString('en-IN')}</strong>) is higher than your set monthly budget target of <strong className="font-extrabold text-rose-950">₹{budgetLimit.toLocaleString('en-IN')}</strong>.
                    </p>
                    <p className="text-[11px] text-rose-800 font-medium pt-1.5 border-t border-rose-200">
                      💡 Energy Saving Advice: Shift heavy cooling or peak appliances outside peak tariff hours to reduce consumption and keep expenses under ₹{budgetLimit.toLocaleString('en-IN')}.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-900 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>✅ On track! Forecasted bill (₹{prediction.predictedAmount.toLocaleString('en-IN')}) stays safely under your ₹{budgetLimit.toLocaleString('en-IN')} budget limit.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Gathering historical data points to generate prediction...</p>
        )}
      </div>

      {/* Gemini AI Insight Card */}
      <div className="bg-gradient-to-br from-sky-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✨ Gemini AI Smart Energy Insight
              </h3>
              <p className="text-xs text-sky-200">Server-side Generative Intelligence for Tariff Optimization</p>
            </div>
          </div>
          {insight?.estimatedSavings && (
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-sky-500/20 text-sky-300 text-xs font-medium rounded-full border border-sky-400/30">
              Potential Savings: {insight.estimatedSavings}
            </span>
          )}
        </div>

        {isLoadingInsight ? (
          <div className="animate-pulse space-y-3 py-4">
            <div className="h-4 bg-sky-800/50 rounded w-3/4"></div>
            <div className="h-4 bg-sky-800/50 rounded w-1/2"></div>
          </div>
        ) : insight ? (
          <div className="space-y-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              {insight.summary}
            </p>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
              <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> Recommended Action Items
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                {insight.actionPoints?.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Unable to generate insight at this moment.</p>
        )}
      </div>

      {/* Energy Usage Timeline Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Energy Usage Timeline & AI Forecast
            </h3>
            <p className="text-xs text-slate-500">
              {isSimulating 
                ? 'Historical kWh consumption updated live with simulated smart meter increments' 
                : 'Historical kWh consumption versus projected AI forecast'}
            </p>
          </div>
          {isSimulating && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          )}
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                formatter={(value: any, name: any) => [`${value} kWh`, name === 'units' ? 'Consumption' : name]}
              />
              <Line 
                type="monotone" 
                dataKey="units" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 7 }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
