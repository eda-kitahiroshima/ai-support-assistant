import { getAllGoals } from './goal-management';
import { getConversationHistory } from './conversation-history';
import {
    saveGoalToFirestore,
    saveConversationToFirestore
} from './firestore';

/**
 * localStorageのデータをFirestoreに移行
 */
export async function migrateLocalStorageToFirestore(userId: string): Promise<void> {
    try {
        console.log('Starting migration from localStorage to Firestore...');

        // 目標を移行
        const goals = getAllGoals();
        console.log(`Migrating ${goals.length} goals...`);

        for (const goal of goals) {
            await saveGoalToFirestore(userId, goal);
        }

        // 会話を移行
        const conversations = getConversationHistory();
        console.log(`Migrating ${conversations.length} conversations...`);

        for (const conversation of conversations) {
            await saveConversationToFirestore(userId, conversation);
        }

        console.log('Migration completed successfully!');

        // 移行完了後、localStorageをクリア
        localStorage.removeItem('goals');
        localStorage.removeItem('conversationHistory');

        // 移行済みフラグを設定
        localStorage.setItem('migrated_to_firestore', 'true');

    } catch (error) {
        console.error('Failed to migrate data:', error);
        throw error;
    }
}

/**
 * 移行が必要かチェック
 */
export function needsMigration(): boolean {
    if (typeof window === 'undefined') return false;

    const migrated = localStorage.getItem('migrated_to_firestore');
    if (migrated === 'true') return false;

    // localStorageにデータがあるかチェック
    const goals = localStorage.getItem('goals');
    const conversations = localStorage.getItem('conversationHistory');

    return !!(goals || conversations);
}
