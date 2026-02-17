import { useState, useEffect } from "react";
import { Download, Monitor, Smartphone, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Install Opstrace</h1>
          <p className="text-muted-foreground">
            Install the app on your device for quick access and offline support.
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="flex items-center gap-4 p-6">
              <CheckCircle className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold">Already installed!</p>
                <p className="text-sm text-muted-foreground">
                  Opstrace is installed on this device. Look for it on your home screen or app launcher.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full text-lg h-14 gap-3">
            <Download className="h-5 w-5" />
            Install Opstrace
          </Button>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Monitor className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Desktop (Chrome / Edge)</p>
                    <p className="text-sm text-muted-foreground">
                      Click the install icon <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">⊕</span> in the address bar, or open the browser menu → "Install Opstrace".
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{isIOS ? "iPhone / iPad" : "Android"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isIOS
                        ? 'Tap the Share button, then "Add to Home Screen".'
                        : 'Tap the browser menu (⋮), then "Install app" or "Add to Home Screen".'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          {[
            { label: "Works Offline", icon: "📱" },
            { label: "Fast Launch", icon: "⚡" },
            { label: "Auto Updates", icon: "🔄" },
          ].map((f) => (
            <div key={f.label} className="space-y-1">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Install;