import CoverLetterAgent, { CoverLetterOutput } from "@/lib/agents/coverLetter";
import CoverLetterGuidanceAgent, { CoverLetterGuidanceOutput } from "@/lib/agents/coverLetterGuidance";
import { jsonError } from "@/lib/api";
import { safeCall } from "@/lib/safeCall";
import { completeAgentRun, startAgentRun } from "@/lib/utils";
import { Runner } from "@openai/agents";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    {
        params
    }: {
        params: Promise<{ id: string }>;
    }

) {
    const { id: jobId } = await params;
    try {
        const coverLetterGuidanceAgent = new CoverLetterGuidanceAgent();
        const coverLetterAgent = new CoverLetterAgent();
        const runner = new Runner({ workflowName: 'jobManager - create guidance' });
        let runTrace = startAgentRun({
            agent: 'coverLetterGuidance',
            promptVersion: 'v1',
            input: { jobId }
        });
        const guidance = await safeCall<CoverLetterGuidanceOutput>('Cover Letter Guidance Agent', async () => {
            const runResult = await runner.run(coverLetterGuidanceAgent, `Provide detailed guidance on how to write a personalized cover letter for the job with ID: ${jobId}`);
            return runResult.finalOutput as CoverLetterGuidanceOutput;
        });
        completeAgentRun(runTrace, { output: guidance });
        runTrace = startAgentRun({
            agent: 'coverLetter',
            promptVersion: 'v1',
            input: null
        });
        const letterContent = await safeCall<CoverLetterOutput>('Cover Letter Agent', async () => {
            const runResult = await runner.run(coverLetterAgent, 'Write a cover letter.', { context: guidance });
            return runResult.finalOutput as CoverLetterOutput;
        });
        const letter = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html,body{
    margin:0;
    padding:0;
    background:#f6f6f6;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color:#111;
  }
  .page {
    width:210mm;           /* A4 width */
    min-height:297mm;      /* A4 height */
    margin:20px auto;
    background:#fff;
    padding:20mm;          /* document inner margin */
    box-shadow:0 4px 20px rgba(0,0,0,0.08);
    box-sizing:border-box;
  }
  p {
    margin: 0 0 1rem 0;    /* blank line after paragraphs */
    line-height:1.18;      /* close to single-line as DIN 5008 recommends single spacing */
    font-size:12pt;        /* typical readable business document size */
  }
  .doc {
    counter-reset: h1;
  }
  h1 {
    counter-reset: h2;
    font-size:18pt;
    font-weight:700;
    display:flex;
    gap:0.6rem;
    align-items:baseline;
  }
  h1::before{
    counter-increment: h1;
    content: counter(h1);
    min-width:3rem;
    text-align:left;
    font-weight:700;
  }

  /* Print adjustments: preserve A4 size, remove shadow */
  @media print {
    body { background: white; }
    .page { box-shadow:none; margin:0; padding:20mm; }
  }
</style>
</head>
<body>
  <article class="page doc">
    <header>
      <h1>${letterContent.subject}</h1>
    </header>
    <section>
      <article><p>${letterContent.salutation}</p></article>
    </section>
    <section>
        <article><p>${letterContent.introduction}</p></article>
      <article>
        <p>${letterContent.core_paragraphs}</p>
      </article>
      <article>
        <p>${letterContent.value_proposition}</p>
      </article>
      <article>${letterContent.strengths}</article>
    </section>
    <section>
        <article><p>${letterContent.conclusion}</p></article>
        <article><p>${letterContent.closing}</p></article>
        <article><p>${letterContent.signature}</p></article>
    </section>
  </article>
</body>
</html>`;
        completeAgentRun(runTrace, { output: letter });
        return new NextResponse(letter, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        return jsonError(500, 'CoverLetterGuidanceAgentInitializationError', (error as Error).message, req.headers.get('origin') || undefined);
    }
}