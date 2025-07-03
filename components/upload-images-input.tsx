"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/utils/css-utils"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { TailwindClass } from "@/types/tailwind-types"

const DEFAULT_MAX_FILES = 100

export type ImageFile = {
    id: string
    file: File
    preview: string
}

export type ImageOption = {
    className?: TailwindClass
    hoverMessage?: string
}

export function UploadImagesInput(p: {
    onImagesSubmit?: (images: ImageFile[]) => void
    maxFiles?: number
    className?: string
    isLoading?: boolean
    progressPercentage?: number // 0-100
    imageOptions?: ImageOption[] // Array of options for each image (className, hoverMessage)
}) {
    const [images, setImages] = useState<ImageFile[]>([])

    const createImageFile = (file: File): ImageFile => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
    })

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newImages: ImageFile[] = acceptedFiles.map(createImageFile)
        const updatedImages = [...images, ...newImages].slice(0, p.maxFiles || DEFAULT_MAX_FILES)
        setImages(updatedImages)
    }, [images, p.maxFiles])

    const removeImage = (id: string) => {
        const updatedImages = images.filter((img) => img.id !== id)
        setImages(updatedImages)
    }

    const removeAllImages = () => {
        setImages([])
    }

    const handleSubmit = () => {
        if (images.length > 0) {
            p.onImagesSubmit?.(images)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxFiles: p.maxFiles || DEFAULT_MAX_FILES,
        disabled: images.length >= (p.maxFiles || DEFAULT_MAX_FILES) || p.isLoading
    })

    const renderEmptyState = () => (
        <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4  transition-colors duration-200" />
            <p className="text-lg font-medium text-gray-900 mb-2  transition-colors duration-200">
                {isDragActive ? "Drop images here..." : "Drag & drop images here"}
            </p>
            <p className="text-sm text-gray-500  transition-colors duration-200">
                or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-2  transition-colors duration-200">
                Supports: JPG, PNG, GIF, WebP (max {p.maxFiles || DEFAULT_MAX_FILES} files)
            </p>
        </>
    )

    const renderImagesState = () => (
        <>
            <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2  transition-colors duration-200" />
            <p className="text-sm text-gray-600  transition-colors duration-200">
                {isDragActive ? "Drop more images..." : "Drop more images or click to add"}
            </p>
            <p className="text-xs text-gray-400  transition-colors duration-200">
                {images.length}/{p.maxFiles || DEFAULT_MAX_FILES} files
            </p>
        </>
    )

    const renderDotsPattern = () => (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-blue-500/40" style={{
                backgroundImage: `
          radial-gradient(circle, #e5e7eb 1px, transparent 1px)
        `,
                backgroundSize: '20px 20px',
                opacity: 0.3
            }} />
        </div>
    )

    const renderImageGrid = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => {
                const imageOption = p.imageOptions?.[index] || {}
                const imageContent = (
                    <div className={cn("relative group ",)}>
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                            <img
                                src={image.preview}
                                alt={image.file.name}
                                className={cn("w-full h-full object-cover ", imageOption.className)}
                            />
                        </div>
                        <button
                            onClick={() => removeImage(image.id)}
                            disabled={p.isLoading}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                            {image.file.name}
                        </p>
                    </div>
                );

                return (
                    <div key={image.id} className={cn(
                        "relative group",

                    )}>
                        {imageOption.hoverMessage ? (
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    {imageContent}
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Image Details</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-line">
                                            {imageOption.hoverMessage}
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        ) : (
                            imageContent
                        )}
                    </div>
                );
            })}
        </div>
    )

    const renderSubmitButton = () => (
        <div className="mt-6 flex justify-center">
            <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
            >
                <Upload className="h-4 w-4" />
                Process {images.length} Image{images.length > 1 ? 's' : ''}
            </button>
        </div>
    )

    const renderProgressBar = () => (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-gray-900">
                    Processing images...
                </p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${p.progressPercentage || 0}%` }}
                />
            </div>

            <p className="text-xs text-gray-600">
                {p.progressPercentage ? `${Math.round(p.progressPercentage)}% complete` : 'Analyzing...'}
            </p>
        </div>
    )

    const renderRemoveAllButton = () => {
        return <button
            onClick={removeAllImages}
            disabled={p.isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Trash2 className="h-4 w-4" />
            Remove All
        </button>
    }
    return (
        <div className={cn("w-full", p.className)}>
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer group",
                    "bg-gray-50/50 hover:bg-red-50/50",
                    isDragActive && "border-blue-500 bg-blue-50/50",
                    images.length > 0 && "border-gray-300",
                    images.length >= (p.maxFiles || DEFAULT_MAX_FILES) && "opacity-50 cursor-not-allowed",
                    p.isLoading && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />

                {renderDotsPattern()}

                {/* Content */}
                <div className="relative z-10">
                    {images.length === 0 ? renderEmptyState() : renderImagesState()}
                </div>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
                <div className="mt-6">
                    {/* Remove All Button */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-900">
                            Uploaded Images ({images.length})
                        </h3>
                        {renderRemoveAllButton()}
                    </div>

                    {renderImageGrid()}

                    {/* Submit Button */}
                    {images.length > 0 && !p.isLoading && renderSubmitButton()}

                    {/* Progress Bar - Below Images */}
                    {p.isLoading && renderProgressBar()}
                </div>
            )}
        </div>
    )
}
