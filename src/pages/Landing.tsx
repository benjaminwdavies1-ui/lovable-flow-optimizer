import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Monitor, FileText, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const features = [
  {
    icon: Monitor,
    title: "Record",
    description: "Capture your workflows automatically as you work — clicks, navigation, and decisions.",
  },
  {
    icon: FileText,
    title: "Generate",
    description: "Instantly turn recordings into structured, shareable Standard Operating Procedures.",
  },
  {
    icon: Bot,
    title: "Automate",
    description: "Get AI-powered suggestions to streamline and automate repetitive tasks.",
  },
];

export default function Landing() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("waitlist_emails" as any)
      .insert({ email: result.data } as any);

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already on the list!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }

    toast.success("You're on the list! We'll be in touch.");
    setEmail("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Opstrace</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Capture workflows.
            <br />
            <span className="text-primary">Generate SOPs.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Opstrace watches how you work, then writes the documentation for you. Record once, share forever.
          </p>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md gap-2">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Joining…" : "Join the Waitlist"}
            </Button>
          </form>
        </div>

        {/* Features */}
        <div className="mx-auto mt-20 grid max-w-4xl gap-8 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border/50 bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Opstrace. All rights reserved.
      </footer>
    </div>
  );
}
