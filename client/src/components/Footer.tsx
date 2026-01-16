import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl">SkillSwap</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Connecting students to share knowledge and skills. Learn from your peers, teach what you know, and grow together.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/" className="hover:text-foreground transition-colors">Home</a></li>
              <li><a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a></li>
              <li><a href="/search" className="hover:text-foreground transition-colors">Find Skills</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">Help Center <ArrowUpRight className="w-3 h-3" /></a></li>
              <li><a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">Contact Us <ArrowUpRight className="w-3 h-3" /></a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <p className="text-center text-sm text-muted-foreground" data-testid="footer-credits">
            Koushik Vatsavayi, Anish Kandhi, Pratham Srivastava, SkillSwap, Justin Wakeland High School, Frisco, Texas, 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
