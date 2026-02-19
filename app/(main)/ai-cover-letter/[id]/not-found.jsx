import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center">
      <h1 className="text-6xl font-bold gradient-title mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Cover Letter Not Found</h2>
      <p className="text-gray-600 mb-8">
        The cover letter you&apos;re looking for doesn&apos;t exist or has been
        deleted.
      </p>
      <Link href="/ai-cover-letter">
        <Button>Back to Cover Letters</Button>
      </Link>
    </div>
  );
}
