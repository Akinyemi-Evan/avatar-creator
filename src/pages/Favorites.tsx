import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Loader2, Trash2 } from "lucide-react";
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

interface Snapshot {
  id: string;
  snapshot_image: string;
  notes: string | null;
  created_at: string;
  avatars: {
    name: string;
  };
}

const Favorites = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("outfit_snapshots")
        .select("id, snapshot_image, notes, created_at, avatars(name)")
        .eq("is_favorite", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSnapshots(data || []);
    } catch (error: any) {
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("outfit_snapshots")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setSnapshots(snapshots.filter((s) => s.id !== deleteId));
      toast.success("Removed from favorites");
    } catch (error: any) {
      toast.error("Failed to remove from favorites");
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("outfit_snapshots")
        .update({ notes })
        .eq("id", id);

      if (error) throw error;

      setSnapshots(snapshots.map((s) => (s.id === id ? { ...s, notes } : s)));
      delete editingNotes[id];
      setEditingNotes({ ...editingNotes });
      toast.success("Notes updated");
    } catch (error: any) {
      toast.error("Failed to update notes");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-bold">Favorite Outfits</h1>
          <p className="text-muted-foreground">Your saved outfit combinations</p>
        </div>

        {snapshots.length === 0 ? (
          <Card className="gallery-card">
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No favorites yet</h3>
              <p className="text-muted-foreground">
                Start favoriting outfits on the try-on page
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {snapshots.map((snapshot) => (
              <Card key={snapshot.id} className="gallery-card overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-muted">
                    <img
                      src={snapshot.snapshot_image}
                      alt="Outfit snapshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <CardTitle className="text-lg">{snapshot.avatars.name}</CardTitle>
                    <CardDescription>
                      Saved {new Date(snapshot.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {editingNotes[snapshot.id] !== undefined ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNotes[snapshot.id]}
                        onChange={(e) =>
                          setEditingNotes({ ...editingNotes, [snapshot.id]: e.target.value })
                        }
                        placeholder="Add notes..."
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNotes(snapshot.id, editingNotes[snapshot.id])}
                          variant="kusama"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            delete editingNotes[snapshot.id];
                            setEditingNotes({ ...editingNotes });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {snapshot.notes ? (
                        <p className="text-sm text-muted-foreground">{snapshot.notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No notes</p>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditingNotes({ ...editingNotes, [snapshot.id]: snapshot.notes || "" })
                        }
                        className="mt-2"
                      >
                        Edit Notes
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={() => setDeleteId(snapshot.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove from Favorites
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Favorites?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this outfit from your favorites. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfavorite}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Favorites;
