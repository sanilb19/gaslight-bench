import { useEffect } from "react";
import { IconRocket } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Blank template - minimal starting point for your site.
 *
 * This is a simple welcome page that you can customize or replace entirely.
 * Ask Zo to help you build whatever you need.
 */

export default function BlankDemo() {
  const isDev = import.meta.env.MODE !== "production";
  useEffect(() => {
    console.log(`Zo site in ${isDev ? "development" : "production"} mode.`);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <header className="mb-12 text-center">
          <img
            src="/images/pegasus.png"
            alt="Zo"
            className="mx-auto mb-6 size-16 rounded-xl opacity-80"
          />
          <Badge variant="outline" className="mb-4">
            <IconRocket className="size-3" />
            Running on your Zo Computer
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Your new Zo site
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            You&apos;ve just created a new site running on your Zo Computer
          </p>
        </header>

        <Card className="mb-8 bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              This is your starting point — edit it, replace it, or build on it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Sites can host interactive pages, serve an API, or both. You can
              make as many sites as you like and control who has access.
            </p>
            <p>
              Zo can help you get started — ask to customize this page, add
              features, create local databases, or explore what's possible.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Getting started:</strong> This
              file is at{" "}
              <code className="text-xs">src/pages/blank-demo.tsx</code>. Edit it
              directly or ask Zo to help you build something new.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
