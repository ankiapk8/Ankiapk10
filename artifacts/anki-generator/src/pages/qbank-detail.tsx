import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Stethoscope, ArrowLeft } from "lucide-react";

export default function QbankDetail() {
  const [, params] = useRoute("/qbanks/:id");
  const id = params?.id;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
      <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
        <Stethoscope className="h-7 w-7 text-violet-600" />
      </div>
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-serif font-bold text-violet-700">Question Bank #{id}</h1>
        <p className="text-muted-foreground text-sm">The full question bank detail page is coming soon.</p>
      </div>
      <Link href="/decks">
        <Button variant="outline" className="gap-2 mt-2">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Button>
      </Link>
    </div>
  );
}
