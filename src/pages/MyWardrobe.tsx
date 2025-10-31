import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClothingItem {
  id: string;
  clothing_url: string;
  tried_at: string;
  avatar_id: string;
  avatars: {
    name: string;
  };
}

const MyWardrobe = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      const { data, error } = await supabase
        .from("tried_on_clothes")
        .select("id, clothing_url, tried_at, avatar_id, avatars(name)")
        .order("tried_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Failed to load wardrobe");
    } finally {
      setLoading(false);
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
          <h1 className="text-4xl font-serif font-bold">My Wardrobe</h1>
          <p className="text-muted-foreground">All clothing items you've tried on</p>
        </div>

        {items.length === 0 ? (
          <Card className="gallery-card">
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <span className="text-5xl">👕</span>
              </div>
              <h3 className="text-xl font-semibold">No clothing tried yet</h3>
              <p className="text-muted-foreground">Start trying on clothes to build your wardrobe</p>
              <Button onClick={() => navigate("/try-on")} variant="kusama">
                Try On Clothes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="gallery-card overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-muted">
                    <img
                      src={item.clothing_url}
                      alt="Clothing item"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-sm truncate">
                    {item.avatars.name}
                  </CardTitle>
                  <CardDescription>
                    Tried {new Date(item.tried_at).toLocaleDateString()}
                  </CardDescription>
                  <Button
                    onClick={() => navigate(`/try-on?avatar=${item.avatar_id}`)}
                    variant="kusama"
                    size="sm"
                    className="w-full mt-4"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWardrobe;
