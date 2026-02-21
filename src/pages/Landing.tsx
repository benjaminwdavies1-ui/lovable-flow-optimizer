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
    description: "We watch how you work — every click, every step — and capture it automatically. No manuals needed.",
    emoji: "🎬",
  },
  {
    icon: FileText,
    title: "Generate",
    description: "Your recordings become polished, structured SOPs in seconds. Ready to share with your whole team.",
    emoji: "📄",
  },
  {
    icon: Bot,
    title: "Automate",
    description: "AI spots repetitive patterns and recommends automations so your team can focus on what matters.",
    emoji: "⚡",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
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
    <div
      className="flex min-h-screen flex-col"
      style={{ background: `linear-gradient(180deg, hsl(var(--landing-hero-from)) 0%, hsl(var(--landing-bg)) 50%)` }}
    >
      {/* Nav */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105"
              style={{ background: `hsl(var(--landing-accent))` }}
            >
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: `hsl(var(--landing-text))` }}>
              Opstrace
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-full border-2 px-5 font-medium"
            style={{
              borderColor: `hsl(var(--landing-border))`,
              color: `hsl(var(--landing-text))`,
            }}
          >
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center px-6 pt-16 pb-24 sm:pt-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <div
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{
              background: `hsl(var(--landing-accent-soft))`,
              color: `hsl(var(--landing-accent))`,
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            Now accepting early access signups
          </div>

          <h1
            className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl"
            style={{ color: `hsl(var(--landing-text))` }}
          >
            Stop writing docs.
            <br />
            <span style={{ color: `hsl(var(--landing-accent))` }}>Start recording them.</span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-lg text-lg leading-relaxed sm:text-xl"
            style={{ color: `hsl(var(--landing-text-muted))` }}
          >
            Opstrace watches how you work, then writes the documentation for you.
            Record once, share forever.
          </p>
        </motion.div>

        {/* Email form */}
        <motion.div
          className="mx-auto mt-10 w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          {submitted ? (
            <div
              className="flex items-center justify-center gap-3 rounded-2xl p-5 text-center"
              style={{
                background: `hsl(var(--landing-accent-soft))`,
                color: `hsl(var(--landing-accent))`,
              }}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-medium">You're on the list — we'll reach out soon!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 rounded-full border-2 bg-white/80 px-5 py-3 text-base backdrop-blur-sm placeholder:text-muted-foreground/60"
                style={{ borderColor: `hsl(var(--landing-border))`, height: '48px' }}
              />
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full px-6 text-base font-semibold shadow-md transition-all hover:shadow-lg"
                style={{
                  background: `hsl(var(--landing-accent))`,
                  color: `hsl(var(--landing-accent-foreground))`,
                  height: '48px',
                }}
              >
                {submitting ? "Joining…" : (
                  <>
                    Join waitlist
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
          {!submitted && (
            <p className="mt-3 text-center text-sm" style={{ color: `hsl(var(--landing-text-muted))` }}>
              Free early access · No credit card required
            </p>
          )}
        </motion.div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group rounded-2xl border-2 p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{
                background: `hsl(var(--landing-card))`,
                borderColor: `hsl(var(--landing-border))`,
              }}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 2}
            >
              <span className="text-3xl">{f.emoji}</span>
              <h3
                className="mt-4 text-lg font-bold"
                style={{ color: `hsl(var(--landing-text))` }}
              >
                {f.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: `hsl(var(--landing-text-muted))` }}
              >
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Social proof / trust strip */}
        <motion.div
          className="mx-auto mt-20 max-w-lg text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
        >
          <p className="text-sm font-medium" style={{ color: `hsl(var(--landing-text-muted))` }}>
            Built for ops teams who are tired of writing the same doc twice.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="py-8 text-center text-sm"
        style={{
          color: `hsl(var(--landing-text-muted))`,
          borderTop: `1px solid hsl(var(--landing-border))`,
        }}
      >
        © {new Date().getFullYear()} Opstrace · All rights reserved
      </footer>
    </div>
  );
}
