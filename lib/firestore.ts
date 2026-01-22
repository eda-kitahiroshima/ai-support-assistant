import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Goal, ConversationItem } from './types';

/**
 * ユーザーの全目標を取得
 */
export async function getGoalsFromFirestore(userId: string): Promise<Goal[]> {
    if (!db) {
        console.warn('Firestore is not configured');
        return [];
    }

    try {
        const goalsRef = collection(db, 'users', userId, 'goals');
        const q = query(goalsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
        } as Goal));
    } catch (error) {
        console.error('Failed to get goals from Firestore:', error);
        return [];
    }
}

/**
 * 目標をFirestoreに保存
 */
export async function saveGoalToFirestore(userId: string, goal: Goal): Promise<void> {
    console.log('🟡 saveGoalToFirestore開始:', { userId, goalId: goal.id, title: goal.title });

    if (!db) {
        console.error('❌ Firestoreが初期化されていません');
        throw new Error('Firestore is not configured');
    }

    try {
        const goalRef = doc(db, 'users', userId, 'goals', goal.id);
        console.log('🟡 goalRefパス:', goalRef.path);

        // タイムアウト処理（5秒）
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Firestore save timeout (5秒)')), 5000);
        });

        const savePromise = setDoc(goalRef, {
            ...goal,
            createdAt: goal.createdAt,
            completedAt: goal.completedAt || null,
        });

        await Promise.race([savePromise, timeoutPromise]);
        console.log('✅ saveGoalToFirestore完了');
    } catch (error: any) {
        console.error('❌ Failed to save goal to Firestore:', error);
        throw error;
    }
}

/**
 * 目標をFirestoreから削除
 */
export async function deleteGoalFromFirestore(userId: string, goalId: string): Promise<void> {
    if (!db) {
        throw new Error('Firestore is not configured');
    }

    try {
        const goalRef = doc(db, 'users', userId, 'goals', goalId);
        await deleteDoc(goalRef);

        // 関連する会話も削除
        await deleteConversationsByGoalFromFirestore(userId, goalId);
    } catch (error) {
        console.error('Failed to delete goal from Firestore:', error);
        throw error;
    }
}

/**
 * 全目標をFirestoreから削除
 */
export async function clearAllGoalsFromFirestore(userId: string): Promise<void> {
    if (!db) {
        throw new Error('Firestore is not configured');
    }

    try {
        const goalsRef = collection(db, 'users', userId, 'goals');
        const snapshot = await getDocs(goalsRef);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // 全会話も削除
        await clearAllConversationsFromFirestore(userId);
    } catch (error) {
        console.error('Failed to clear all goals from Firestore:', error);
        throw error;
    }
}

/**
 * ユーザーの全会話を取得
 */
export async function getConversationsFromFirestore(userId: string, goalId?: string): Promise<ConversationItem[]> {
    if (!db) {
        console.warn('Firestore is not configured');
        return [];
    }

    try {
        const conversationsRef = collection(db, 'users', userId, 'conversations');
        let q;

        if (goalId) {
            q = query(
                conversationsRef,
                where('goalId', '==', goalId),
                orderBy('timestamp', 'desc')
            );
        } else {
            q = query(conversationsRef, orderBy('timestamp', 'desc'));
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
        } as ConversationItem));
    } catch (error) {
        console.error('Failed to get conversations from Firestore:', error);
        return [];
    }
}

/**
 * 会話をFirestoreに保存
 */
export async function saveConversationToFirestore(userId: string, conversation: ConversationItem): Promise<void> {
    if (!db) {
        throw new Error('Firestore is not configured');
    }

    try {
        const conversationRef = doc(db, 'users', userId, 'conversations', conversation.id);
        await setDoc(conversationRef, {
            ...conversation,
            timestamp: conversation.timestamp,
        });
    } catch (error) {
        console.error('Failed to save conversation to Firestore:', error);
        throw error;
    }
}

/**
 * 目標に紐づく会話を削除
 */
export async function deleteConversationsByGoalFromFirestore(userId: string, goalId: string): Promise<void> {
    if (!db) {
        throw new Error('Firestore is not configured');
    }

    try {
        const conversationsRef = collection(db, 'users', userId, 'conversations');
        const q = query(conversationsRef, where('goalId', '==', goalId));
        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Failed to delete conversations by goal from Firestore:', error);
        throw error;
    }
}

/**
 * 全会話を削除
 */
export async function clearAllConversationsFromFirestore(userId: string): Promise<void> {
    if (!db) {
        throw new Error('Firestore is not configured');
    }

    try {
        const conversationsRef = collection(db, 'users', userId, 'conversations');
        const snapshot = await getDocs(conversationsRef);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Failed to clear all conversations from Firestore:', error);
        throw error;
    }
}
