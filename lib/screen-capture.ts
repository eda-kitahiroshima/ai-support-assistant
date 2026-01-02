/**
 * Screen Capture API を使用して画面をキャプチャ
 */
export async function captureScreen(): Promise<string> {
    try {
        // ブラウザの互換性チェック
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            throw new Error('お使いのブラウザは画面キャプチャに対応していません。Chrome、Edge、Firefoxをお使いください。');
        }

        // 画面共有を開始
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
        });

        // ビデオトラックを取得
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();

        // ImageCapture API を使用
        if ('ImageCapture' in window) {
            const imageCapture = new (window as any).ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();

            // Canvas に描画
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context error');

            ctx.drawImage(bitmap, 0, 0);

            // ストリームを停止
            stream.getTracks().forEach(track => track.stop());

            // Base64に変換
            return canvas.toDataURL('image/png');
        }

        // ImageCapture非対応の場合の代替方法
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;

        // ビデオが再生されるまで待つ
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // 少し待ってからキャプチャ（フレームが安定するまで）
        await new Promise(resolve => setTimeout(resolve, 100));

        // Canvas に描画
        const canvas = document.createElement('canvas');
        canvas.width = settings.width || video.videoWidth;
        canvas.height = settings.height || video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context error');

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;

        // Base64に変換
        return canvas.toDataURL('image/png');
    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
            throw new Error('画面共有が拒否されました。もう一度お試しください。');
        }
        throw error;
    }
}

/**
 * スクリーンキャプチャがサポートされているかチェック
 */
export function isScreenCaptureSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}
