// Evaluate.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, FileText, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// 👇 Update if your backend URL differs
const API_URL = "http://localhost:8000";

const Evaluate = () => {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [inputMethod, setInputMethod] = useState("paste"); // "paste" | "upload"

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/plain") {
        toast.error("Please upload a .txt file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result || "";
        setTranscript(text);
        toast.success("File uploaded successfully!");
      };
      reader.readAsText(file);
    }
  };

  const estimateDurationIfMissing = (text) => {
    // simple heuristic: assume 120 WPM average -> seconds = words / 120 * 60
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (!words) return "";
    const estimatedSec = Math.round((words / 120) * 60);
    return estimatedSec.toString();
  };

  const handleEvaluate = async () => {
    if (!transcript.trim()) {
      toast.error("Please provide a transcript to evaluate");
      return;
    }

    setIsEvaluating(true);

    try {
      const formData = new FormData();
      formData.append("transcript", transcript.trim());
      // if user didn't give duration, send an estimate (helps speech-rate)
      const durToSend = duration ? duration : estimateDurationIfMissing(transcript);
      formData.append("duration", durToSend ? durToSend : "");

      const res = await fetch(`${API_URL}/evaluate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        toast.error("Backend error. Check server logs.");
        setIsEvaluating(false);
        return;
      }

      const data = await res.json();

      // Save results for Results page
      sessionStorage.setItem("aiResults", JSON.stringify(data));

      navigate("/results");
    } catch (error) {
      console.error(error);
      toast.error("Could not connect to backend.");
    }

    setIsEvaluating(false);
  };

  const wordsCount = transcript.trim().split(/\s+/).filter((w) => w).length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">
                TranscriptEval AI
              </span>
            </div>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 text-foreground">
            Evaluate Your Transcript
          </h1>
          <p className="text-lg text-muted-foreground">
            Submit your self-introduction transcript for AI-powered analysis
          </p>
        </div>

        <Card className="p-6 md:p-8 animate-scale-in">
          <div className="flex gap-4 mb-6">
            <Button
              variant={inputMethod === "paste" ? "default" : "outline"}
              onClick={() => setInputMethod("paste")}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Paste Text
            </Button>
            <Button
              variant={inputMethod === "upload" ? "default" : "outline"}
              onClick={() => setInputMethod("upload")}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>

          {inputMethod === "paste" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="transcript" className="text-base mb-2 block">
                  Your Transcript *
                </Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your self-introduction transcript here..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[300px] resize-none"
                  disabled={isEvaluating}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {wordsCount} words
                </p>
              </div>

              <div>
                <Label htmlFor="duration" className="text-base mb-2 block">
                  Speech Duration (optional)
                </Label>
                <Input
                  id="duration"
                  type="text"
                  placeholder="e.g., 120 seconds"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isEvaluating}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Helps calculate speech rate for more accurate evaluation
                </p>
              </div>
            </div>
          )}

          {inputMethod === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary font-semibold">Click to upload</span>{" "}
                  or drag and drop
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  .txt files only (max 5MB)
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isEvaluating}
                />
              </div>

              {transcript && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2 text-foreground">
                    Uploaded Content Preview:
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {transcript}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="duration-upload" className="text-base mb-2 block">
                  Speech Duration (optional)
                </Label>
                <Input
                  id="duration-upload"
                  type="text"
                  placeholder="e.g., 120 seconds"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isEvaluating}
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button
              size="lg"
              onClick={handleEvaluate}
              disabled={isEvaluating || !transcript.trim()}
              className="flex-1"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Evaluate Transcript
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 bg-secondary/30 rounded-lg p-4 border border-secondary">
            <h4 className="font-semibold text-sm mb-2 text-secondary-foreground">
              💡 Evaluation Includes:
            </h4>
            <ul className="text-sm text-secondary-foreground/80 space-y-1">
              <li>• Salutation & Introduction Quality</li>
              <li>• Grammar, Structure & Flow Analysis</li>
              <li>• Vocabulary Richness Assessment</li>
              <li>• Clarity, Filler Words & Sentiment</li>
              <li>• Overall Communication Score (0-100)</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Evaluate;
