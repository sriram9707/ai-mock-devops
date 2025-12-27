import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="container" style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center", 
      textAlign: "center",
      paddingTop: "4rem",
      paddingBottom: "4rem"
    }}>
      <main style={{ width: "100%", maxWidth: "1200px" }}>
        <div className="animate-fade-in" style={{ marginBottom: "3rem" }}>
          <h1 style={{ marginBottom: "1.5rem", lineHeight: 1.1 }}>
            Master Your Interview <br />
            <span className="text-gradient">With AI Precision</span>
          </h1>
          <p style={{ 
            fontSize: "1.25rem", 
            color: "var(--muted)", 
            maxWidth: "700px", 
            margin: "0 auto 3rem",
            lineHeight: 1.7
          }}>
            Practice with realistic AI personas, get instant feedback, and land your dream job. 
            The future of interview prep is here.
          </p>

          <div style={{ 
            display: "flex", 
            gap: "1rem", 
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem" 
            }}>
              Get Started <ArrowRight size={20} />
            </Link>
            <button className="btn btn-outline" style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem" 
            }}>
              View Demo
            </button>
          </div>
        </div>

        <div style={{ 
          marginTop: "6rem", 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "2rem", 
          width: "100%",
          textAlign: "left"
        }}>
          <div className="glass-card animate-slide-up delay-100" style={{ 
            padding: "2.5rem",
            borderRadius: "var(--radius-lg)"
          }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "var(--radius)", 
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem"
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <h3 style={{ marginBottom: "1rem", color: "var(--foreground)" }}>Realistic Personas</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>Practice with AI interviewers that adapt to your role and experience level.</p>
          </div>
          
          <div className="glass-card animate-slide-up delay-200" style={{ 
            padding: "2.5rem",
            borderRadius: "var(--radius-lg)"
          }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "var(--radius)", 
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem"
            }}>
              <Zap size={24} color="white" />
            </div>
            <h3 style={{ marginBottom: "1rem", color: "var(--foreground)" }}>Instant Feedback</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>Get detailed scoring and actionable insights immediately after your session.</p>
          </div>
          
          <div className="glass-card animate-slide-up delay-300" style={{ 
            padding: "2.5rem",
            borderRadius: "var(--radius-lg)"
          }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "var(--radius)", 
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem"
            }}>
              <Target size={24} color="white" />
            </div>
            <h3 style={{ marginBottom: "1rem", color: "var(--foreground)" }}>Role Specific</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>Tailored questions for SDE, DevOps, PM, and more.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
