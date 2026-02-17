import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Trash2, Edit2, Search, Monitor, FileText, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "software", label: "Software & Tools", icon: Monitor },
  { value: "process", label: "Process Notes", icon: FileText },
  { value: "general", label: "General Knowledge", icon: BookOpen },
  { value: "tip", label: "Tips & Best Practices", icon: Lightbulb },
];

const categoryMap = Object.fromEntries(categories.map((c) => [c.value, c]));

export default function KnowledgeBase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "" });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["knowledge-entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (editingId) {
        const { error } = await supabase
          .from("knowledge_entries")
          .update({ title: form.title, content: form.content, category: form.category, tags })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("knowledge_entries")
          .insert({ title: form.title, content: form.content, category: form.category, tags, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Entry updated!" : "Entry added!");
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      resetForm();
    },
    onError: () => toast.error("Failed to save entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
    },
  });

  const resetForm = () => {
    setForm({ title: "", content: "", category: "general", tags: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const startEdit = (entry: any) => {
    setForm({ title: entry.title, content: entry.content, category: entry.category, tags: (entry.tags || []).join(", ") });
    setEditingId(entry.id);
    setDialogOpen(true);
  };

  const filtered = entries?.filter((e) => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || e.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <AppLayout
      title="Knowledge Base"
      description="Your team's centralized knowledge — software, processes, and best practices"
      actions={
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Entry</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Entry" : "Add Knowledge Entry"}</DialogTitle>
              <DialogDescription>Add information about your tools, processes, or business practices.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., How we use Salesforce" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Describe the tool, process, or knowledge..." className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g., CRM, sales, onboarding" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || !form.content.trim() || saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search knowledge base..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Badge variant={filterCat === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCat("all")}>All</Badge>
            {categories.map((c) => (
              <Badge key={c.value} variant={filterCat === c.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCat(c.value)}>{c.label}</Badge>
            ))}
          </div>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
          </div>
        ) : !filtered?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><BookOpen className="h-8 w-8 text-muted-foreground" /></div>
              <p className="text-lg font-medium mb-1">No entries yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add information about your software, processes, and team knowledge.</p>
              <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add First Entry</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => {
              const cat = categoryMap[entry.category] || categoryMap.general;
              const Icon = cat.icon;
              return (
                <Card key={entry.id} className="group relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{entry.title}</CardTitle>
                          <CardDescription className="text-xs">{cat.label}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}><Edit2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(entry.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4">{entry.content}</p>
                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {entry.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
