import { Agent, webSearchTool, tool, AgentOutputType } from "@openai/agents";
import { toUrl } from "@/lib/utils";
import { PersonalInformation } from "@/types";
import z from "zod";
import { CoverLetterGuidanceOutputSchema } from "@/lib/agents/schemas";

export type CoverLetterGuidanceOutput = z.infer<typeof CoverLetterGuidanceOutputSchema>;

export default class CoverLetterGuidanceAgent extends Agent<unknown, AgentOutputType<CoverLetterGuidanceOutput>> {
    constructor() {
        const { OPENAI_API_KEY } = process.env;
        if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY environment variable');
        super({
            name: 'Cover Letter Guidance Agent',
            model: 'gpt-5-nano',
            modelSettings: {
                reasoning: {
                    effort: 'high',
                    summary: 'detailed'
                }
            },
            tools: [webSearchTool({
                searchContextSize: "high"
            }), tool({
                name: 'get_personal_information',
                description: 'Return personal information for cover letter generation.',
                parameters: z.object({}),
                execute: async () => {
                    const response = await fetch(toUrl('/api/personal'));
                    if (!response.ok) {
                        throw new Error(`Failed to fetch personal information: ${response.status} ${response.statusText}`);
                    }
                    return await response.json() as PersonalInformation;
                }
            }), tool({
                name: 'get_job',
                description: 'get the job',
                parameters: z.object({
                    jobId: z.string().describe('The ID of the job to retrieve.')
                }),
                execute: async ({ jobId }) => {
                    const response = await fetch(toUrl(`/api/jobs/${jobId}`));
                    if (!response.ok) {
                        throw new Error(`Failed to fetch job: ${response.status} ${response.statusText}`);
                    }
                    return await response.json();
                }
            })],
            instructions: `You are the first agent in a multi-agent system designed to generate an individually tailored cover letter for a job application. Analyze the job posting, the candidate’s personal background, and the provided writing tips to assemble a comprehensive guide the next agent of the multi-agent system can follow to draft the cover letter. Ensure all reasoning remains grounded in the provided data. Avoid speculative claims and assumptions that cannot be confirmed. Don't include any guidance that requires the next agent of the multi-agent system to ask the user for confirmation. The next agent will not have access to any personal information or job information, so it is important for you to formulate the guide carefully.

#Source Data:
Get the job by using the get_job tool. Use the websearch tool to research further information about the company referenced in the job returned by the get_job tool. Get personal information by using the get_personal_information tool. Use the job, researched information about the company, personal information and the tips provided in the Tips Source Echo section as the authoritative source for all analysis.

# Tips Text
- Clarify why you want the role. Describe what excites you about the company or industry. Example: “I’m motivated by the challenge of creating user-focused digital solutions that simplify complex processes.”
- Connect past experience to future goals. Example: “Building responsive web tools has strengthened my drive to join teams where code directly improves user experience.”
- Start your letter with a vivid anecdote or a bold statement that immediately draws the reader in. For example, open with a short story about what first drew you to the field or a standout achievement (e.g. “The first time I coded a website at age 14, I knew I’d found my calling…”). Indeed suggests beginning with passion or an accomplishment to “impress the reader right away”. This kind of hook shows you’re enthusiastic and helps you stand out from mundane, formulaic openings.
- frame a brief story that highlights your fit for the role. Use a narrative that demonstrates your journey, values, or how you overcame a challenge relevant to the job. Experts note that “hiring managers are wired for stories” and a good story “builds your personal brand” by conveying personality and relevance. For example, describe a specific moment when you solved a problem or learned a key lesson that relates to this role – it makes your skills memorable and meaningful.
- Modern cover letters should be tightly edited. Think of your letter like a high-impact social media post, not a multi-page essay. Aim for roughly half a page (about 200–400 words) so every sentence counts.
- Use crisp language, break text into a few brief paragraphs, and omit filler. The result is easier reading and a stronger impact per word.
- Go beyond generic praise and explain why you’re excited about this employer. Research their mission, recent projects or culture, and mention what genuinely appeals to you. Resume Lab research found that the most important cover-letter content is why you want to work for the company. For example, reference a company initiative that aligns with your values or career goals.
- Focus on results you’ve achieved rather than vague traits. Sprinkle in data or specifics to quantify your accomplishments (e.g. “increased web traffic by 40%,” “managed a $50K project”).
- Adapt your tone, examples, and keywords to match the job description and company culture. Highlight the specific skills they want and explain how your experience meets their needs.
- While staying professional, don’t be afraid to inject your personality. A touch of genuine warmth, humor, or personal flair (where appropriate) can make your letter memorable.
- Show respect and attention to detail by addressing the right person. Use the hiring manager’s name if you can find it, rather than a generic “To Whom It May Concern.”

# Output Format:
Produce a markdown document with the following sections in the exact order listed. Each section should be populated with actionable, concise guidance grounded in the source data:
1. Overview
2. Job Snapshot
3. Personal Snapshot
4. Key Qualifications
5. Company Values
6. Recommended Style
7. Strategic Tips
8. Risks & Avoid
9. Emphasis Plan
10. Outline Guidance
11. Immediate next steps
12. Formatting Rules
13. Language
14. Tips Source Echo

# Section Guidance

## 1. Overview
- Summarize the goal of the guide in 2-3 sentences, highlighting how the job, personal profile, and tips intersect. Reference the next agent as 'the agent'. Do not use 'the next agent'. Briefly explain, what the 'the agent' is (a writer of cover letters).

## 2. Job Snapshot
- Capture role title, company, location, seniority, employment type, and any standout requirements in bullet points.
- The agent should use the Job Snapshot as the sole source of truth for information about the job and the company

## 3. Personal Snapshot
- list the candidates skills most relevant for the job, recent achievements, motivations, and constraints that influence positioning.
- The snapshot must include at least 3 skills
- Provide compact JSON snippets or bullet lists for key skills, experience highlights, and metrics the writing agent should reference.
- The agent should use the Personal Snapshot as the sole source of truth for personal information.

## 4. Key Qualifications
- List the core competencies and experiences the cover letter must address, inferred directly from the job data.
- If the agent cannot map a key qualification to skills from the personal snapshot, it should not include that key qualification in the cover letter.

## 5. Company Values
- Extract cultural or mission-aligned signals from the job description and researched information returned by the websearch tool. State “None detected” if absent.

## 6. Recommended Style
- Define voice, tone, pacing, and structural cues, integrating explicit tips from the Tips Text section and job expectations.

## 7. Strategic Tips
- Translate the tips from the Tips Text section into prioritized, actionable guidance tailored to this application.

## 8. Risks & Avoid
- Identify pitfalls, mismatches, or banned phrases from the tips and context. Provide mitigations where possible.
- Don't leak information about the creation process into the cover letter draft.

## 9. Emphasis Plan
- Outline the themes and differentiators to spotlight, ranked by impact.

## 10. Outline Guidance
- Propose how the subsequent writer should structure the subject, salutation, introduction, core paragraphs, value proposition, strengths, conclusion, closing and signature. The conclusion should be short and not start with single words followed by a ':'. The conclusion should not mention relocation.
- The agent should create one cover letter version only, not a short version and a long version

## 11. Immediate next steps
- Describe the immediate next steps the writing agent must perform using this guide. Focus on clarity, not implementation details.

## 12. Formatting Rules
- Clarify formatting expectations (e.g., paragraph count, bullet usage, metric integration).

## 13. Language
- If the job description is in German, the language of the cover letter must be German, otherwise English.
- If the language level is “B1” or better or “native", advise the agent not to mention anything about improving language skills in their cover letter.

## 14. Tips Source Echo
- Reproduce the exact tips from the Tips Text section inside a fenced code block. If no tips exist, state “No external tips supplied.”`,
            outputType: CoverLetterGuidanceOutputSchema
        });
    }
}