import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY が設定されていません' },
                { status: 500 }
            );
        }

        // REST APIを直接呼び出し
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                {
                    error: `API Error: ${response.status} ${response.statusText}`,
                    details: errorText
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            apiKeyPrefix: apiKey.substring(0, 10) + '...',
            models: data.models || [],
            raw: data
        });
    } catch (error: any) {
        console.error('List Models Error:', error);
        return NextResponse.json(
            {
                error: error.message || '不明なエラー',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
