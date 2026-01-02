'use client';

import React from 'react';

interface AnswerDisplayProps {
    answer: string;
}

export default function AnswerDisplay({ answer }: AnswerDisplayProps) {
    // Markdownライクなフォーマットを簡易パース
    const formatAnswer = (text: string) => {
        const lines = text.split('\n');
        const formatted: React.ReactElement[] = [];
        let currentList: string[] = [];
        let listType: 'ol' | 'ul' | null = null;

        lines.forEach((line, index) => {
            // セクションヘッダー
            if (line.startsWith('## ')) {
                if (currentList.length > 0) {
                    formatted.push(renderList(currentList, listType!, formatted.length));
                    currentList = [];
                    listType = null;
                }
                formatted.push(
                    <h2 key={index} className="text-xl font-semibold text-indigo-400 mt-6 mb-3">
                        {line.replace('## ', '')}
                    </h2>
                );
            }
            // 番号付きリスト
            else if (/^\d+\.\s/.test(line)) {
                if (listType !== 'ol' && currentList.length > 0) {
                    formatted.push(renderList(currentList, listType!, formatted.length));
                    currentList = [];
                }
                listType = 'ol';
                currentList.push(line.replace(/^\d+\.\s/, ''));
            }
            // 箇条書きリスト
            else if (line.startsWith('- ')) {
                if (listType !== 'ul' && currentList.length > 0) {
                    formatted.push(renderList(currentList, listType!, formatted.length));
                    currentList = [];
                }
                listType = 'ul';
                currentList.push(line.replace('- ', ''));
            }
            // 通常のテキスト
            else if (line.trim()) {
                if (currentList.length > 0) {
                    formatted.push(renderList(currentList, listType!, formatted.length));
                    currentList = [];
                    listType = null;
                }
                formatted.push(
                    <p key={index} className="text-gray-300 mb-2">
                        {line}
                    </p>
                );
            }
        });

        if (currentList.length > 0) {
            formatted.push(renderList(currentList, listType!, formatted.length));
        }

        return formatted;
    };

    const renderList = (items: string[], type: 'ol' | 'ul', key: number) => {
        const ListTag = type;
        return (
            <ListTag key={key} className={`${type === 'ol' ? 'list-decimal' : 'list-disc'} ml-6 mb-4 space-y-2`}>
                {items.map((item, i) => (
                    <li key={i} className="text-gray-300">
                        {item}
                    </li>
                ))}
            </ListTag>
        );
    };

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-semibold text-gray-200">AIの回答</h3>
            </div>
            <div className="prose prose-invert max-w-none">
                {formatAnswer(answer)}
            </div>
        </div>
    );
}
