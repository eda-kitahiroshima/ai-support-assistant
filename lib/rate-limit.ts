// シンプルなメモリベースのレート制限
// 本番環境では Vercel KV や Redis を使用

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
        lastRequest: number;
    };
}

const store: RateLimitStore = {};

const DAILY_LIMIT = 50; // 1日50回
const MINUTE_LIMIT = 5; // 1分間5回
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime?: number;
    error?: string;
} {
    const now = Date.now();

    if (!store[identifier]) {
        store[identifier] = {
            count: 0,
            resetTime: now + DAY_MS,
            lastRequest: 0
        };
    }

    const userRecord = store[identifier];

    // 日次リセット
    if (now > userRecord.resetTime) {
        userRecord.count = 0;
        userRecord.resetTime = now + DAY_MS;
    }

    // 1分間の制限チェック
    if (now - userRecord.lastRequest < MINUTE_MS / MINUTE_LIMIT) {
        return {
            allowed: false,
            remaining: DAILY_LIMIT - userRecord.count,
            error: '1分間に5回までリクエスト可能です。少し待ってから再試行してください。'
        };
    }

    // 日次制限チェック
    if (userRecord.count >= DAILY_LIMIT) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: userRecord.resetTime,
            error: '本日の利用上限（50回）に達しました。明日またお試しください。'
        };
    }

    // カウント更新
    userRecord.count++;
    userRecord.lastRequest = now;

    return {
        allowed: true,
        remaining: DAILY_LIMIT - userRecord.count,
        resetTime: userRecord.resetTime
    };
}

export function getClientIdentifier(request: Request): string {
    // Vercel環境でのIPアドレス取得
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
        request.headers.get('x-real-ip') ||
        'unknown';
    return ip;
}
