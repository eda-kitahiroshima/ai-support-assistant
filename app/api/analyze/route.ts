import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, analyzeImageWithGoal } from '@/lib/gemini';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

// Vercelでの最大実行時間を設定（無料プランは10秒）
export const maxDuration = 10;

export async function POST(request: NextRequest) {
    try {
        // レート制限チェック
        const identifier = getClientIdentifier(request);
        const rateLimit = checkRateLimit(identifier);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: rateLimit.error },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                        'X-RateLimit-Reset': rateLimit.resetTime?.toString() || ''
                    }
                }
            );
        }

        const { image, question, goal, history } = await request.json();

        // 入力検証
        if (!image || !question) {
            return NextResponse.json(
                { error: '画像と質問の両方が必要です' },
                { status: 400 }
            );
        }

        if (question.length > 500) {
            return NextResponse.json(
                { error: '質問は500文字以内にしてください' },
                { status: 400 }
            );
        }

        // 画像サイズチェック（約5MB）
        const imageSize = image.length * 0.75; // Base64は元のサイズの約1.33倍
        if (imageSize > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: '画像は5MB以下にしてください' },
                { status: 400 }
            );
        }

        // AI解析（目標・履歴がある場合はコンテキスト付き）
        const response = goal || history
            ? await analyzeImageWithGoal(image, question, goal, history)
            : await analyzeImage(image, question);

        return NextResponse.json(
            {
                response,
                remaining: rateLimit.remaining
            },
            {
                headers: {
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    'X-RateLimit-Reset': rateLimit.resetTime?.toString() || ''
                }
            }
        );
    } catch (error: any) {
        console.error('API Error:', error);

        // タイムアウトエラーの場合
        if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
            return NextResponse.json(
                { error: 'AIの応答時間が長すぎました。もう一度試してください。' },
                { status: 504 }
            );
        }

        // Gemini APIエラーの場合
        if (error.message?.includes('GoogleGenerativeAI') || error.message?.includes('API key')) {
            return NextResponse.json(
                { error: 'AI APIに接続できませんでした。しばらくしてから再試行してください。' },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { error: 'サーバーエラーが発生しました。しばらくしてから再試行してください。' },
            { status: 500 }
        );
    }
}
