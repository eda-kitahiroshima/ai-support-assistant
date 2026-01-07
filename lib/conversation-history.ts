import { ConversationItem } from './types';

const STORAGE_KEY = 'conversationHistory';
const MAX_HISTORY = 100; // 最大保存件数

/**
 * 会話を保存
 */
export function saveConversation(item: ConversationItem): void {
    try {
        const history = getConversationHistory();

        // 新しい会話を先頭に追加
        history.unshift(item);

        // 最大件数を超えたら古いものを削除
        if (history.length > MAX_HISTORY) {
            history.splice(MAX_HISTORY);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Failed to save conversation:', error);
    }
}

/**
 * 会話履歴を取得（最新N件）
 */
export function getConversationHistory(limit?: number): ConversationItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const history: ConversationItem[] = JSON.parse(stored);

        if (limit && limit > 0) {
            return history.slice(0, limit);
        }

        return history;
    } catch (error) {
        console.error('Failed to get conversation history:', error);
        return [];
    }
}

/**
 * 会話履歴を全削除
 */
export function clearConversationHistory(): void {
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
    try {
        const history = getConversationHistory();
        const filtered = history.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to delete conversation:', error);
    }
}

/**
 * UUIDを生成
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
