import { ConversationItem } from './types';

const STORAGE_KEY = 'conversationHistory';

/**
 * IDを生成
 */
export function generateId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 会話を保存
 */
export function saveConversation(conversation: ConversationItem): void {
    if (typeof window === 'undefined') return;

    try {
        const history = getConversationHistory();
        history.unshift(conversation);

        // 最大100件まで保存
        const trimmed = history.slice(0, 100);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save conversation:', error);
    }
}

/**
 * 全ての会話履歴を取得
 */
export function getConversationHistory(limit?: number): ConversationItem[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const history = JSON.parse(data);
        return limit ? history.slice(0, limit) : history;
    } catch (error) {
        console.error('Failed to load conversation history:', error);
        return [];
    }
}

/**
 * 会話履歴をクリア
 */
export function clearConversationHistory(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear conversation history:', error);
    }
}

/**
 * 特定の会話を削除
 */
export function deleteConversation(id: string): void {
    if (typeof window === 'undefined') return;

    try {
        const history = getConversationHistory();
        const filtered = history.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to delete conversation:', error);
    }
}

/**
 * 目標IDで会話をフィルタリング
 */
export function getConversationsByGoal(goalId: string, limit?: number): ConversationItem[] {
    const allHistory = getConversationHistory();
    const filtered = allHistory.filter(item => item.goalId === goalId);
    return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * 目標IDに紐づく全ての会話を削除
 */
export function deleteConversationsByGoal(goalId: string): void {
    if (typeof window === 'undefined') return;

    try {
        const history = getConversationHistory();
        const filtered = history.filter(item => item.goalId !== goalId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to delete conversations by goal:', error);
    }
}

/**
 * 全ての会話履歴を削除
 */
export function clearAllConversations(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('All conversations cleared');
    } catch (error) {
        console.error('Failed to clear conversations:', error);
    }
}
