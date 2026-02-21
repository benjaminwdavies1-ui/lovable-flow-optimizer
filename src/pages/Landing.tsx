import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Monitor, FileText, Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const features = [
  {
    icon: Monitor,
    title: "Record",
    description: "Capture every click and decision automatically as you work. No documentation effort required.",
  },
  {
    icon: FileText,
    title: "Generate",
    description: "Recordings become structured SOPs in seconds. Share with your team instantly.",
  },
  {
    icon: Bot,
    title: "Automate",
    description: "AI identifies repetitive patterns and recommends automations across your workflows.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function Landing() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        setSubmitted(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }

    toast.success("You're on the list! We'll be in touch.");
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Opstrace</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center px-6 pt-20 pb-24">
        <motion.div
          className="mx-auto max-w-xl text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3 w-3" />
            Now accepting early access signups
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            Stop writing docs.
            <br />
            <span className="text-primary">Start recording them.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Opstrace watches how you work, then writes the documentation for you.
            Record once, share forever.
          </p>
        </motion.div>

        {/* Email form */}
        <motion.div
          className="mx-auto mt-8 w-full max-w-sm"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          {submitted ? (
            <div className="flex items-center justify-center gap-2 border border-primary/20 bg-primary/5 p-3 text-center text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              You're on the list — we'll reach out soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-8"
              />
              <Button type="submit" disabled={submitting} size="default">
                {submitting ? "Joining…" : (
                  <>
                    Join waitlist
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}
          {!submitted && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Free early access · No credit card required
            </p>
          )}
        </motion.div>

        {/* Features */}
        <div className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="border border-border bg-card p-5"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 2}
            >
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mx-auto mt-16 max-w-md text-center text-xs text-muted-foreground"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
        >
          Built for ops teams who are tired of writing the same doc twice.
        </motion.p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Opstrace · All rights reserved
      </footer>
    </div>
  );
}
