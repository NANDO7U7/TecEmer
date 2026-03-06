'use client';

import React, { useState } from 'react';

interface AccordionItem {
    id: string;
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
}

interface AccordionProps {
    items: AccordionItem[];
    className?: string;
}

export default function Accordion({ items, className = '' }: AccordionProps) {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {items.map((item) => {
                const isOpen = openId === item.id;
                return (
                    <div
                        key={item.id}
                        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
                                ? 'border-eco-green/30 bg-eco-green-dark text-white shadow-lg'
                                : 'border-gray-200 bg-white hover:border-eco-green/20 hover:shadow-sm'
                            }`}
                    >
                        <button
                            onClick={() => toggle(item.id)}
                            className="w-full flex items-center justify-between p-5 text-left"
                        >
                            <div className="flex items-center gap-3">
                                {item.icon && <span className="text-lg">{item.icon}</span>}
                                <span className="font-medium text-sm">{item.title}</span>
                            </div>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-white/20 rotate-45' : 'bg-gray-100'
                                    }`}
                            >
                                <svg
                                    className={`w-4 h-4 transition-colors ${isOpen ? 'text-white' : 'text-gray-500'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </button>
                        <div
                            className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="px-5 pb-5 text-sm leading-relaxed opacity-90">
                                {item.content}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
