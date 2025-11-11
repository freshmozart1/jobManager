import z from "zod";
import { CoverLetterOutlineSchema } from "@/lib/agents/schemas";
import { Agent, AgentOutputType } from "@openai/agents";
import { CoverLetterGuidanceOutput } from "@/lib/agents/coverLetterGuidance";

export type CoverLetterOutput = z.infer<typeof CoverLetterOutlineSchema>;

export default class CoverLetterAgent extends Agent<CoverLetterGuidanceOutput, AgentOutputType<CoverLetterOutput>> {
    constructor() {
        const { OPENAI_API_KEY } = process.env;
        if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY environment variable');
        super({
            name: 'Cover Letter Agent',
            model: 'gpt-5',
            modelSettings: {
                reasoning: {
                    effort: 'high',
                    summary: 'detailed'
                }
            },
            outputType: CoverLetterOutlineSchema,
            instructions: ({ context: {
                overview,
                job_snapshot,
                personal_snapshot,
                key_qualifications,
                company_values,
                recommended_style,
                strategic_tips,
                risks_and_avoid,
                emphasis_plan,
                outline_guidance,
                immediate_next_steps,
                formatting_rules,
                language,
                tips_source_echo
            } }) => [
                overview,
                `Job: ${JSON.stringify(job_snapshot, null, 2)}`,
                `Personal Information: ${JSON.stringify(personal_snapshot, null, 2)}`,
                `Key Qualifications of the applicant: ${JSON.stringify(key_qualifications, null, 2)}`,
                `Company Values: ${JSON.stringify(company_values, null, 2)}`,
                `Recommended writing style: ${JSON.stringify(recommended_style, null, 2)}`,
                `Strategic tips for writing the cover letter: ${JSON.stringify(strategic_tips, null, 2)}`,
                `Risks and things to avoid: ${JSON.stringify(risks_and_avoid, null, 2)}`,
                `Emphasis plan: ${JSON.stringify(emphasis_plan, null, 2)}`,
                `Outline Guidance: ${JSON.stringify(outline_guidance, null, 2)}`,
                `Immediate Next Steps: ${JSON.stringify(immediate_next_steps, null, 2)}`,
                `Formatting Rules: ${JSON.stringify(formatting_rules, null, 2)}`,
                `Language to use: ${language}`,
                `Other tips for writing the cover letter: ${tips_source_echo}`,
                `Output a personalized cover letter based on the above information as JSON. Follow the structure provided in the Outline Guidance section.`
            ].join('\n')
        });
    }
}