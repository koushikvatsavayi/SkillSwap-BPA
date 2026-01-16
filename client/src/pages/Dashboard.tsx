import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Skill, SessionWithDetails } from "@shared/schema";
import { 
  Plus, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Star,
  Award,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react";

const skillSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  type: z.enum(["offering", "seeking"]),
  experienceLevel: z.string().optional(),
});

type SkillFormValues = z.infer<typeof skillSchema>;

const CATEGORIES = [
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

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function SkillCard({ skill, onDelete }: { skill: Skill; onDelete?: () => void }) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold truncate">{skill.name}</h4>
              <Badge variant={skill.type === "offering" ? "default" : "secondary"} className="text-xs">
                {skill.type === "offering" ? "Offering" : "Seeking"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{skill.description || "No description"}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{skill.category}</Badge>
              {skill.experienceLevel && (
                <Badge variant="outline" className="text-xs capitalize">{skill.experienceLevel}</Badge>
              )}
            </div>
          </div>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SessionCardProps {
  session: SessionWithDetails;
  currentUserId: string;
  onUpdateStatus: (sessionId: string, status: string) => void;
  onReview: (session: SessionWithDetails) => void;
  isPending: boolean;
}

function SessionCard({ session, currentUserId, onUpdateStatus, onReview, isPending }: SessionCardProps) {
  const isRequester = session.requesterId === currentUserId;
  const isProvider = session.providerId === currentUserId;
  const otherUser = isRequester ? session.provider : session.requester;
  
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    accepted: "bg-green-500/10 text-green-600 dark:text-green-400",
    completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherUser.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold">{session.skill.name}</h4>
              <Badge className={statusColors[session.status] || ""} variant="outline">
                {session.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isRequester ? "With" : "From"}: {otherUser.fullName}
            </p>
            {session.scheduledAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {new Date(session.scheduledAt).toLocaleDateString()}
              </p>
            )}
            {session.message && (
              <p className="text-sm mt-2 bg-muted/50 p-2 rounded-md">{session.message}</p>
            )}
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {session.status === "pending" && isProvider && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => onUpdateStatus(session.id, "accepted")}
                    disabled={isPending}
                    data-testid={`button-accept-${session.id}`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdateStatus(session.id, "cancelled")}
                    disabled={isPending}
                    data-testid={`button-decline-${session.id}`}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Decline
                  </Button>
                </>
              )}
              {session.status === "accepted" && isProvider && (
                <Button 
                  size="sm" 
                  onClick={() => onUpdateStatus(session.id, "completed")}
                  disabled={isPending}
                  data-testid={`button-complete-${session.id}`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark Complete
                </Button>
              )}
              {session.status === "pending" && isRequester && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateStatus(session.id, "cancelled")}
                  disabled={isPending}
                  data-testid={`button-cancel-${session.id}`}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel Request
                </Button>
              )}
              {session.status === "completed" && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => onReview(session)}
                  data-testid={`button-review-${session.id}`}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Leave Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [sessionToReview, setSessionToReview] = useState<SessionWithDetails | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      type: "offering",
      experienceLevel: "",
    },
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills/my"],
    enabled: !!user,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<SessionWithDetails[]>({
    queryKey: ["/api/sessions/my"],
    enabled: !!user,
  });

  const addSkillMutation = useMutation({
    mutationFn: async (data: SkillFormValues) => {
      const response = await apiRequest("POST", "/api/skills", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills/my"] });
      setAddSkillOpen(false);
      form.reset();
      toast({ title: "Skill added", description: "Your skill has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add skill. Please try again.", variant: "destructive" });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const response = await apiRequest("DELETE", `/api/skills/${skillId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills/my"] });
      toast({ title: "Skill removed", description: "Your skill has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not remove skill.", variant: "destructive" });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/sessions/${sessionId}`, { status });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/my"] });
      const messages: Record<string, string> = {
        accepted: "Session accepted! You can now start teaching.",
        completed: "Session marked as complete. Don't forget to leave a review!",
        cancelled: "Session cancelled.",
      };
      toast({ title: "Session updated", description: messages[variables.status] || "Status updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update session.", variant: "destructive" });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: { sessionId: string; revieweeId: string; rating: number; comment: string }) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/my"] });
      setReviewDialogOpen(false);
      setSessionToReview(null);
      setReviewRating(5);
      setReviewComment("");
      toast({ title: "Review submitted", description: "Thank you for your feedback!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit review.", variant: "destructive" });
    },
  });

  const handleReviewSession = (session: SessionWithDetails) => {
    setSessionToReview(session);
    setReviewDialogOpen(true);
  };

  const submitReview = () => {
    if (!sessionToReview || !user) return;
    const revieweeId = sessionToReview.requesterId === user.id 
      ? sessionToReview.providerId 
      : sessionToReview.requesterId;
    createReviewMutation.mutate({
      sessionId: sessionToReview.id,
      revieweeId,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const offeringSkills = skills.filter((s) => s.type === "offering");
  const seekingSkills = skills.filter((s) => s.type === "seeking");
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  const badges = [];
  if (completedSessions >= 5) {
    badges.push({ name: "Top Tutor", icon: Award, color: "text-yellow-500" });
  }
  if (offeringSkills.length >= 3) {
    badges.push({ name: "Skill Master", icon: Star, color: "text-purple-500" });
  }
  if (skills.length >= 1) {
    badges.push({ name: "Getting Started", icon: CheckCircle, color: "text-green-500" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold" data-testid="text-user-name">{user.fullName}</h2>
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
                    
                    {badges.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {badges.map((badge) => (
                          <Badge key={badge.name} variant="secondary" className="gap-1">
                            <badge.icon className={`w-3 h-3 ${badge.color}`} />
                            {badge.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{offeringSkills.length}</p>
                      <p className="text-xs text-muted-foreground">Offering</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{seekingSkills.length}</p>
                      <p className="text-xs text-muted-foreground">Seeking</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedSessions}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Link href="/search">
                      <Button variant="outline" className="w-full gap-2">
                        <Search className="w-4 h-4" />
                        Find Skills
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Tabs defaultValue="skills" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="skills" className="gap-2" data-testid="tab-skills">
                    <GraduationCap className="w-4 h-4" />
                    My Skills
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="gap-2" data-testid="tab-sessions">
                    <Calendar className="w-4 h-4" />
                    Sessions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="skills" className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold">Your Skills</h3>
                      <p className="text-sm text-muted-foreground">Manage skills you offer and seek</p>
                    </div>
                    <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" data-testid="button-add-skill">
                          <Plus className="w-4 h-4" />
                          Add Skill
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add a New Skill</DialogTitle>
                          <DialogDescription>
                            Add a skill you can teach or want to learn
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit((data) => addSkillMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>I am...</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-skill-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="offering">Offering to teach</SelectItem>
                                      <SelectItem value="seeking">Looking to learn</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Skill Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Python Programming" {...field} data-testid="input-skill-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-category">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="experienceLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Experience Level (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-level">
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {EXPERIENCE_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe your skill or what you want to learn..." 
                                      {...field} 
                                      data-testid="input-skill-description"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={addSkillMutation.isPending} data-testid="button-submit-skill">
                                {addSkillMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  "Add Skill"
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {skillsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : skills.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h4 className="font-semibold mb-2">No skills yet</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add skills you can teach or want to learn
                        </p>
                        <Button onClick={() => setAddSkillOpen(true)} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Your First Skill
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {offeringSkills.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            Skills I'm Offering
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {offeringSkills.map((skill) => (
                              <SkillCard 
                                key={skill.id} 
                                skill={skill} 
                                onDelete={() => deleteSkillMutation.mutate(skill.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {seekingSkills.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-secondary" />
                            Skills I'm Seeking
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {seekingSkills.map((skill) => (
                              <SkillCard 
                                key={skill.id} 
                                skill={skill}
                                onDelete={() => deleteSkillMutation.mutate(skill.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Your Sessions</h3>
                    <p className="text-sm text-muted-foreground">View and manage your learning sessions</p>
                  </div>

                  {sessionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h4 className="font-semibold mb-2">No sessions yet</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Find skills to learn and request sessions with tutors
                        </p>
                        <Link href="/search">
                          <Button className="gap-2">
                            <Search className="w-4 h-4" />
                            Find Skills
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <SessionCard 
                          key={session.id} 
                          session={session} 
                          currentUserId={user.id}
                          onUpdateStatus={(sessionId, status) => updateSessionMutation.mutate({ sessionId, status })}
                          onReview={handleReviewSession}
                          isPending={updateSessionMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {sessionToReview && (
                sessionToReview.requesterId === user.id 
                  ? sessionToReview.provider.fullName 
                  : sessionToReview.requester.fullName
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1"
                    data-testid={`button-rating-${star}`}
                  >
                    <Star 
                      className={`w-6 h-6 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                data-testid="input-review-comment"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReview} 
              disabled={createReviewMutation.isPending}
              data-testid="button-submit-review"
            >
              {createReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
