import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, ShirtIcon, User } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Avatar {
  id: string;
  name: string;
  processed_image_url: string;
  created_at: string;
}

const MyAvatars = () => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const { data, error } = await supabase
        .from("avatars")
        .select("id, name, processed_image_url, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvatars(data || []);
    } catch (error: any) {
      toast.error("Failed to load avatars");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("avatars")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setAvatars(avatars.filter((a) => a.id !== deleteId));
      toast.success("Avatar deleted");
    } catch (error: any) {
      toast.error("Failed to delete avatar");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading avatars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div aria-hidden className="h-[calc(var(--nav-height)+2rem)]" />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold">My Avatars</h1>
            <p className="text-muted-foreground">Manage your digital avatars</p>
          </div>
          <Button onClick={() => navigate("/capture")} variant="kusama">
            Create New Avatar
          </Button>
        </div>

        {avatars.length === 0 ? (
          <Card className="gallery-card max-w-md mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              <User className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">No avatars yet</h3>
              <p className="text-muted-foreground">Create your first avatar to get started</p>
              <Button onClick={() => navigate("/capture")} variant="kusama">
                Create Avatar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {avatars.map((avatar) => (
              <Card key={avatar.id} className="gallery-card overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-muted">
                    <img
                      src={avatar.processed_image_url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg">{avatar.name}</CardTitle>
                  <CardDescription>
                    Created {new Date(avatar.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button
                    onClick={() => navigate(`/try-on?avatar=${avatar.id}`)}
                    variant="kusama"
                    size="sm"
                    className="flex-1"
                  >
                    <ShirtIcon className="mr-2 h-4 w-4" />
                    Try On
                  </Button>
                  <Button
                    onClick={() => setDeleteId(avatar.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Avatar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this avatar and all associated snapshots. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyAvatars;
