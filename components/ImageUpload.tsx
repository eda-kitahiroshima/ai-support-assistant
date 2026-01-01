'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
    onImageSelect: (imageBase64: string) => void;
    currentImage: string | null;
}

export default function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('ファイルサイズは5MB以下にしてください');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            onImageSelect(result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
                スクリーンショットまたは画像をアップロード
            </label>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {currentImage ? (
                    <div className="space-y-4">
                        <div className="relative w-full max-w-2xl mx-auto">
                            <img
                                src={currentImage}
                                alt="アップロード画像"
                                className="rounded-lg shadow-lg max-h-96 mx-auto"
                            />
                        </div>
                        <button
                            type="button"
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            別の画像を選択
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-6xl">📸</div>
                        <div>
                            <p className="text-lg text-gray-300">
                                画像をドラッグ&ドロップ
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                または クリックして選択
                            </p>
                        </div>
                        <p className="text-xs text-gray-600">
                            PNG, JPG, GIF （最大5MB）
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
}
