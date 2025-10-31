import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { removeBackground } from "@/lib/backgroundRemoval";
import { extractBodyMeasurements } from "@/lib/bodyMeasurements";
import { supabase } from "@/integrations/supabase/client";

const Capture = () => {
  const [mode, setMode] = useState<"select" | "camera" | "upload">("select");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
      toast.error("Failed to access camera");
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setMode("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  const processAndSaveAvatar = async () => {
    if (!capturedImage || !avatarName.trim()) {
      toast.error("Please provide an avatar name");
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessingStatus("Removing background...");

    try {
      // Load image
      const img = new Image();
      img.src = capturedImage;
      await new Promise((resolve) => { img.onload = resolve; });

      // Remove background
      const { blob, canvas } = await removeBackground(img, setProcessingStatus);
      const processedImageUrl = canvas.toDataURL("image/png");
      
      setProcessingStatus("Analyzing measurements...");
      const measurements = await extractBodyMeasurements(processedImageUrl);

      setProcessingStatus("Generating 3D avatar...");
      
      // Convert to base64
      const base64Data = processedImageUrl.split(",")[1];
      
      // Call edge function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const { data: avatarData, error: functionError } = await supabase.functions.invoke(
        "generate-avatar-features",
        {
          body: { personImageBase64: base64Data },
        }
      );
      
      clearTimeout(timeoutId);

      if (functionError) throw functionError;

      setProcessingStatus("Saving avatar...");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save to database  
      const { data: avatar, error: dbError } = await supabase
        .from("avatars")
        .insert([{
          user_id: user.id,
          name: avatarName,
          original_image_url: capturedImage,
          processed_image_url: processedImageUrl,
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
      console.error("Error processing avatar:", error);
      const errorMessage = error.message || "Failed to create avatar";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setProcessingStatus("");
    }
  };

  const retryProcessing = () => {
    setError(null);
    processAndSaveAvatar();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-[var(--nav-height)] p-4 md:p-8">
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
                accept="image/*"
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

        {capturedImage && !processing && (
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

        {processing && (
          <Card className="gallery-card">
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-lg font-medium">{processingStatus}</p>
              <p className="text-sm text-muted-foreground">This may take a minute...</p>
            </CardContent>
          </Card>
        )}

        {error && !processing && (
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
