import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, Loader2, AlertCircle, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { removeBackground } from "@/lib/backgroundRemoval";
import { extractBodyMeasurements } from "@/lib/bodyMeasurements";
import { supabase } from "@/integrations/supabase/client";
import { 
  VALIDATION_CONFIG, 
  STORAGE_CONFIG, 
  PROCESSING_STAGES, 
  type ProcessingStage 
} from "@/lib/constants/avatar3d";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const Capture = () => {
  const [mode, setMode] = useState<"select" | "camera" | "upload">("select");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(null);
  const [avatarName, setAvatarName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isProcessing = processingStage !== null;

  // Cleanup camera stream on unmount or mode change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Validate image file
  const validateImage = useCallback(async (file: File): Promise<ValidationResult> => {
    // Check file size
    if (file.size > VALIDATION_CONFIG.maxImageSize) {
      return { 
        valid: false, 
        error: `Image must be less than ${Math.floor(VALIDATION_CONFIG.maxImageSize / (1024 * 1024))}MB` 
      };
    }

    // Check file type
    const allowedTypes = VALIDATION_CONFIG.allowedMimeTypes as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: "Please upload a JPG, PNG, or WebP image" 
      };
    }

    // Check dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < VALIDATION_CONFIG.minImageDimension || img.height < VALIDATION_CONFIG.minImageDimension) {
          resolve({ 
            valid: false, 
            error: `Image must be at least ${VALIDATION_CONFIG.minImageDimension}x${VALIDATION_CONFIG.minImageDimension} pixels` 
          });
        } else if (img.width > VALIDATION_CONFIG.maxImageDimension || img.height > VALIDATION_CONFIG.maxImageDimension) {
          resolve({ 
            valid: false, 
            error: `Image must be smaller than ${VALIDATION_CONFIG.maxImageDimension}x${VALIDATION_CONFIG.maxImageDimension} pixels` 
          });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({ valid: false, error: "Failed to load image" });
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Sanitize avatar name
  const sanitizeAvatarName = (name: string): string => {
    return name
      .trim()
      .substring(0, 100)
      .replace(/[<>"']/g, '')
      .replace(/\s+/g, ' ');
  };

  // Upload image to Supabase Storage
  const uploadImageToStorage = async (
    imageDataUrl: string,
    userId: string,
    fileName: string,
    bucketName: string
  ): Promise<string> => {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    const filePath = `${userId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, blob, {
        contentType: blob.type as 'image/jpeg' | 'image/png' | 'image/webp',
        upsert: false
      });
      
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setMode("camera");
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    const validation = await validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setMode("upload");
    };
    reader.readAsDataURL(file);
  };

  const processAndSaveAvatar = async () => {
    const sanitizedName = sanitizeAvatarName(avatarName);
    if (!capturedImage || !sanitizedName) {
      toast.error("Please provide an avatar name");
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setError(null);

    try {
      // Phase 1: Validation
      setProcessingStage("validating");
      const img = new Image();
      img.src = capturedImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image"));
        if (controller.signal.aborted) reject(new Error("Cancelled"));
      });

      if (controller.signal.aborted) throw new Error("Cancelled");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to create an avatar");

      // Phase 2: Background removal
      setProcessingStage("removingBackground");
      const { canvas } = await removeBackground(img, (status) => {
        // Progress updates handled by stage
      });
      const processedImageUrl = canvas.toDataURL("image/png");

      if (controller.signal.aborted) throw new Error("Cancelled");

      // Phase 3: Extract measurements
      setProcessingStage("extractingMeasurements");
      const measurements = await extractBodyMeasurements(processedImageUrl);

      if (controller.signal.aborted) throw new Error("Cancelled");

      // Upload images to storage
      const [originalImageStorageUrl, processedImageStorageUrl] = await Promise.all([
        uploadImageToStorage(capturedImage, user.id, "original.jpg", STORAGE_CONFIG.avatarImagesBucket),
        uploadImageToStorage(processedImageUrl, user.id, "processed.png", STORAGE_CONFIG.avatarImagesBucket)
      ]);

      if (controller.signal.aborted) throw new Error("Cancelled");

      // Phase 4: Generate 3D face
      setProcessingStage("generating3DFace");
      
      const functionTimeout = setTimeout(() => controller.abort(), 90000);
      
      const { data: avatarData, error: functionError } = await supabase.functions.invoke(
        "generate-avatar-features",
        {
          body: { personImageBase64: processedImageUrl },
          signal: controller.signal
        }
      );
      
      clearTimeout(functionTimeout);

      if (functionError) {
        throw new Error(functionError.message || "Failed to generate 3D avatar");
      }

      if (controller.signal.aborted) throw new Error("Cancelled");

      // Phase 5: Save avatar
      setProcessingStage("savingAvatar");

      const { data: avatar, error: dbError } = await supabase
        .from("avatars")
        .insert([{
          user_id: user.id,
          name: sanitizedName,
          original_image_url: originalImageStorageUrl,
          processed_image_url: processedImageStorageUrl,
          face_mesh_url: avatarData.faceMeshUrl || null,
          body_mesh_url: avatarData.bodyMeshUrl || null,
          face_texture_url: avatarData.faceTextureUrl || null,
          measurements: measurements as any,
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success("Avatar created successfully!");
      navigate(`/try-on?avatar=${avatar.id}`);
    } catch (error: any) {
      if (error.message === "Cancelled") {
        toast.info("Avatar creation cancelled");
        return;
      }

      let userMessage = "We couldn't create your avatar. ";
      
      if (error.message?.includes("timeout") || error.message?.includes("aborted")) {
        userMessage = "This is taking longer than expected. Try using a smaller image or simpler background.";
      } else if (error.message?.includes("not authenticated") || error.message?.includes("log in")) {
        userMessage = "Please log in to create an avatar.";
      } else if (error.message?.includes("Failed to load")) {
        userMessage = "There was a problem loading your photo. Please try a different image.";
      } else if (error.message?.includes("storage")) {
        userMessage = "Failed to save images. Please try again.";
      } else if (error.message) {
        userMessage = error.message;
      } else {
        userMessage += "Please try again or use a different photo.";
      }
      
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setProcessingStage(null);
      setAbortController(null);
    }
  };

  const cancelProcessing = () => {
    abortController?.abort();
    setProcessingStage(null);
    setAbortController(null);
  };

  const retryProcessing = () => {
    setError(null);
    processAndSaveAvatar();
  };

  const getProgressPercentage = (stage: ProcessingStage): number => {
    if (!stage) return 0;
    const stages: ProcessingStage[] = [
      'validating',
      'removingBackground',
      'extractingMeasurements',
      'generating3DFace',
      'generating3DBody',
      'savingAvatar'
    ];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div aria-hidden className="h-[calc(var(--nav-height)+2rem)]" />
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif font-bold">Create Your Avatar</h1>
          <p className="text-muted-foreground">Capture or upload a photo to get started</p>
        </div>

        {mode === "select" && !capturedImage && (
          <Card className="gallery-card">
            <CardHeader>
              <CardTitle>Choose Input Method</CardTitle>
              <CardDescription>Select how you'd like to provide your photo</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={startCamera}
                variant="kusama"
                size="lg"
                className="h-32 flex-col gap-2"
              >
                <Camera className="w-8 h-8" />
                <span>Use Camera</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="h-32 flex-col gap-2"
              >
                <Upload className="w-8 h-8" />
                <span>Upload Photo</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={VALIDATION_CONFIG.allowedMimeTypes.join(',')}
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {mode === "camera" && !capturedImage && (
          <Card className="gallery-card">
            <CardContent className="p-6 space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button onClick={capturePhoto} variant="kusama" className="flex-1">
                  <Camera className="mr-2" />
                  Take Photo
                </Button>
                <Button onClick={() => { stopCamera(); setMode("select"); }} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {capturedImage && !isProcessing && !error && (
          <Card className="gallery-card">
            <CardHeader>
              <CardTitle>Review & Save</CardTitle>
              <CardDescription>Name your avatar and we'll process it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <img src={capturedImage} alt="Captured" className="w-full rounded-xl" />
              <div className="space-y-2">
                <Label htmlFor="avatarName">Avatar Name</Label>
                <Input
                  id="avatarName"
                  placeholder="e.g., My First Avatar"
                  value={avatarName}
                  onChange={(e) => setAvatarName(e.target.value)}
                  maxLength={100}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={processAndSaveAvatar}
                  variant="kusama"
                  className="flex-1"
                  disabled={!avatarName.trim()}
                >
                  Create Avatar
                </Button>
                <Button
                  onClick={() => {
                    setCapturedImage(null);
                    setMode("select");
                    setAvatarName("");
                  }}
                  variant="outline"
                >
                  Retake
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isProcessing && (
          <Card className="gallery-card">
            <CardContent className="p-12 flex flex-col items-center gap-6">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <div className="w-full max-w-md space-y-3">
                <Progress value={getProgressPercentage(processingStage)} className="w-full" />
                <p className="text-lg font-medium text-center">
                  {processingStage ? PROCESSING_STAGES[processingStage] : 'Processing...'}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  This may take 60-90 seconds...
                </p>
              </div>
              <Button
                onClick={cancelProcessing}
                variant="outline"
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {error && !isProcessing && (
          <Card className="gallery-card max-w-md mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h3 className="text-lg font-semibold">Processing Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={retryProcessing} variant="kusama">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button onClick={() => navigate('/my-avatars')} variant="outline">
                  View My Avatars
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default Capture;
