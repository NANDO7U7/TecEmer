'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

// Knowledge base for environmental queries in El Salvador context
const KNOWLEDGE_BASE: { patterns: string[]; response: string }[] = [
    {
        patterns: ['tetra pak', 'tetrapak', 'cartón de leche', 'jugo en caja'],
        response: '📦 **Tetra Pak** (cartones de leche/jugo): En El Salvador actualmente no existe un sistema masivo de reciclaje para Tetra Pak. Te recomendamos:\n\n1. Enjuagarlo y aplastarlo\n2. Buscar puntos de recolección de Tetra Pak en centros comerciales\n3. Si no encuentras, deposítalo en el contenedor **Negro (Basura Común)**\n\n💡 ¡La UGB está trabajando para incluir más materiales reciclables!',
    },
    {
        patterns: ['plástico', 'botella', 'pet', 'botella de agua', 'envase plástico'],
        response: '🟢 **Botellas de Plástico (PET)**: ¡Deposítalas en el contenedor **Verde**! Ganas **+15 ⭐ eco-puntos**.\n\n🔑 Tips:\n- Enjuaga la botella antes\n- Retira la tapa (también es reciclable)\n- Aplástala para ahorrar espacio\n\n♻️ El plástico PET se recicla para hacer fibras textiles, alfombras y nuevas botellas.',
    },
    {
        patterns: ['lata', 'aluminio', 'lata de soda', 'cerveza', 'refresco'],
        response: '🟡 **Latas de Aluminio**: ¡Deposítalas en el contenedor **Amarillo**! Ganas **+20 ⭐ eco-puntos**.\n\n🔑 Tips:\n- Enjuaga la lata\n- Puedes aplastarla\n- ¡El aluminio se recicla infinitamente sin perder calidad!\n\n📊 Reciclar una lata ahorra 95% de la energía necesaria para hacer una nueva.',
    },
    {
        patterns: ['huella', 'carbono', 'reducir', 'impacto ambiental', 'sostenible'],
        response: '🌍 **Consejos para reducir tu huella de carbono en la UGB:**\n\n1. 🚶 Camina o usa bicicleta para ir a clases\n2. 💡 Apaga luces y equipos que no uses\n3. 🥤 Usa recipientes reutilizables para agua y comida\n4. 📱 Usa la app EcoScan para reciclar correctamente\n5. 🌱 Participa en jornadas de reforestación\n6. 📄 Reduce el uso de papel: usa notas digitales\n7. 🛍️ Lleva tu propia bolsa reutilizable\n\n💚 ¡Cada acción cuenta! Con EcoScan AI ganas puntos por reciclar.',
    },
    {
        patterns: ['puntos', 'eco-puntos', 'canjear', 'ugb store', 'cupón', 'tienda'],
        response: '⭐ **Sistema de Eco-Puntos:**\n\n| Material | Contenedor | Puntos |\n|---|---|---|\n| 🟢 Plástico | Verde | +15 |\n| 🟡 Lata | Amarillo | +20 |\n| ⚫ Basura Común | Negro | 0 |\n\n🏪 **UGB Store**: Canjea tus puntos por:\n- ☕ Café en cafetería (100 pts)\n- 📎 Descuento en librería (200 pts)\n- 🎟️ Entrada a eventos (500 pts)\n\n🎖️ ¡Al llegar a 5,000 puntos recibes una Insignia Digital de Líder Ambiental!',
    },
    {
        patterns: ['contenedor', 'cuál', 'dónde', 'boto', 'tirar', 'desechar'],
        response: '♻️ **Guía rápida de contenedores EcoScan:**\n\n🟢 **Verde** → Botellas de plástico (PET)\n🟡 **Amarillo** → Latas de aluminio\n⚫ **Negro** → Todo lo demás (Basura Común)\n\n🤖 Si no estás seguro, ¡usa el escáner de EcoScan AI! La IA identificará el material automáticamente.\n\n⚡ Si el objeto no es plástico ni lata, se clasifica automáticamente como Basura Común (descarte automático).',
    },
    {
        patterns: ['vidrio', 'botella de vidrio', 'frasco'],
        response: '🔷 **Vidrio**: Actualmente EcoScan clasifica el vidrio como **Basura Común** (⚫ Negro), ya que el campus de la UGB no cuenta con contenedor específico para vidrio.\n\n💡 Sin embargo:\n- El vidrio es 100% reciclable\n- Busca puntos de recolección externos\n- ¡En futuras versiones se planea añadir un contenedor para vidrio!\n\n⚠️ Ten cuidado al manipular vidrio roto.',
    },
    {
        patterns: ['papel', 'cartón', 'cuaderno', 'hoja', 'periódico'],
        response: '📄 **Papel y Cartón**: Actualmente se clasifica como **Basura Común** (⚫ Negro) en EcoScan.\n\n💡 Consejos:\n- Separa el papel limpio del sucio\n- El papel plastificado NO es reciclable\n- El cartón corrugado sí es reciclable\n- Busca contenedores de papel en la biblioteca de la UGB\n\n🔮 ¡En futuras versiones se planea añadir clasificación de papel!',
    },
    {
        patterns: ['insignia', 'badge', 'certificado', 'logro', 'líder ambiental'],
        response: '🎖️ **Insignias Digitales de EcoScan:**\n\n| Insignia | Requisito |\n|---|---|\n| 🌱 Eco-Novato | Primer escaneo |\n| 🌿 Reciclador Activo | 500 eco-puntos |\n| 🌳 Guardián Verde | 2,000 eco-puntos |\n| 🏆 Líder Ambiental UGB | 5,000 eco-puntos |\n\n🔗 Las insignias se pueden compartir en LinkedIn y redes sociales como certificación de tu compromiso ambiental.\n\n¡Sigue reciclando para desbloquear todas!',
    },
    {
        patterns: ['hola', 'hey', 'buenas', 'qué tal', 'saludos'],
        response: '¡Hola! 👋 Soy **Eco-Bot**, tu asistente ambiental de la UGB.\n\nPuedo ayudarte con:\n- 🗑️ **¿Dónde boto esto?** — Pregúntame sobre cualquier material\n- ♻️ **Consejos de reciclaje** — Tips para ser más sostenible\n- ⭐ **Eco-Puntos** — Cómo ganar y canjear puntos\n- 🏆 **Insignias** — Cómo obtener tu certificado digital\n\n¡Escríbeme tu pregunta! 🌿',
    },
    {
        patterns: ['gracias', 'thanks', 'genial', 'perfecto'],
        response: '¡De nada! 🌿 Me alegra poder ayudarte. Recuerda que cada acción de reciclaje cuenta. ¡Juntos hacemos la diferencia en la UGB! ♻️\n\n¿Tienes otra pregunta?',
    },
];

const DEFAULT_RESPONSE = '🤔 No tengo información específica sobre eso, pero puedo ayudarte con:\n\n- 🗑️ ¿Dónde boto un material específico?\n- ♻️ Consejos para reducir tu huella de carbono\n- ⭐ Cómo funcionan los eco-puntos\n- 🏆 Insignias digitales\n\n¡Intenta preguntarme algo más específico! 🌿';

function findResponse(input: string): string {
    const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const entry of KNOWLEDGE_BASE) {
        if (entry.patterns.some((p) => lower.includes(p))) {
            return entry.response;
        }
    }
    return DEFAULT_RESPONSE;
}

export default function EcoBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'bot',
            text: '¡Hola! 👋 Soy **Eco-Bot**, tu asistente ambiental de la UGB. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate typing delay
        setTimeout(() => {
            const response = findResponse(userMsg.text);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: response,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 600 + Math.random() * 800);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Simple markdown bold parsing
    const renderText = (text: string) => {
        return text.split('\n').map((line, i) => (
            <span key={i}>
                {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                    ) : (
                        <span key={j}>{part}</span>
                    )
                )}
                {i < text.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center text-2xl sm:text-3xl ${isOpen
                        ? 'bg-gray-700 text-white rotate-90 scale-90'
                        : 'eco-gradient text-white hover:scale-110 hover:shadow-xl'
                    }`}
                aria-label="Abrir Eco-Bot"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-40 w-[calc(100vw-24px)] sm:w-96 max-h-[70vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in flex flex-col bg-white">
                    {/* Header */}
                    <div className="eco-gradient px-4 py-3 text-white flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">
                            🤖
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Eco-Bot UGB</h4>
                            <p className="text-[10px] opacity-80">Asistente Ambiental</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-[10px] opacity-80">En línea</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-eco-cream/50 min-h-[200px] max-h-[50vh]">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'eco-gradient text-white rounded-br-md'
                                            : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md'
                                        }`}
                                >
                                    {renderText(msg.text)}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-eco-green rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <span className="w-2 h-2 bg-eco-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <span className="w-2 h-2 bg-eco-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 py-2 flex gap-1.5 overflow-x-auto bg-white border-t border-gray-50 flex-shrink-0">
                        {['¿Dónde boto plástico?', 'Eco-Puntos', 'Insignias'].map((q) => (
                            <button
                                key={q}
                                onClick={() => {
                                    setInput(q);
                                    setTimeout(() => sendMessage(), 50);
                                }}
                                className="flex-shrink-0 px-3 py-1.5 text-[11px] rounded-full bg-eco-green-dark/5 text-eco-green-dark hover:bg-eco-green-dark/10 transition-colors font-medium"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white flex-shrink-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregúntame sobre reciclaje..."
                            className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 text-sm border border-gray-200 focus:outline-none focus:border-eco-green focus:ring-1 focus:ring-eco-green/20 transition-colors"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            className="w-10 h-10 rounded-full eco-gradient text-white flex items-center justify-center text-lg disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
                        >
                            ↑
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
