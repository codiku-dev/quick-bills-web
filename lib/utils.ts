import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function filesToBase64(imageFiles: File[]) {
    const base64ImagesPromise = imageFiles.map(image => image.arrayBuffer());
    const base64Images = await Promise.all(base64ImagesPromise);
    const base64ImagesString = base64Images.map(base64Image => Buffer.from(base64Image).toString('base64'));
    return base64ImagesString;
}
export async function fileToBase64(imageFile: File) {
    const base64Image = await imageFile.arrayBuffer();
    return Buffer.from(base64Image).toString('base64');
}