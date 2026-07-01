# OfferUp — Demo Scenario

**Status:** Ready for fallback implementation  
**Last updated:** 2026-06-19  
**Purpose:** Define one deterministic demo scenario for local fallback, presentation reliability, and product QA.

---

## 1. Scenario Summary

Demo user:

- Name: Xiaoyan Duan
- Language: English interview practice
- Background: non-native candidate with product/project experience in AI productivity tools
- Target role: AI Product Manager
- Market context: European B2B SaaS / AI tooling company

Demo promise:

> OfferUp turns a real resume and target role into specific interview questions, then shows what the interviewer heard and how to answer better.

---

## 2. Fixed Resume

```text
Xiaoyan Duan is a product-focused candidate with experience designing AI-assisted productivity workflows, user research, and cross-functional delivery.

Recent work includes an AI spreadsheet assistant project where she mapped user workflows, identified repeated formula and reporting tasks, and worked with engineering to prototype natural-language spreadsheet operations. She helped define user stories, prioritize spreadsheet scenarios, and collect feedback from early testers.

She also worked on a product analytics dashboard project for an internal team. The dashboard helped product and operations stakeholders track activation, retention, and feature usage. Her role included defining the metric structure, interviewing stakeholders, writing product requirements, coordinating with engineering, and improving the clarity of weekly product reviews.

Strengths:
- turning messy user needs into clear product requirements
- working across product, design, engineering, and business teams
- explaining AI features in plain language
- connecting user research with product iteration

Growth areas:
- sometimes describes work as "we" before explaining her own decisions
- needs stronger metrics and business outcomes in interview answers
- wants to sound more natural and confident in English interviews
```

---

## 3. Fixed Target JD

```text
Role: AI Product Manager
Company: Northstar Workflow AI
Location: Berlin / remote EU

Northstar Workflow AI builds AI assistants for operations teams in B2B SaaS companies. We are looking for an AI Product Manager who can discover high-value workflow problems, translate ambiguous customer needs into focused product requirements, and work closely with engineering to ship useful AI features.

Responsibilities:
- run user interviews with operations and product teams
- define product requirements for AI workflow features
- prioritize use cases based on customer pain, feasibility, and business impact
- partner with engineering on prototypes and evaluation criteria
- communicate clearly with non-technical stakeholders

Requirements:
- 2+ years of product or product-adjacent experience
- strong user research and product thinking
- experience with AI tools, automation, analytics, or productivity software
- ability to work in English with European cross-functional teams
- comfort with ambiguity and fast iteration
```

---

## 4. Setup Defaults

```json
{
  "mode": "focused",
  "focus_type": "resume_deep_dive",
  "level": "junior",
  "language": "en",
  "follow_up_intensity": "medium",
  "question_count": 3,
  "interviewer_agent": "hiring_manager"
}
```

---

## 5. Fixed Questions And Exchanges

### Q1 — AI Spreadsheet Assistant

Question:

```text
In your AI spreadsheet assistant project, how did you decide which user workflow was worth prototyping first?
```

Intent:

```text
Tests whether the candidate can move from broad AI enthusiasm to a concrete product decision based on user pain, feasibility, and impact.
```

Exchange:

```json
[
  {
    "role": "interviewer",
    "content": "In your AI spreadsheet assistant project, how did you decide which user workflow was worth prototyping first?",
    "is_followup": false
  },
  {
    "role": "candidate",
    "content": "We looked at many spreadsheet tasks and chose formula generation because users mentioned it a lot. We thought AI could help them save time and make the spreadsheet easier to use.",
    "is_followup": false
  },
  {
    "role": "interviewer",
    "content": "You said 'we chose it' — what was your specific contribution to that decision?",
    "is_followup": true
  },
  {
    "role": "candidate",
    "content": "I summarized feedback from testers and compared the tasks by frequency and difficulty. I recommended formula generation because it appeared in many interviews and was small enough for engineering to prototype quickly.",
    "is_followup": false
  }
]
```

### Q2 — Product Analytics Dashboard

Question:

```text
Tell me about the product analytics dashboard. What product decision did it help the team make?
```

Intent:

```text
Tests impact orientation, stakeholder understanding, and ability to connect dashboard work to a decision rather than only implementation.
```

Exchange:

```json
[
  {
    "role": "interviewer",
    "content": "Tell me about the product analytics dashboard. What product decision did it help the team make?",
    "is_followup": false
  },
  {
    "role": "candidate",
    "content": "The dashboard showed activation, retention, and feature usage. It helped the team review data every week and understand user behavior better.",
    "is_followup": false
  },
  {
    "role": "interviewer",
    "content": "Can you name one decision that changed because of the dashboard?",
    "is_followup": true
  },
  {
    "role": "candidate",
    "content": "Yes. We found that many new users used one template but did not continue to the reporting step. So the team changed onboarding to guide users from template selection to the first report.",
    "is_followup": false
  }
]
```

### Q3 — Working In English

Question:

```text
This role requires working with European engineering and customer-facing teams in English. How do you make sure your product requirements are understood clearly?
```

Intent:

```text
Tests communication maturity, cross-functional collaboration, and non-native English confidence.
```

Exchange:

```json
[
  {
    "role": "interviewer",
    "content": "This role requires working with European engineering and customer-facing teams in English. How do you make sure your product requirements are understood clearly?",
    "is_followup": false
  },
  {
    "role": "candidate",
    "content": "I try to write clear documents and use examples. Sometimes I also ask people if they understand my meaning, because English is not my first language.",
    "is_followup": false
  },
  {
    "role": "interviewer",
    "content": "What is one concrete method you use before engineering starts implementation?",
    "is_followup": true
  },
  {
    "role": "candidate",
    "content": "Before implementation, I write the user problem, expected behavior, edge cases, and acceptance criteria. Then I review it with engineering and ask them to explain the solution back, so I can catch unclear parts early.",
    "is_followup": false
  }
]
```

---

## 6. Fixed Feedback

Global interviewer view:

```json
{
  "summary": "You show relevant product experience for an AI workflow role, especially around user research and cross-functional delivery. The main risk is that your first answers often sound team-level before your personal ownership becomes clear.",
  "would_advance": true,
  "top_strength": "You can connect AI/product work to real user workflows.",
  "top_concern": "You need to name your own decisions earlier and quantify impact more consistently.",
  "overall_signal": "growing"
}
```

Global mentor view:

```json
{
  "top_gap": "Your strongest details usually appear only after a follow-up.",
  "priority_action": "Answer with ownership first: 'I decided / I recommended / I measured...' before explaining the team context.",
  "encouragement": "Your experience is relevant. The improvement is mostly packaging: make the signal visible sooner."
}
```

Per-question feedback pattern:

```json
{
  "answer_signal": "Relevant experience, but ownership appears late.",
  "interviewer_heard": "The interviewer first hears a team story, then only later understands your decision-making role.",
  "next_version_should_include": "Start with your recommendation, name the criteria you used, and add one measurable result or learning."
}
```

---

## 7. Fixed Polish Output

Polish target: Q1 first answer.

Polished answer:

```text
In the AI spreadsheet assistant project, I recommended that we prototype formula generation first. I made that recommendation after reviewing tester feedback and grouping repeated spreadsheet pain points by frequency, user frustration, and engineering feasibility. Formula generation stood out because users mentioned it often, it blocked them from completing reports, and it was small enough for engineering to validate quickly. This helped us avoid building a broad AI assistant too early and instead test one workflow where AI could create immediate value.
```

Why changed:

```json
[
  "It names the candidate's personal recommendation in the first sentence.",
  "It explains the decision criteria instead of only saying users mentioned the task.",
  "It connects the prototype choice to product focus and value, which fits the target AI PM role."
]
```

---

## 8. Fixed Answer Bank Example

```json
{
  "question_text": "In your AI spreadsheet assistant project, how did you decide which user workflow was worth prototyping first?",
  "tag": "resume_deep_dive",
  "source": "polished",
  "answer_group_id": "demo-answer-group-ai-spreadsheet",
  "version_number": 2,
  "original_answer": {
    "exchanges": "Use Q1 exchanges from this document"
  },
  "polished_answer": {
    "exchanges": [
      {
        "role": "candidate",
        "content": "In the AI spreadsheet assistant project, I recommended that we prototype formula generation first...",
        "is_followup": false
      }
    ],
    "polish_note": "Ownership first, clearer decision criteria, stronger AI PM signal."
  },
  "bank_answer": {
    "exchanges": [
      {
        "role": "candidate",
        "content": "In the AI spreadsheet assistant project, I recommended that we prototype formula generation first...",
        "is_followup": false
      }
    ]
  }
}
```

---

## 9. Demo Acceptance Path

The demo must support:

1. Landing page CTA.
2. Auth or demo logged-in state.
3. Dashboard with zero/early state.
4. Setup page with fixed resume/JD available.
5. Call transition.
6. Three-question text interview.
7. Feedback generation transition.
8. Feedback page with global and per-question feedback.
9. Polish Q1 answer.
10. Save polished answer to Answer Bank as a new version.

Demo fallback passes only if this path works without a live AI API key.
