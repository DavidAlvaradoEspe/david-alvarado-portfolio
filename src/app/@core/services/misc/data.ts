
export async function dataURIToBlob(dataUrl: string): Promise<Blob> {
  return  await fetch(dataUrl).then((r) => r.blob());
}
