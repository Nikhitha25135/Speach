import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, FileText, Upload, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">TranscriptEval AI</span>
          </div>
          <Button onClick={() => navigate("/evaluate")}>Start Evaluation</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-secondary-foreground mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Communication Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Evaluate Your <span className="bg-gradient-primary bg-clip-text text-transparent">Communication Skills</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Get instant, comprehensive feedback on your spoken communication skills through AI-powered 
            transcript analysis. Perfect for students, professionals, and educators.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/evaluate")}
              className="text-lg px-8"
            >
              <FileText className="w-5 h-5 mr-2" />
              Start Free Evaluation
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-lg px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our AI analyzes multiple aspects of your communication to provide detailed, actionable feedback
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">1. Submit Transcript</h3>
            <p className="text-muted-foreground">
              Paste your self-introduction transcript or upload a .txt file for instant analysis
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">2. AI Analysis</h3>
            <p className="text-muted-foreground">
              Our AI evaluates grammar, vocabulary, structure, clarity, and engagement using advanced NLP
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">3. Get Results</h3>
            <p className="text-muted-foreground">
              Receive a detailed score breakdown with specific feedback and downloadable reports
            </p>
          </Card>
        </div>
      </section>

      {/* Evaluation Criteria */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Evaluation Criteria</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "Salutation Quality", desc: "Proper greeting and introduction" },
              { name: "Structure & Flow", desc: "Logical organization and coherence" },
              { name: "Grammar Accuracy", desc: "Correct grammar and sentence structure" },
              { name: "Vocabulary Richness", desc: "Word variety and sophistication" },
              { name: "Clarity & Precision", desc: "Clear and concise expression" },
              { name: "Filler Words", desc: "Minimizing unnecessary words" },
              { name: "Sentiment", desc: "Positive and engaging tone" },
              { name: "Speech Rate", desc: "Optimal pacing (if duration provided)" },
            ].map((criterion, idx) => (
              <Card key={idx} className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-semibold text-foreground">{criterion.name}</h4>
                    <p className="text-sm text-muted-foreground">{criterion.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto p-8 md:p-12 text-center bg-gradient-primary">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Improve Your Communication?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Get instant feedback on your communication skills in seconds
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/evaluate")}
            className="text-lg px-8"
          >
            <FileText className="w-5 h-5 mr-2" />
            Start Your Free Evaluation
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 TranscriptEval AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
