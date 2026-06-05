'use client';

import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================
interface P2PTransferFormProps {
    userId: string;
    userBalance: number;
    onTransferComplete: () => void;
}

interface TransferResult {
    success: boolean;
    error?: string;
    receiver_name?: string;
    receiver_carnet?: string;
    amount?: number;
    new_balance?: number;
}

// ============================================
// UGB Carnet pattern: 2-5 uppercase + 4-8 digits
// ============================================
const UGB_CARNET_REGEX = /^[A-Z]{2,5}\d{4,8}$/;

// ============================================
// Component
// ============================================
export default function P2PTransferForm({
    userId,
    userBalance,
    onTransferComplete,
}: P2PTransferFormProps) {
    const [carnet, setCarnet] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<TransferResult | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // ------------------------------------------
    // Validations
    // ------------------------------------------
    const parsedAmount = parseInt(amount, 10) || 0;
    const normalizedCarnet = carnet.trim().toUpperCase();
    const isValidCarnet = UGB_CARNET_REGEX.test(normalizedCarnet);
    const isValidAmount = parsedAmount > 0 && parsedAmount <= userBalance;
    const canSubmit = isValidCarnet && isValidAmount && !isProcessing;

    // ------------------------------------------
    // Execute the transfer via Supabase RPC
    // ------------------------------------------
    const executeTransfer = useCallback(async () => {
        setIsProcessing(true);
        setResult(null);

        try {
            const { data, error } = await supabase.rpc('execute_p2p_transfer', {
                sender_uuid: userId,
                target_carnet: normalizedCarnet,
                amount: parsedAmount,
            });

            if (error) {
                setResult({
                    success: false,
                    error: error.message || 'Error de conexión con la base de datos.',
                });
            } else {
                const res = data as TransferResult;
                setResult(res);
                if (res.success) {
                    setCarnet('');
                    setAmount('');
                    onTransferComplete();
                }
            }
        } catch {
            setResult({
                success: false,
                error: 'Error inesperado. Verifica tu conexión.',
            });
        } finally {
            setIsProcessing(false);
            setShowConfirm(false);
        }
    }, [userId, normalizedCarnet, parsedAmount, onTransferComplete]);

    // ------------------------------------------
    // Reset form
    // ------------------------------------------
    const resetForm = () => {
        setResult(null);
        setShowConfirm(false);
    };

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00a859] to-[#00c965] flex items-center justify-center text-xl shadow-lg shadow-[#00a859]/20">
                    💸
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">
                        Transferir Eco-Puntos
                    </h3>
                    <p className="text-[11px] text-gray-500">
                        Envía puntos a otro estudiante UGB
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {/* Success state */}
                {result?.success ? (
                    <div className="text-center py-4 space-y-4 animate-in">
                        <div className="w-16 h-16 mx-auto rounded-full bg-[#00a859]/20 flex items-center justify-center text-3xl">
                            ✅
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">
                                ¡Transferencia Exitosa!
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                <span className="text-[#00a859] font-bold">
                                    {result.amount} puntos
                                </span>{' '}
                                enviados a{' '}
                                <span className="text-white font-semibold">
                                    {result.receiver_name}
                                </span>
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                🪪 {result.receiver_carnet}
                            </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                                Tu nuevo saldo
                            </p>
                            <p className="text-2xl font-bold text-[#00a859]">
                                {result.new_balance} ⭐
                            </p>
                        </div>
                        <button
                            onClick={resetForm}
                            className="text-sm text-[#00a859] hover:text-[#00c965] font-medium transition-colors"
                        >
                            Hacer otra transferencia →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Balance indicator */}
                        <div className="flex items-center justify-between bg-gray-800/40 rounded-xl px-4 py-2.5 border border-gray-700/40">
                            <span className="text-xs text-gray-400">Tu saldo disponible</span>
                            <span className="font-bold text-[#00a859] text-sm">
                                {userBalance} ⭐
                            </span>
                        </div>

                        {/* Carnet input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Carnet del Receptor
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                    🪪
                                </span>
                                <input
                                    type="text"
                                    value={carnet}
                                    onChange={(e) => {
                                        setCarnet(e.target.value.toUpperCase());
                                        setResult(null);
                                    }}
                                    placeholder="SMSS141122"
                                    maxLength={13}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859]/30 transition-colors"
                                    disabled={isProcessing}
                                />
                                {carnet.length > 0 && (
                                    <span
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                                            isValidCarnet
                                                ? 'text-[#00a859]'
                                                : 'text-red-400'
                                        }`}
                                    >
                                        {isValidCarnet ? '✓ Válido' : '✕ Formato'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Amount input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Cantidad de Eco-Puntos
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                    ⭐
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setResult(null);
                                    }}
                                    placeholder="0"
                                    min={1}
                                    max={userBalance}
                                    className="w-full pl-10 pr-20 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859]/30 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    disabled={isProcessing}
                                />
                                {/* Quick amount buttons */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    {[10, 50, 100].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                setAmount(
                                                    String(Math.min(q, userBalance))
                                                );
                                                setResult(null);
                                            }}
                                            disabled={userBalance < q || isProcessing}
                                            className="px-2 py-1 text-[10px] font-bold rounded-md bg-gray-700/60 text-gray-300 hover:bg-[#00a859]/20 hover:text-[#00a859] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {parsedAmount > userBalance && (
                                <p className="text-red-400 text-[11px] mt-1">
                                    Supera tu saldo disponible de {userBalance} puntos
                                </p>
                            )}
                        </div>

                        {/* Error message */}
                        {result && !result.success && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                                <span className="text-red-400 text-sm mt-0.5">⚠️</span>
                                <p className="text-red-300 text-xs leading-relaxed">
                                    {result.error}
                                </p>
                            </div>
                        )}

                        {/* Confirmation step */}
                        {showConfirm ? (
                            <div className="bg-[#00a859]/10 border border-[#00a859]/30 rounded-xl p-4 space-y-3">
                                <p className="text-sm text-white text-center">
                                    ¿Enviar{' '}
                                    <span className="font-bold text-[#00a859]">
                                        {parsedAmount} eco-puntos
                                    </span>{' '}
                                    al carnet{' '}
                                    <span className="font-mono font-bold text-white">
                                        {normalizedCarnet}
                                    </span>
                                    ?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeTransfer}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00a859] to-[#00c965] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#00a859]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            '✅ Confirmar Envío'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={!canSubmit}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00a859] to-[#00c965] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#00a859]/25 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">💸</span>
                                Transferir Eco-Puntos
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-600">
                    🔒 Transacción atómica y segura
                </span>
                <span className="text-[10px] text-gray-600">
                    EcoScan AI UGB
                </span>
            </div>
        </div>
    );
}
