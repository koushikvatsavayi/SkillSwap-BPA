import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { 
  BookOpen, 
  Code, 
  Music, 
  Palette, 
  Users, 
  Star, 
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";

const SKILL_CATEGORIES = [
  { icon: Code, name: "Programming", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { icon: BookOpen, name: "Tutoring", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  { icon: Music, name: "Music", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { icon: Palette, name: "Art & Design", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Peer-to-Peer Learning",
    description: "Connect directly with fellow students who have the skills you want to learn.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description: "Read authentic reviews from other students to find the best tutors.",
  },
  {
    icon: Sparkles,
    title: "Earn Badges",
    description: "Get recognized for your contributions with achievement badges.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "All interactions happen within our secure platform.",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Request sessions with just a few clicks and start learning immediately.",
  },
];

export default function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />
      
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-6">
                Student-powered learning platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
                Share Skills,{" "}
                <span className="text-primary">Grow Together</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
                SkillSwap connects students who want to learn with students who can teach. 
                Whether it's coding, music, art, or academics — find your perfect learning partner.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2" data-testid="button-go-to-dashboard">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="gap-2" data-testid="button-get-started">
                        Get Started Free
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/search">
                      <Button size="lg" variant="outline" data-testid="button-browse-skills">
                        Browse Skills
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-t bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Popular Skill Categories</h2>
              <p className="text-muted-foreground">Explore the most popular skills our students are sharing</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SKILL_CATEGORIES.map((category) => (
                <Card key={category.name} className="hover-elevate cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${category.color}`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose SkillSwap?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform is designed specifically for students, by students. 
                Here's what makes us different.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students already sharing skills on SkillSwap. 
              Create your free account today and start your learning journey.
            </p>
            {!user && (
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-join-now">
                  Join SkillSwap Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
