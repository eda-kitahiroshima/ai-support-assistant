'use client';

import React from 'react';
import { ConversationItem } from '@/lib/types';

interface ConversationPaneProps {
    conversations: ConversationItem[];
    onSelect?: (conversation: ConversationItem) => void;
}

export default function ConversationPane({
    conversations,
    onSelect
}: ConversationPaneProps) {
    if (conversations.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-900/50 text-gray-500">
                <div className="text-center">
                    <p className="text-4xl mb-2">💬</p>
                    <p>まだ会話がありません</p>
                    <p className="text-sm mt-1">画面をキャプチャして質問してみましょう</p>
                </div>
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
        <div className="h-full flex flex-col bg-gray-900/50">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>💬</span>
                    <span>会話履歴</span>
                    <span className="text-sm font-normal text-gray-400">
                        ({conversations.length}件)
                    </span>
                </h2>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect?.(conv)}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all cursor-pointer group"
                    >
                        {/* Timestamp */}
                        <p className="text-xs text-gray-500 mb-2">
                            {formatTime(conv.timestamp)}
                        </p>

                        {/* Question */}
                        <div className="mb-3">
                            <p className="text-xs text-gray-400 mb-1">質問:</p>
                            <p className="text-white font-medium line-clamp-2">
                                {conv.question}
                            </p>
                        </div>

                        {/* Answer Preview */}
                        <div>
                            <p className="text-xs text-gray-400 mb-1">回答:</p>
                            <p className="text-gray-400 text-sm line-clamp-3">
                                {conv.answer.substring(0, 150)}
                                {conv.answer.length > 150 && '...'}
                            </p>
                        </div>

                        {/* Thumbnail if image exists */}
                        {conv.image && (
                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                                <img
                                    src={conv.image}
                                    alt="Screenshot"
                                    className="w-full h-20 object-cover rounded border border-gray-600"
                                />
                            </div>
                        )}

                        {/* Completed Steps Badge */}
                        {conv.completedSteps && conv.completedSteps.length > 0 && (
                            <div className="mt-2 flex items-center gap-1">
                                <span className="text-xs text-green-500">
                                    ✓ {conv.completedSteps.length}ステップ完了
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
