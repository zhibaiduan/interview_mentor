import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Add your background",
    description: "Upload your resume or paste your LinkedIn — once, reused every time."
  },
  {
    number: "02",
    title: "Pick a target role",
    description: "Choose a preset role or paste the exact job description you're applying for."
  },
  {
    number: "03",
    title: "Practice live",
    description: "Talk with an AI interviewer that adapts its questions based on what you say."
  },
  {
    number: "04",
    title: "Get feedback & polish",
    description: "See how a recruiter reads your answer — then refine it into something you'd actually say out loud."
  },
  {
    number: "05",
    title: "Build your question bank",
    description: "Save polished answers and key questions as your own interview asset."
  }
];

const values = [
  {
    number: "01",
    title: "Practice in your real context",
    description: "Questions are shaped by your resume, target role, and what you just said — so the practice feels like the real interview."
  },
  {
    number: "02",
    title: "Recruiter lens. Coach lens. Both.",
    description: "The recruiter signal tells you how you come across. The coach feedback tells you exactly what to fix and how."
  },
  {
    number: "03",
    title: "Build a personal asset, session by session",
    description: "Polish your answers until they're genuinely yours. Save the best questions into your own bank — preparation that compounds every time you apply."
  }
];

const focusedExamples = [
  "CV walkthrough & self-introduction",
  "Behavioral stories (STAR method)",
  "Motivation & \"Why this company?\"",
  "Case study or technical questions"
];

const roleExamples = [
  "Recruiter screen",
  "Hiring manager round",
  "Technical or case round",
  "Final fit conversation"
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <ProofSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <nav className="mx-auto flex h-20 max-w-landing items-center px-6 sm:px-10">
      <a className="font-display text-2xl leading-none" href="/">
        Offer<span className="text-[var(--text-muted)]">Up</span>
      </a>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto grid max-w-landing gap-12 px-6 pb-20 pt-10 sm:px-10 lg:grid-cols-[1fr_460px] lg:items-center lg:pb-28 lg:pt-20">
      <div>
        <p className="mb-5 font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          For non-native job seekers abroad
        </p>
        <h1 className="max-w-[760px] font-display text-[length:var(--text-2xl)] leading-tight sm:text-[length:var(--text-3xl)]">
          Turn your real experience into <em className="font-normal text-[var(--text-secondary)]">interview-ready answers.</em>
        </h1>
        <p className="mt-6 max-w-readable text-lg leading-body text-[var(--text-secondary)]">
          OfferUp uses your resume and target role to help you speak naturally, professionally, and still sound like yourself.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="/setup">
              Start your first practice
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
      </div>

      <div className="hidden rounded-md bg-[var(--bg-surface)] p-5 shadow-panel lg:grid lg:gap-5">
        <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          What OfferUp does
        </p>
        <p className="font-display text-xl leading-heading">
          “Walk me through your most impactful project.”
        </p>
        <div className="grid gap-3">
          <AnswerCompare
            label="Without preparation"
            tone="bad"
            text="I worked on a big product launch and the results were really good."
            tag="Vague · Not memorable"
          />
          <AnswerCompare
            label="With OfferUp"
            tone="good"
            text="Led WPS Smart Spreadsheet rollout — chose phased over full rewrite to hit the 2-week window. MAU 200K → 1.2M."
            tag="Pulled from your resume"
          />
        </div>
      </div>
    </section>
  );
}

function AnswerCompare({
  label,
  text,
  tag,
  tone
}: {
  label: string;
  text: string;
  tag: string;
  tone: "bad" | "good";
}) {
  const toneClass =
    tone === "good"
      ? "bg-[var(--bg-success)] text-[var(--text-success)]"
      : "bg-[var(--bg-warning)] text-[var(--text-warning)]";

  return (
    <div className="rounded-md bg-[var(--bg-page-soft)] p-4">
      <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="text-sm leading-body text-[var(--text-primary)]">{text}</p>
      <p className={`mt-3 inline-flex rounded-pill px-2.5 py-1 text-xs ${toneClass}`}>
        {tag}
      </p>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[var(--bg-page-soft)] py-20 sm:py-24">
      <div className="mx-auto max-w-landing px-6 sm:px-10">
        <p className="mb-4 font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          How it works
        </p>
        <h2 className="font-display text-[length:var(--text-2xl)] leading-heading">
          Five steps.
          <br />
          One session.
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-md bg-[var(--border-subtle)] md:grid-cols-5">
          {steps.map((step) => (
            <div key={step.number} className="bg-[var(--bg-surface)] p-5">
              <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {step.number}
              </p>
              <h3 className="mt-5 text-sm font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <ModeCard
            chip="Focused drill"
            title="Quick targeted practice"
            description="Ten-minute sessions for the moments that need work — no full interview required."
            examples={focusedExamples}
            cta="Start a drill"
          />
          <ModeCard
            chip="Role interview plan"
            title="Full-round simulation"
            description="Paste a target JD and practice realistic rounds from start to finish."
            examples={roleExamples}
            cta="Build a role plan"
          />
        </div>
      </div>
    </section>
  );
}

function ModeCard({
  chip,
  title,
  description,
  examples,
  cta
}: {
  chip: string;
  title: string;
  description: string;
  examples: string[];
  cta: string;
}) {
  return (
    <article className="grid gap-4 rounded-md bg-[var(--bg-surface)] p-5 shadow-panel">
      <p className="w-fit rounded-pill bg-[var(--bg-warning)] px-2.5 py-1 text-xs text-[var(--text-warning)]">
        {chip}
      </p>
      <div>
        <h3 className="font-display text-xl leading-heading">{title}</h3>
        <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <div className="grid gap-2">
        {examples.map((example) => (
          <div key={example} className="rounded-sm bg-[var(--bg-page-soft)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {example}
          </div>
        ))}
      </div>
      <Button asChild variant="secondary">
        <a href="/setup">
          {cta}
          <ArrowRight aria-hidden="true" size={16} />
        </a>
      </Button>
    </article>
  );
}

function ProofSection() {
  return (
    <section className="bg-[var(--color-paper-deep)] py-20 sm:py-24">
      <div className="mx-auto max-w-landing px-6 sm:px-10">
        <p className="mb-4 font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          The difference
        </p>
        <h2 className="font-display text-[length:var(--text-2xl)] leading-heading">
          See the gap,
          <br />
          then close it.
        </h2>

        <div className="mt-10 overflow-hidden rounded-md bg-[var(--bg-surface)] shadow-panel">
          <div className="px-5 py-4">
            <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Interviewer question
            </p>
            <p className="mt-2 font-display text-xl leading-heading">
              “Tell me about your most impactful project.”
            </p>
          </div>
          <div className="grid md:grid-cols-2">
            <div className="border-t border-[var(--border-subtle)] p-5 md:border-r">
              <p className="mb-3 text-sm font-semibold">Without preparation</p>
              <p className="text-sm leading-body text-[var(--text-secondary)]">
                “I worked on an important project with my team. I learned a lot, improved communication, and helped deliver good results.”
              </p>
              <p className="mt-4 inline-flex rounded-pill bg-[var(--bg-warning)] px-2.5 py-1 text-xs text-[var(--text-warning)]">
                Vague · Not memorable
              </p>
            </div>
            <div className="border-t border-[var(--border-subtle)] p-5">
              <p className="mb-3 text-sm font-semibold">With OfferUp</p>
              <p className="text-sm leading-body text-[var(--text-secondary)]">
                “I chose a phased rollout instead of a full rewrite because we had a two-week launch window. I owned the release plan, accepted short-term technical debt, and helped grow MAU from 200K to 1.2M.”
              </p>
              <p className="mt-4 inline-flex rounded-pill bg-[var(--bg-success)] px-2.5 py-1 text-xs text-[var(--text-success)]">
                Specific · Role-aware · From your CV
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {values.map((value) => (
            <div key={value.number}>
              <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {value.number}
              </p>
              <h3 className="mt-4 text-sm font-semibold">{value.title}</h3>
              <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-[var(--color-ink)] py-20 text-[var(--text-inverse)] sm:py-24">
      <div className="mx-auto max-w-landing px-6 text-center sm:px-10">
        <h2 className="font-display text-[length:var(--text-2xl)] leading-heading sm:text-[length:var(--text-3xl)]">
          Ready to practice
          <br />
          <em className="font-normal text-[rgba(250,247,241,0.62)]">with intention?</em>
        </h2>
        <p className="mx-auto mt-5 max-w-readable text-base leading-body text-[rgba(250,247,241,0.68)]">
          Your first session is free. Upload your resume, pick a role, and start in under ten minutes.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" variant="secondary">
            <a href="/setup">
              Start for free
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </Button>
        </div>
        <p className="mt-4 font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[rgba(250,247,241,0.34)]">
          No credit card required · Works in English, German, and Chinese
        </p>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(250,247,241,0.08)] bg-[var(--color-ink)] px-6 py-8 text-[rgba(250,247,241,0.42)] sm:px-10">
      <div className="mx-auto flex max-w-landing flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div className="font-display text-sm">
          Offer<span className="text-[rgba(250,247,241,0.24)]">Up</span>
        </div>
        <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em]">
          Built for non-native job seekers
        </div>
      </div>
    </footer>
  );
}
