import { Link } from "wouter";
import { useListDecks, useCreateDeck, useDeleteDeck, getListDecksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Layers, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Decks() {
  const { data: decks, isLoading } = useListDecks();
  const deleteDeck = useDeleteDeck();
  const createDeck = useCreateDeck();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");

  const handleCreate = () => {
    if (!newDeckName.trim()) return;
    createDeck.mutate(
      { data: { name: newDeckName, description: newDeckDesc } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDecksQueryKey() });
          setCreateOpen(false);
          setNewDeckName("");
          setNewDeckDesc("");
          toast({ title: "Deck created successfully." });
        },
      }
    );
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this deck?")) {
      deleteDeck.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDecksQueryKey() });
            toast({ title: "Deck deleted." });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Your Library</h1>
          <p className="text-muted-foreground mt-1">Browse and manage your flashcard decks.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>Create an empty deck to add cards to later.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="e.g. Spanish Vocab" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea id="desc" value={newDeckDesc} onChange={(e) => setNewDeckDesc(e.target.value)} placeholder="What is this deck for?" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newDeckName.trim() || createDeck.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : decks?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-card">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">No decks yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">Start by generating some cards or create an empty deck.</p>
          <Button onClick={() => setCreateOpen(true)}>Create Deck</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks?.map((deck, idx) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <Card className="h-full cursor-pointer hover-elevate transition-all duration-300 border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl line-clamp-1">{deck.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(deck.createdAt), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                      onClick={(e) => handleDelete(deck.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {deck.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
                    <Layers className="h-4 w-4" />
                    {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
