import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, analyzeImageWithGoal } from '@/lib/gemini';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

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

        const { image, question, goal } = await request.json();

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

        // AI解析（目標がある場合はコンテキスト付き）
        const response = goal
            ? await analyzeImageWithGoal(image, question, goal)
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
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました。しばらくしてから再試行してください。' },
            { status: 500 }
        );
    }
}
