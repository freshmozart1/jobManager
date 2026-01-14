import { corsHeaders } from "@/lib/cors";
import { PersonalInformation } from "@/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * Generates comprehensive mock personal information data
 * conforming to the PersonalInformation type
 */
function generateMockPersonalInformation(): PersonalInformation {
    return {
        contact: {
            name: "Alex Morgan",
            email: "alex.morgan@example.com",
            phone: "+1-555-0123",
            address: {
                streetAddress: "123 Main St",
                addressLocality: "San Francisco",
                addressRegion: "CA",
                postalCode: "94102",
                addressCountry: "US"
            },
            portfolio_urls: [
                "https://alexmorgan.dev",
                "https://github.com/alexmorgan",
                "https://linkedin.com/in/alexmorgan"
            ]
        },
        eligibility: {
            work_authorization: [
                {
                    region: "United States",
                    status: "Citizen"
                },
                {
                    region: "European Union",
                    status: "Work Permit"
                }
            ],
            security_clearance: null,
            relocation: {
                willing: true,
                regions: ["North America", "Western Europe", "Remote"]
            },
            remote: {
                willing: true,
                time_zone: "UTC-5 (EST)"
            },
            availability: {
                notice_period_days: 30
            },
            work_schedule_constraints: {
                weekends: false,
                nights: false
            }
        },
        constraints: {
            salary_min: {
                currency: "USD",
                amount: 120000
            },
            locations_allowed: [
                "Remote",
                "New York, NY",
                "San Francisco, CA",
                "Austin, TX",
                "London, UK",
                "Berlin, Germany"
            ]
        },
        preferences: {
            roles: [
                "Senior Software Engineer",
                "Lead Developer",
                "Technical Architect",
                "Engineering Manager"
            ],
            seniority: ["Senior", "Staff", "Principal"],
            company_size: ["Scale-up (50-500)", "Large (500+)"],
            work_mode: [
                { mode: "Remote" },
                { mode: "Hybrid" }
            ],
            industries: [
                "Technology",
                "FinTech",
                "HealthTech",
                "AI/ML",
                "Cloud Infrastructure"
            ]
        },
        skills: [
            {
                name: "TypeScript",
                aliases: ["TS", "JavaScript"],
                category: "Programming Language",
                level: "Expert",
                years: 6,
                last_used: "2024-10",
                primary: true
            },
            {
                name: "React",
                aliases: ["React.js", "ReactJS"],
                category: "Frontend Framework",
                level: "Expert",
                years: 5,
                last_used: "2024-10",
                primary: true
            },
            {
                name: "Node.js",
                aliases: ["NodeJS", "Node"],
                category: "Backend Runtime",
                level: "Advanced",
                years: 5,
                last_used: "2024-10",
                primary: true
            },
            {
                name: "Next.js",
                aliases: ["NextJS"],
                category: "Full-Stack Framework",
                level: "Advanced",
                years: 3,
                last_used: "2024-10",
                primary: false
            },
            {
                name: "MongoDB",
                aliases: ["Mongo"],
                category: "Database",
                level: "Intermediate",
                years: 4,
                last_used: "2024-09",
                primary: false
            },
            {
                name: "AWS",
                aliases: ["Amazon Web Services"],
                category: "Cloud Platform",
                level: "Advanced",
                years: 4,
                last_used: "2024-10",
                primary: false
            }
        ],
        experience: [
            {
                from: new Date("2021-01-01"),
                to: new Date("2024-10-01"),
                role: "Senior Software Engineer",
                company: "Tech Corp",
                summary: "Led development of cloud-based applications serving 1M+ users. Designed and implemented microservices architecture. Mentored junior developers.",
                tags: ["TypeScript", "React", "Node.js", "AWS", "Leadership"]
            },
            {
                from: new Date("2018-06-01"),
                to: new Date("2021-01-01"),
                role: "Full-Stack Developer",
                company: "Startup Inc",
                summary: "Built and maintained web applications using React and Node.js. Optimized application performance resulting in 40% faster load times. Collaborated with cross-functional teams.",
                tags: ["JavaScript", "React", "Node.js", "MongoDB"]
            },
            {
                from: new Date("2016-07-01"),
                to: new Date("2018-06-01"),
                role: "Junior Developer",
                company: "Software Solutions LLC",
                summary: "Developed features for enterprise applications. Participated in code reviews and learned best practices. Fixed bugs and improved code quality.",
                tags: ["JavaScript", "HTML", "CSS", "SQL"]
            }
        ],
        education: [
            {
                degree: "Bachelor of Science",
                field: "Computer Science",
                institution: "University of Technology",
                graduation_year: 2016
            }
        ],
        certifications: [
            {
                name: "AWS Certified Solutions Architect",
                issued: "2022-03-01T00:00:00.000Z" as unknown as Date,
                expires: "2025-03-01T00:00:00.000Z" as unknown as Date
            },
            {
                name: "Certified Kubernetes Administrator",
                issued: "2023-01-01T00:00:00.000Z" as unknown as Date,
                expires: null
            },
            {
                name: "Legacy Certification (YYYY-MM format)",
                issued: "2021-06" as unknown as Date,
                expires: "2024-06" as unknown as Date
            }
        ],
        languages_spoken: [
            {
                language: "English",
                level: "Native"
            },
            {
                language: "Spanish",
                level: "Conversational"
            },
            {
                language: "German",
                level: "Basic"
            }
        ],
        exclusions: {
            avoid_roles: [
                "Sales Engineer",
                "Technical Writer"
            ],
            avoid_technologies: [
                "PHP",
                "Legacy ASP.NET"
            ],
            avoid_industries: [
                "Gambling",
                "Tobacco",
                "Weapons"
            ],
            avoid_companies: [
                "Meta",
                "Company X"
            ]
        },
        motivations: [
            {
                topic: "Technical Growth",
                description: "Working with cutting-edge technologies and solving complex technical challenges",
                reason_lite: "Love learning new tech"
            },
            {
                topic: "Impact",
                description: "Building products that positively impact millions of users worldwide",
                reason_lite: "Want to make a difference"
            },
            {
                topic: "Team Culture",
                description: "Collaborating with talented engineers in an inclusive, learning-focused environment",
                reason_lite: "Great team dynamics"
            }
        ],
        career_goals: [
            {
                topic: "Technical Leadership",
                description: "Transition into a technical leadership role where I can mentor junior developers and drive architectural decisions",
                reason_lite: "Want to lead and mentor"
            },
            {
                topic: "System Design",
                description: "Become an expert in distributed systems and large-scale architecture design",
                reason_lite: "Master system architecture"
            }
        ]
    };
}

/**
 * GET /api/mock/personal
 * Returns mock personal information data conforming to PersonalInformation type
 */
export async function GET(req: NextRequest) {
    const origin = req.headers.get('origin') || undefined;
    const headers = {
        ...corsHeaders(origin),
        'Content-Type': 'application/json'
    };

    try {
        const mockData = generateMockPersonalInformation();
        return NextResponse.json(mockData, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('Error generating mock personal information:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            {
                status: 500,
                statusText: 'Internal Server Error',
                headers
            }
        );
    }
}

/**
 * OPTIONS /api/mock/personal
 * Handle CORS preflight requests
 */
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin') || undefined;
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders(origin)
    });
}