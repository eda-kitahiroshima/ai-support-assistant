'use client';

import { useState } from 'react';
import { captureScreen, isScreenCaptureSupported } from '@/lib/screen-capture';

interface QuickCaptureButtonProps {
    onCapture: (imageBase64: string, autoQuestion: string) => void;
    goal?: { objective: string; currentStatus: string };
    disabled?: boolean;
}

export default function QuickCaptureButton({ onCapture, goal, disabled }: QuickCaptureButtonProps) {
    const [isCapturing, setIsCapturing] = useState(false);

    const handleQuickCapture = async () => {
        if (!isScreenCaptureSupported()) {
            alert('お使いのブラウザは画面キャプチャに対応していません。Chrome、Edge、Firefoxをお使いください。');
            return;
        }

        setIsCapturing(true);

        try {
            // 画面をキャプチャ
            const imageBase64 = await captureScreen();

            // 自動質問を生成
            const autoQuestion = goal
                ? `次に何をすればいいですか？具体的な手順を教えてください。`
                : `この画面で次に何をすればいいですか？`;

            // 親コンポーネントに通知
            onCapture(imageBase64, autoQuestion);
        } catch (error: any) {
            console.error('キャプチャエラー:', error);
            alert(error.message || '画面キャプチャに失敗しました');
        } finally {
            setIsCapturing(false);
        }
    };

    if (!isScreenCaptureSupported()) {
        return (
            <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400">
                    画面キャプチャ機能はこのブラウザでは利用できません
                </p>
            </div>
        );
    }

    return (
        <button
            onClick={handleQuickCapture}
            disabled={disabled || isCapturing}
            className="relative overflow-hidden w-full group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />

            <div className="relative px-8 py-6 flex items-center justify-center gap-3">
                {isCapturing ? (
                    <>
                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-white font-bold text-lg">キャプチャ中...</span>
                    </>
                ) : (
                    <>
                        <span className="text-4xl">📸</span>
                        <div className="text-left">
                            <div className="text-white font-bold text-lg">
                                今の画面で次のステップを聞く
                            </div>
                            <div className="text-white/80 text-sm">
                                ワンクリックでキャプチャ → AIが次の手順を提案
                            </div>
                        </div>
                    </>
                )}
            </div>
        </button>
    );
}
