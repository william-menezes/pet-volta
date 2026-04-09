export type CompressOptions = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  mimeType: 'image/webp' | 'image/jpeg';
};

const defaultOptions: CompressOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
  mimeType: 'image/webp',
};

export async function compressImageFile(
  file: File,
  options: Partial<CompressOptions> = {},
): Promise<Blob> {
  const finalOptions = { ...defaultOptions, ...options };

  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo inválido: esperado imagem.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    finalOptions.maxWidth / bitmap.width,
    finalOptions.maxHeight / bitmap.height,
  );

  const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível processar a imagem.');
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Falha ao gerar imagem comprimida.'));
          return;
        }
        resolve(result);
      },
      finalOptions.mimeType,
      finalOptions.quality,
    );
  });

  return blob;
}

