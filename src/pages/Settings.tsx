import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, LogOut, User } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout
      title="Settings"
      description="Manage your account and preferences"
    >
      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" disabled />
              </div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Browser Extension */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Browser Extension
            </CardTitle>
            <CardDescription>
              Install the browser extension for automatic workflow capture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
              <div>
                <p className="font-medium">Opstrace Capture Extension</p>
                <p className="text-sm text-muted-foreground">
                  Coming soon - Automatically capture clicks, navigation, and form submissions
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team (Future) */}
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Invite team members and manage permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Team features coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Share SOPs and collaborate with your team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Account</CardTitle>
            <CardDescription>
              Sign out or manage your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
