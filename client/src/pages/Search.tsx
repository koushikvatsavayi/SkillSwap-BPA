import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SkillWithUser } from "@shared/schema";
import { 
  Search as SearchIcon, 
  Loader2, 
  Star,
  MessageSquare,
  Filter,
  X
} from "lucide-react";

const CATEGORIES = [
  "All Categories",
  "Programming",
  "Mathematics",
  "Science",
  "Languages",
  "Music",
  "Art & Design",
  "Writing",
  "Sports & Fitness",
  "Other",
];

export default function Search() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillWithUser | null>(null);
  const [message, setMessage] = useState("");

  const { data: skills = [], isLoading } = useQuery<SkillWithUser[]>({
    queryKey: ["/api/search", searchQuery, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (category && category !== "All Categories") params.append("category", category);
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to search");
      return response.json();
    },
  });

  const requestSessionMutation = useMutation({
    mutationFn: async ({ skillId, providerId, message }: { skillId: string; providerId: string; message: string }) => {
      const response = await apiRequest("POST", "/api/sessions/request", { skillId, providerId, message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/my"] });
      setRequestDialogOpen(false);
      setMessage("");
      setSelectedSkill(null);
      toast({ title: "Session requested!", description: "The tutor will review your request." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not request session. Please try again.", variant: "destructive" });
    },
  });

  const handleRequestSession = (skill: SkillWithUser) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to request sessions.", variant: "destructive" });
      return;
    }
    setSelectedSkill(skill);
    setRequestDialogOpen(true);
  };

  const filteredSkills = skills.filter((skill) => skill.type === "offering" && skill.userId !== user?.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-search-title">Find Skills</h1>
            <p className="text-muted-foreground">Search for tutors and skills you want to learn</p>
          </div>

          <div className="bg-card border rounded-lg p-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search skills (e.g., Python, Guitar, Calculus...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchQuery || category !== "All Categories") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchQuery("");
                      setCategory("All Categories");
                    }}
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSkills.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No skills found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || category !== "All Categories"
                    ? "Try adjusting your search or filters"
                    : "Be the first to add a skill!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map((skill) => (
                <Card key={skill.id} className="hover-elevate" data-testid={`card-skill-${skill.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {skill.user.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{skill.name}</h3>
                        <p className="text-sm text-muted-foreground">by {skill.user.fullName}</p>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                      {skill.description || "No description provided"}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <Badge variant="outline">{skill.category}</Badge>
                      {skill.experienceLevel && (
                        <Badge variant="secondary" className="capitalize text-xs">
                          {skill.experienceLevel}
                        </Badge>
                      )}
                    </div>

                    <Button
                      className="w-full mt-4 gap-2"
                      onClick={() => handleRequestSession(skill)}
                      disabled={!user}
                      data-testid={`button-request-${skill.id}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Request Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Session</DialogTitle>
            <DialogDescription>
              Send a message to {selectedSkill?.user.fullName} about learning {selectedSkill?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSkill && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedSkill.user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedSkill.name}</p>
                    <p className="text-sm text-muted-foreground">with {selectedSkill.user.fullName}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain what you'd like to learn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-2"
                  data-testid="input-session-message"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSkill) {
                  requestSessionMutation.mutate({
                    skillId: selectedSkill.id,
                    providerId: selectedSkill.userId,
                    message,
                  });
                }
              }}
              disabled={requestSessionMutation.isPending}
              data-testid="button-confirm-request"
            >
              {requestSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
