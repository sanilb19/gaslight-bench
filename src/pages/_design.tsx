import { useState } from "react";
import {
  Copy,
  FileText,
  Inbox,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Pencil,
  Share,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLink } from "@/components/kit/arrow-link";
import { EmptyState } from "@/components/kit/empty-state";
import { Favicon } from "@/components/kit/favicon";
import { KeyHint } from "@/components/kit/key-hint";
import { List, ListItem, ListSection } from "@/components/kit/list";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/kit/menu";
import { ProseLink } from "@/components/kit/prose-link";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Spinner } from "@/components/kit/spinner";
import { ThemedSurface } from "@/components/kit/themed-surface";
import { Tooltip } from "@/components/kit/tooltip";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 rounded-xl border bg-card/50 p-6">{children}</div>
    </section>
  );
}

/**
 * The design-kit showcase. Every reusable piece of this site's UI — the
 * shadcn `ui/` primitives and the `kit/` components layered on them — rendered
 * live in one place. Use it as the reference when building pages, and keep it
 * updated when you add or change a kit component.
 */
export default function DesignKitDemo() {
  const [view, setView] = useState<"grid" | "list" | "detail">("grid");

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <Badge variant="secondary">Design kit</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
            Components
          </h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            The building blocks for this site: shadcn/ui primitives (Base UI)
            in <code className="font-mono text-sm">components/ui</code>, and
            the site kit — opinionated, keyboard-friendly patterns — in{" "}
            <code className="font-mono text-sm">components/kit</code>.
          </p>
        </header>

        <Section
          id="buttons"
          title="Buttons & badges"
          description="ui/button and ui/badge — the core actions and labels."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        <Section
          id="tooltip"
          title="Tooltip"
          description="kit/tooltip — wrap any element to label it. Prefer this over the native title attribute."
        >
          <div className="flex items-center gap-3">
            <Tooltip label="Copy the current link">
              <Button variant="outline" size="icon" aria-label="Copy link">
                <Copy />
              </Button>
            </Tooltip>
            <Tooltip label="Tooltips work on focus too — try Tab" side="right">
              <Button variant="secondary">Hover or focus me</Button>
            </Tooltip>
          </div>
        </Section>

        <Section
          id="menu"
          title="Menu"
          description="kit/menu — a popup menu with arrow keys, type-ahead, shortcuts, and destructive rows."
        >
          <MenuTrigger>
            <MenuButton variant="outline">
              Actions <MoreHorizontal data-icon="inline-end" />
            </MenuButton>
            <Menu aria-label="Item actions">
              <MenuItem id="edit" icon={Pencil} shortcut="⌘E">
                Edit
              </MenuItem>
              <MenuItem id="share" icon={Share}>
                Share
              </MenuItem>
              <MenuSeparator />
              <MenuItem id="delete" icon={Trash2} variant="destructive">
                Delete
              </MenuItem>
            </Menu>
          </MenuTrigger>
        </Section>

        <Section
          id="list"
          title="List"
          description="kit/list — a keyboard-navigable collection (arrows, type-ahead, Home/End). For interactive lists, not static nav."
        >
          <List aria-label="Documents" selectionMode="single" defaultSelectedKeys={["roadmap"]}>
            <ListSection title="Recent">
              <ListItem id="roadmap" textValue="Roadmap">
                <FileText className="size-4 shrink-0" /> Roadmap
              </ListItem>
              <ListItem id="notes" textValue="Meeting notes">
                <FileText className="size-4 shrink-0" /> Meeting notes
              </ListItem>
              <ListItem id="ideas" textValue="Ideas">
                <FileText className="size-4 shrink-0" /> Ideas
              </ListItem>
            </ListSection>
          </List>
        </Section>

        <Section
          id="segmented"
          title="Segmented control"
          description="kit/segmented-control — the mode-switcher pattern, always one selected."
        >
          <SegmentedControl
            aria-label="View"
            value={view}
            onChange={setView}
            items={[
              { id: "grid", label: "Grid", icon: LayoutGrid },
              { id: "list", label: "List", icon: ListIcon },
              { id: "detail", label: "Detail", tooltip: "Expanded rows" },
            ]}
          />
        </Section>

        <Section
          id="empty"
          title="Empty state"
          description="kit/empty-state — the standard placeholder for anything with no content yet."
        >
          <EmptyState
            icon={Inbox}
            title="No messages yet"
            description="When someone writes to you, their message shows up here."
            action={<Button size="sm">Send your first message</Button>}
          />
        </Section>

        <Section
          id="loading"
          title="Spinner & key hints"
          description="kit/spinner — font-drawn loading glyphs; kit/key-hint — keyboard shortcut chips."
        >
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Loading
            </span>
            <Spinner variant="wave" size={24} />
            <KeyHint display="⌘K" />
            <KeyHint display="⌘ ⇧ Enter" />
          </div>
        </Section>

        <Section
          id="links"
          title="Links"
          description="kit/arrow-link for standalone directional links; kit/prose-link for links inside running text."
        >
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-6">
              <ArrowLink href="#buttons">Read more</ArrowLink>
              <ArrowLink href="#buttons" direction="left" leading>
                Back
              </ArrowLink>
              <ArrowLink href="https://zo.computer" direction="up-right">
                zo.computer
              </ArrowLink>
            </div>
            <p className="text-muted-foreground">
              Inline links in prose look like{" "}
              <ProseLink href="#tooltip">this anchor jump</ProseLink> or{" "}
              <ProseLink href="https://zo.computer" external>
                this external link
              </ProseLink>
              .
            </p>
          </div>
        </Section>

        <Section
          id="favicon"
          title="Favicon"
          description="kit/favicon — live brand marks by domain, with a globe fallback."
        >
          <div className="flex items-center gap-4">
            <Favicon domain="github.com" label="GitHub" />
            <Favicon domain="zo.computer" label="Zo" />
            <Favicon domain="stripe.com" label="Stripe" />
            <Favicon domain="not-a-real-domain-xyz.invalid" label="Fallback" />
          </div>
        </Section>

        <Section
          id="themed-surface"
          title="Themed surface"
          description="kit/themed-surface — re-theme a subtree by overriding semantic tokens; children keep using bg-background etc."
        >
          <ThemedSurface
            overrides={{
              background: "oklch(0.18 0.03 265)",
              foreground: "oklch(0.97 0.01 265)",
              card: "oklch(0.24 0.035 265)",
              "card-foreground": "oklch(0.97 0.01 265)",
              border: "oklch(0.97 0.01 265 / 14%)",
              "muted-foreground": "oklch(0.75 0.02 265)",
            }}
            className="rounded-lg bg-background p-6 text-foreground"
          >
            <Card>
              <CardHeader>
                <CardTitle>A pinned-dark card</CardTitle>
                <CardDescription>
                  This region carries its own palette regardless of the page
                  theme.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                Same components, same classes — only the tokens changed.
              </CardContent>
            </Card>
          </ThemedSurface>
        </Section>
      </div>
    </main>
  );
}
