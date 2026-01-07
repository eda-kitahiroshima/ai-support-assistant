export interface ConversationItem {
    id: string;
    timestamp: number;
    question: string;
    answer: string;
    image?: string; // Base64画像（任意）
}

export interface Goal {
    objective: string;
    currentStatus: string;
    deadline?: string;
}
