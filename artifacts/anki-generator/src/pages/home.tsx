import { useState } from "react";
import { useLocation } from "wouter";
import { useGenerateCards } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, UploadCloud } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const generateCards = useGenerateCards();

  const [text, setText] = useState("");
  const [deckName, setDeckName] = useState("");
  const [cardCount, setCardCount] = useState<number | "">("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
        if (!deckName) {
          setDeckName(file.name.split('.')[0]);
        }
      };
      // Note: for PDFs and DOCX this will read raw binary text which might be messy, 
      // but it's a simple fallback for the prompt instructions.
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, TXT, or DOCX file.",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      toast({ title: "Text required", description: "Please paste text or upload a file.", variant: "destructive" });
      return;
    }
    if (!deckName.trim()) {
      toast({ title: "Deck name required", description: "Please enter a name for your deck.", variant: "destructive" });
      return;
    }

    generateCards.mutate(
      {
        data: {
          text,
          deckName,
          cardCount: cardCount ? Number(cardCount) : undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Cards generated!",
            description: `Successfully created ${data.generatedCount} cards.`,
          });
          setLocation(`/decks/${data.deck.id}`);
        },
        onError: () => {
          toast({
            title: "Generation failed",
            description: "There was an error generating your cards. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in fade-in duration-500">
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-primary">
          Turn material into mastery.
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Paste your notes, lectures, or reading material, and AI will instantly generate focused Anki flashcards for your studies.
        </p>
      </div>

      <Card className="w-full border-border/50 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Source Material</CardTitle>
          <CardDescription>Paste text or upload a document to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Textarea
              placeholder="Paste your study material here..."
              className="min-h-[200px] resize-none text-base"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={generateCards.isPending}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx"
                disabled={generateCards.isPending}
              />
              <Button variant="outline" className="w-full flex gap-2 items-center justify-center no-default-hover-elevate">
                <UploadCloud className="h-4 w-4" />
                Upload File (PDF, TXT)
              </Button>
            </div>
            <div className="flex-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="deckName">Deck Name</Label>
              <Input
                id="deckName"
                placeholder="e.g. Biology 101 Midterm"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                disabled={generateCards.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardCount">Target Card Count (Optional)</Label>
              <Input
                id="cardCount"
                type="number"
                placeholder="e.g. 20"
                min="1"
                max="100"
                value={cardCount}
                onChange={(e) => setCardCount(e.target.value ? Number(e.target.value) : "")}
                disabled={generateCards.isPending}
              />
            </div>
          </div>

          <Button
            className="w-full py-6 text-lg font-medium"
            size="lg"
            onClick={handleGenerate}
            disabled={generateCards.isPending || !text.trim() || !deckName.trim()}
          >
            {generateCards.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Cards...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Generate Flashcards
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
