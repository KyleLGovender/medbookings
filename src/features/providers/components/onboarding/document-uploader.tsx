"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, type File, X, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploaderProps {
  onUpload: (file: any) => void
  acceptedFormats?: string[]
  currentFile?: any
}

export function DocumentUploader({
  onUpload,
  acceptedFormats = ["PDF", "JPG", "PNG"],
  currentFile,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<any>(currentFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File) => {
    const fileExtension = file.name.split(".").pop()?.toUpperCase()

    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Please upload a file in one of these formats: ${acceptedFormats.join(", ")}`,
        variant: "destructive",
      })
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // In a real app, you would upload to S3 here
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUploadProgress(100)

      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // In real app, this would be the S3 URL
        uploadedAt: new Date().toISOString(),
      }

      setUploadedFile(fileData)
      onUpload(fileData)

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    onUpload(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (uploadedFile) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile} className="text-red-600 hover:text-red-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drag and drop your file here, or{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => fileInputRef.current?.click()}>
                  browse
                </Button>
              </p>
              <p className="text-xs text-muted-foreground">
                Accepted formats: {acceptedFormats.join(", ")} • Max size: 10MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.map((format) => `.${format.toLowerCase()}`).join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
