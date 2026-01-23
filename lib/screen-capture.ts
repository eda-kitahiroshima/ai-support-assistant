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

            // 元の画像サイズ
            const originalWidth = bitmap.width;
            const originalHeight = bitmap.height;

            // 最大サイズを設定（1280x720）
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 720;

            let targetWidth = originalWidth;
            let targetHeight = originalHeight;

            // アスペクト比を維持しながら縮小
            if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
                const widthRatio = MAX_WIDTH / originalWidth;
                const heightRatio = MAX_HEIGHT / originalHeight;
                const ratio = Math.min(widthRatio, heightRatio);

                targetWidth = Math.floor(originalWidth * ratio);
                targetHeight = Math.floor(originalHeight * ratio);
            }

            // Canvas に描画（リサイズ）
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context error');

            ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

            // ストリームを停止
            stream.getTracks().forEach(track => track.stop());

            console.log(`📸 画像圧縮: ${originalWidth}x${originalHeight} → ${targetWidth}x${targetHeight}`);

            // Base64に変換（JPEG、品質80%）
            return canvas.toDataURL('image/jpeg', 0.8);
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

        // Canvas に描画（リサイズ）
        const originalWidth = settings.width || video.videoWidth;
        const originalHeight = settings.height || video.videoHeight;

        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 720;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
            const widthRatio = MAX_WIDTH / originalWidth;
            const heightRatio = MAX_HEIGHT / originalHeight;
            const ratio = Math.min(widthRatio, heightRatio);

            targetWidth = Math.floor(originalWidth * ratio);
            targetHeight = Math.floor(originalHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context error');

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;

        console.log(`📸 画像圧縮: ${originalWidth}x${originalHeight} → ${targetWidth}x${targetHeight}`);

        // Base64に変換（JPEG、品質80%）
        return canvas.toDataURL('image/jpeg', 0.8);
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
