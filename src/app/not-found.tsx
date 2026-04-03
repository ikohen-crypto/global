import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-20 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>We couldn&apos;t find that page</CardTitle>
          <CardDescription>
            The route may be invalid, outdated, or filtered into an empty state.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild={false}>
            <Link href="/">Back to home</Link>
          </Button>
          <Button variant="outline" asChild={false}>
            <Link href="/compare">Open compare tool</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
