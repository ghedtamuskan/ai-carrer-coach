import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";
import { notFound } from "next/navigation";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  

  if (!id || id === "undefined") {
    notFound();
  }

  const letter = await getCoverLetter(id);

  if (!letter) {
    notFound();
  }
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <h1 className="text-6xl font-bold gradient-title mb-6">
          {letter?.jobTitle} at {letter?.companyName}
        </h1>
      </div>

      <CoverLetterPreview content={letter?.content} />
    </div>
  );
}