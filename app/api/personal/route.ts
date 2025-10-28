import { corsHeaders } from "@/lib/cors";
import { NextResponse } from "next/server";
import { PersonalInformation } from "@/types";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET() {
    // Mock PersonalInformation data
    const mockPersonalInformation: PersonalInformation = {
        contact: {
            name: "Alex Johnson",
            email: "alex.johnson@example.com",
            phone: "+1-555-123-4567",
            portfolio_urls: [
                "https://github.com/alexjohnson",
                "https://alexjohnson.dev",
                "https://linkedin.com/in/alex-johnson"
            ]
        },
        eligibility: {
            work_authorization: [
                {
                    region: "United States",
                    status: "Authorized"
                },
                {
                    region: "Canada",
                    status: "Authorized"
                }
            ],
            security_clearance: "Secret",
            relocation: {
                willing: true,
                regions: ["North America", "Europe"]
            },
            remote: {
                willing: true,
                time_zone: "EST"
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
                "Toronto, ON",
                "London, UK"
            ]
        },
        preferences: {
            roles: [
                "Senior Software Engineer",
                "Lead Developer",
                "Engineering Manager",
                "Technical Lead"
            ],
            seniority: ["Senior", "Lead", "Principal"],
            company_size: ["Mid-size (50-500)", "Large (500+)", "Enterprise (1000+)"],
            work_mode: [
                { mode: "Remote" },
                { mode: "Hybrid" },
                { mode: "On-site" }
            ],
            industries: [
                "Technology",
                "FinTech",
                "HealthTech",
                "SaaS",
                "Cloud Computing"
            ]
        },
        skills: [
            {
                name: "JavaScript",
                aliases: ["JS", "ECMAScript"],
                category: "Programming Language",
                level: "Expert",
                years: 8,
                last_used: "2024",
                primary: true
            },
            {
                name: "TypeScript",
                aliases: ["TS"],
                category: "Programming Language", 
                level: "Expert",
                years: 6,
                last_used: "2024",
                primary: true
            },
            {
                name: "React",
                aliases: ["ReactJS", "React.js"],
                category: "Frontend Framework",
                level: "Expert",
                years: 7,
                last_used: "2024",
                primary: true
            },
            {
                name: "Node.js",
                aliases: ["NodeJS"],
                category: "Backend Framework",
                level: "Advanced",
                years: 6,
                last_used: "2024",
                primary: true
            },
            {
                name: "Next.js",
                aliases: ["NextJS"],
                category: "Full-stack Framework",
                level: "Advanced",
                years: 4,
                last_used: "2024",
                primary: false
            },
            {
                name: "Python",
                aliases: ["Py"],
                category: "Programming Language",
                level: "Intermediate",
                years: 3,
                last_used: "2023",
                primary: false
            }
        ],
        experience: {
            years_total: 10,
            domains: [
                "Web Development",
                "Full-stack Development",
                "Cloud Architecture",
                "DevOps",
                "Team Leadership"
            ],
            recent_titles: [
                "Senior Full Stack Engineer",
                "Lead Frontend Developer",
                "Software Engineer II"
            ],
            achievements: [
                {
                    tag: "Performance",
                    brief: "Improved application load time by 60% through optimization"
                },
                {
                    tag: "Leadership",
                    brief: "Led a team of 5 developers in rebuilding core platform"
                },
                {
                    tag: "Architecture",
                    brief: "Designed and implemented microservices architecture serving 1M+ users"
                }
            ]
        },
        education: [
            {
                degree: "Bachelor of Science",
                field: "Computer Science",
                institution: "Stanford University",
                graduation_year: 2014
            },
            {
                degree: "Master of Science",
                field: "Software Engineering",
                institution: "MIT",
                graduation_year: 2016
            }
        ],
        certifications: [
            {
                name: "AWS Solutions Architect Professional",
                issued: "2023",
                expires: "2026"
            },
            {
                name: "Certified Kubernetes Administrator",
                issued: "2022",
                expires: "2025"
            },
            {
                name: "Google Cloud Professional Developer",
                issued: "2021",
                expires: null
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
                language: "French",
                level: "Basic"
            }
        ],
        exclusions: {
            avoid_roles: [
                "Junior Developer",
                "Intern",
                "QA Tester"
            ],
            avoid_technologies: [
                "COBOL",
                "Visual Basic",
                "Flash"
            ],
            avoid_industries: [
                "Gambling",
                "Tobacco",
                "Adult Entertainment"
            ],
            avoid_companies: [
                "Meta",
                "TikTok"
            ]
        },
        motivations: [
            {
                topic: "Technical Growth",
                description: "Continuously learning new technologies and best practices",
                reason_lite: "Passion for innovation and staying current with tech trends"
            },
            {
                topic: "Team Collaboration",
                description: "Working with talented teams to solve complex problems",
                reason_lite: "Enjoys mentoring others and collaborative problem-solving"
            }
        ],
        career_goals: [
            {
                topic: "Engineering Leadership",
                description: "Transition into a technical leadership role managing engineering teams",
                reason_lite: "Want to scale impact through leading and developing other engineers"
            },
            {
                topic: "Product Innovation",
                description: "Work on cutting-edge products that make a meaningful impact",
                reason_lite: "Driven to build products that solve real-world problems"
            }
        ]
    };

    return NextResponse.json(mockPersonalInformation, { headers: corsHeaders() });
}

