import { Link } from 'react-router-dom';
import {
  Activity,
  FileSearch,
  GitBranch,
  ShieldCheck,
  Eye,
  Layers,
  Clock,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import { DisclaimerBanner } from '@/components/Badges';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">MedLens</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Try MedLens
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/60 via-white to-white" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
              <ShieldCheck className="h-4 w-4" />
              Clinical Information Intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Turn fragmented medical records into one structured, reviewable record.
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              MedLens uses AI to organize medical reports, preserve source context, detect inconsistencies, and create understandable summaries — without replacing professional medical judgment.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700"
              >
                Try MedLens
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              From fragmented records to information you can actually review.
            </p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">The Problem</h2>
            <p className="mt-4 text-lg text-slate-600">
              Medical information is fragmented across patient history, symptoms, conditions, allergies, medications, lab reports, prescriptions, and observations. Doctors, caregivers, and patients must manually read and compare multiple documents.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {['Patient History', 'Lab Reports', 'Prescriptions', 'Observations'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">The Solution</h2>
            <p className="mt-4 text-lg text-slate-600">
              MedLens transforms fragmented medical information into a structured, traceable, reviewable, and patient-friendly medical record.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <ScanLine className="h-6 w-6" />, title: 'AI Extraction', desc: 'Upload PDFs, images, or scanned reports. AI extracts structured lab values, medications, and observations.' },
              { icon: <GitBranch className="h-6 w-6" />, title: 'Full Provenance', desc: 'Every data point traces back to its source document, page, and exact text snippet.' },
              { icon: <Eye className="h-6 w-6" />, title: 'Human Verification', desc: 'Review, verify, edit, or reject every AI-extracted field. Original values are always preserved.' },
              { icon: <AlertTriangle className="h-6 w-6" />, title: 'Conflict Detection', desc: 'Automatically detects inconsistencies across documents — different medication strengths, values, or demographics.' },
              { icon: <Clock className="h-6 w-6" />, title: 'Timeline & Comparison', desc: 'View a chronological timeline and compare reports side by side with neutral wording.' },
              { icon: <FileText className="h-6 w-6" />, title: 'Safe AI Summary', desc: 'Patient-friendly summaries based only on available records — never diagnoses or recommends treatment.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">{f.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">How MedLens Works</h2>
            <p className="mt-4 text-lg text-slate-600">From upload to reviewable record in a structured pipeline.</p>
          </div>
          <div className="mt-12 space-y-4">
            {[
              { icon: <FileSearch className="h-5 w-5" />, step: '1', title: 'Upload', desc: 'Drag and drop medical reports — PDFs, images, or scanned documents.' },
              { icon: <ScanLine className="h-5 w-5" />, step: '2', title: 'AI Extraction', desc: 'Text extraction, OCR fallback, and structured lab value identification.' },
              { icon: <Layers className="h-5 w-5" />, step: '3', title: 'Structured Record', desc: 'Values are normalized, classified against source reference ranges, and mapped with provenance.' },
              { icon: <CheckCircle2 className="h-5 w-5" />, step: '4', title: 'Verification', desc: 'Humans verify, edit, or reject each extracted field. Originals are always preserved.' },
              { icon: <AlertTriangle className="h-5 w-5" />, step: '5', title: 'Conflict Detection', desc: 'Inconsistencies across documents are flagged for review.' },
              { icon: <FileText className="h-5 w-5" />, step: '6', title: 'Summary & Export', desc: 'Patient-friendly summary and structured PDF export with full disclaimers.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                  <span className="text-sm font-bold">{s.step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600">{s.icon}</span>
                    <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provenance & Verification */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <GitBranch className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Provenance System</h2>
              <p className="mt-3 text-slate-600">
                Every piece of information is tagged with its source type — User Provided, AI Extracted, AI Generated, or Verified. Never mix them. Click any value to trace it back to the original document and exact text.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['USER PROVIDED', 'AI EXTRACTED', 'AI GENERATED', 'VERIFIED'].map((b) => (
                  <span key={b} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{b}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Responsible AI</h2>
              <p className="mt-3 text-slate-600">
                MedLens never diagnoses, recommends treatment, or invents reference ranges. If information is unavailable, it says so. Confidence scores reflect extraction reliability, not medical certainty.
              </p>
              <div className="mt-6">
                <DisclaimerBanner />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Privacy & Security First</h2>
            <p className="mt-4 text-lg text-slate-600">
              Medical data is treated as highly sensitive. Authentication, authorization, row-level security, file validation, and audit trails are built in.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Lock className="h-5 w-5" />, title: 'Secure Auth', desc: 'Encrypted password handling and session management.' },
              { icon: <ShieldCheck className="h-5 w-5" />, title: 'Row-Level Security', desc: 'Each user only sees their own patient data.' },
              { icon: <FileText className="h-5 w-5" />, title: 'Audit Trail', desc: 'Every action is logged — uploads, edits, verifications, exports.' },
              { icon: <Stethoscope className="h-5 w-5" />, title: 'No Diagnosis', desc: 'AI organizes information. It never provides medical advice.' },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">{s.icon}</div>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl bg-teal-600 px-8 py-12 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white">Ready to try MedLens?</h2>
            <p className="mt-4 text-teal-50">
              Create an account, enter demo mode, and explore the full workflow with sample patient data.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">MedLens</span>
            <span className="text-sm text-slate-400">— From fragmented records to information you can actually review.</span>
          </div>
          <p className="text-xs text-slate-400">Not a medical device. Not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
