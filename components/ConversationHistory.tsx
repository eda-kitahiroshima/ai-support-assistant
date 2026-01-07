'use client';

import React from 'react';
import { ConversationItem } from '@/lib/types';

interface ConversationHistoryProps {
    history: ConversationItem[];
    onSelect?: (item: ConversationItem) => void;
    onDelete?: (id: string) => void;
}

export default function ConversationHistory({
    history,
    onSelect,
    onDelete
}: ConversationHistoryProps) {
    if (history.length === 0) {
        return (
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 text-center">
                <p className="text-gray-500 text-sm">まだ会話履歴がありません</p>
            </div>
        );
    }

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // 1時間以内
        if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes}分前`;
        }

        // 24時間以内
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours}時間前`;
        }

        // それ以外
        return date.toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                <span>📜</span>
                <span>過去の会話</span>
            </h3>

            <div className="space-y-2">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-all cursor-pointer group"
                        onClick={() => onSelect?.(item)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-400 mb-1">
                                    {formatTime(item.timestamp)}
                                </p>
                                <p className="text-white font-medium mb-2 line-clamp-2">
                                    {item.question}
                                </p>
                                <p className="text-gray-400 text-sm line-clamp-2">
                                    {item.answer.substring(0, 100)}...
                                </p>
                            </div>

                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 text-xl"
                                    title="削除"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
