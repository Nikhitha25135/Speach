// Results.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  const pdfRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("aiResults");
    if (!raw) {
      toast("No results found. Please evaluate a transcript first.");
      navigate("/");
      return;
    }

    try {
      setResults(JSON.parse(raw));
    } catch (e) {
      toast.error("Invalid results data.");
      navigate("/");
    }
  }, []);

  if (!results) return null;

  const { overall_score, details = [], meta = {} } = results;

  // -----------------------
  // CLEAN PROFESSIONAL PDF
  // -----------------------
  const downloadPDF = async () => {
    const capture = pdfRef.current;

    const canvas = await html2canvas(capture, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "pt", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 20, pdfWidth, imgHeight);
    pdf.save("Transcript_Evaluation_Report.pdf");
  };

  const formatNumber = (v, digits = 2) =>
    typeof v === "number" ? v.toFixed(digits) : v;

  return (
    <div className="min-h-screen bg-[#eef1f6]">
      {/* HEADER */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}

            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-lg">Back</span>
          </button>

          <Button variant="outline" onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div
        ref={pdfRef}
        className="container mx-auto px-6 py-12 max-w-5xl bg-white shadow-xl rounded-2xl"
      >
        {/* TITLE */}
        <h1 className="text-4xl font-black mb-8 text-gray-900 tracking-tight text-center">
          Transcript Evaluation Report
        </h1>

        {/* SCORE CARD */}
        <Card className="p-8 mb-10 shadow-md rounded-2xl">
          <div className="flex items-center justify-between flex-wrap gap-8">
            <div>
              <h2 className="text-7xl font-black text-gray-900">
                {formatNumber(overall_score, 0)}
              </h2>
              <p className="text-base text-gray-600 mt-2">
                Final Communication Score
              </p>
            </div>

            <div className="w-72">
              <Progress
                value={overall_score}
                className="h-4 rounded-full"
              />
              <p className="mt-2 text-sm text-gray-500">
                Higher score means better clarity & coherence
              </p>
            </div>
          </div>

          {/* META BADGES */}
          <div className="mt-6 flex gap-3 flex-wrap">
            <Badge variant="outline" className="bg-gray-100">
              Words: {meta.word_count}
            </Badge>
            <Badge variant="outline" className="bg-gray-100">
              WPM: {formatNumber(meta.wpm)}
            </Badge>
            <Badge variant="outline" className="bg-gray-100">
              Grammar Errors: {meta.grammar_errors}
            </Badge>
            <Badge variant="outline" className="bg-gray-100">
              Filler/100: {formatNumber(meta.filler_rate_per_100)}
            </Badge>
            <Badge variant="outline" className="bg-gray-100">
              Sentiment: {formatNumber(meta.sentiment)}
            </Badge>
          </div>
        </Card>

        {/* BREAKDOWN */}
        <Card className="p-8 mb-10 shadow-md rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">
            Criteria Breakdown
          </h3>

          <div className="space-y-5">
            {details.map((d, i) => {
              const pct = Math.round((d.score_normalized ?? 0) * 100);

              return (
                <div
                  key={i}
                  className="border rounded-xl p-5 shadow-sm bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">
                        {d.criterion}
                      </div>
                      <div className="text-xs text-gray-500">{d.metric}</div>
                    </div>

                    <div className="text-xl font-bold text-gray-900">
                      {pct}%
                    </div>
                  </div>

                  <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Weight: {d.weight}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* DETAILED META */}
        <Card className="p-8 shadow-md rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">
            Detailed Meta Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Word Count", meta.word_count],
              ["Duration (sec)", meta.duration_sec],
              ["Words Per Minute (WPM)", formatNumber(meta.wpm)],
              ["Vocabulary Richness (TTR)", formatNumber(meta.ttr)],
              ["Grammar Score", formatNumber(meta.grammar_score)],
              ["Grammar Errors", meta.grammar_errors],
              ["Filler Rate (per 100 words)", formatNumber(meta.filler_rate_per_100)],
              ["Sentiment Probability", formatNumber(meta.sentiment)],
            ].map(([label, value], index) => (
              <div
                key={index}
                className="bg-gray-100 p-4 rounded-xl flex justify-between"
              >
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-900 font-semibold">
                  {value ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Results;
