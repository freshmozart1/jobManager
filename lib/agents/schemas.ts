import z from "@/node_modules/zod/v3/external.cjs";


export const CoverLetterOutlineSchema = z.object({
    subject: z.string().describe('Subject line of the cover letter.'),
    salutation: z.string().describe('Salutation addressing the hiring manager or company.'),
    introduction: z.string().describe('Introduction paragraph setting the tone and purpose of the cover letter.'),
    core_paragraphs: z.string().describe('Main body paragraphs'),
    value_proposition: z.string().describe('Section highlighting the unique value the candidate brings to the company.'),
    strengths: z.string().describe('Paragraphs detailing the candidate’s key strengths and how they align with the job requirements.'),
    conclusion: z.string().describe('Conclusion paragraph summarizing the cover letter and expressing enthusiasm for the role.'),
    closing: z.string().describe('Formal closing statement before the signature.'),
    signature: z.string().describe('Candidate’s name and contact information.'),
});

export const CoverLetterGuidanceOutputSchema = z.object({
    overview: z.string(),
    job_snapshot: z.object({
        role_title: z.string(),
        company: z.string(),
        location: z.string(),
        seniority: z.string(),
        employment_type: z.string(),
        standout_requirements: z.array(z.string())
    }),
    personal_snapshot: z.object({
        key_skills_snippets: z.array(z.object({
            skill: z.string(),
            experience: z.string(),
            metric: z.string()
        })),
        experience_highlights: z.array(z.string()),
        motivations: z.array(z.string()),
        constraints: z.array(z.string())
    }),
    key_qualifications: z.array(z.string()),
    company_values: z.array(z.string()),
    recommended_style: z.object({
        voice: z.string(),
        tone: z.string(),
        pacing: z.string(),
        structural_cues: z.string()
    }),
    strategic_tips: z.array(z.string()),
    risks_and_avoid: z.array(z.string()),
    emphasis_plan: z.array(z.string()),
    outline_guidance: CoverLetterOutlineSchema,
    immediate_next_steps: z.array(z.string()),
    formatting_rules: z.object({
        paragraph_count: z.string(),
        bullet_usage: z.string(),
        metric_integration: z.string()
    }),
    language: z.string(),
    tips_source_echo: z.string()
});
