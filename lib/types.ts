export interface Step {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    completedAt?: number;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    steps: Step[];
    createdAt: number;
    completedAt?: number;
    isActive: boolean;
}

export interface ConversationItem {
    id: string;
    goalId: string; // どの目標に紐づくか
    timestamp: number;
    question: string;
    answer: string;
    image?: string;
    completedSteps?: string[]; // この会話で完了したステップ
}
