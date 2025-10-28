'use client';

import { useEffect, useState } from "react";
import useToUrl from "@/hooks/useToUrl";
import { PersonalInformation } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Save } from "lucide-react";

export default function PersonalPage() {
    const toUrl = useToUrl();
    const [personalInfo, setPersonalInfo] = useState<PersonalInformation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedField, setEditedField] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(toUrl('/api/personal'), { signal: controller.signal })
            .then(res => res.json())
            .then((data: PersonalInformation) => {
                setPersonalInfo(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching personal information:', err);
                    setLoading(false);
                }
            });
        return () => {
            controller.abort('Component cleanup');
        };
    }, [toUrl]);

    const handleSave = async (type: string, value: unknown) => {
        setSaving(true);
        setEditedField(type);
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, value })
            });
            if (response.ok) {
                const updated = await response.json();
                setPersonalInfo(prev => prev ? { ...prev, [type]: updated.value } : null);
            }
        } catch (saveError) {
            console.error('Error saving:', saveError);
        } finally {
            setSaving(false);
            setEditedField(null);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading personal information</p>
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (!personalInfo) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Failed to load personal information</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Personal Information</h1>

            {/* Contact */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Your contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={personalInfo.contact.name}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    contact: { ...prev.contact, name: e.target.value }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={personalInfo.contact.email}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    contact: { ...prev.contact, email: e.target.value }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={personalInfo.contact.phone}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    contact: { ...prev.contact, phone: e.target.value }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="portfolio">Portfolio URLs (comma-separated)</Label>
                            <Input
                                id="portfolio"
                                value={personalInfo.contact.portfolio_urls.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    contact: { ...prev.contact, portfolio_urls: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={() => handleSave('contact', personalInfo.contact)}
                        disabled={saving && editedField === 'contact'}
                    >
                        {saving && editedField === 'contact' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Contact
                    </Button>
                </CardContent>
            </Card>

            {/* Constraints */}
            <Card>
                <CardHeader>
                    <CardTitle>Job Constraints</CardTitle>
                    <CardDescription>Your salary and location requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="salary-currency">Salary Currency</Label>
                            <Input
                                id="salary-currency"
                                value={personalInfo.constraints.salary_min.currency}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    constraints: {
                                        ...prev.constraints,
                                        salary_min: { ...prev.constraints.salary_min, currency: e.target.value }
                                    }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="salary-amount">Minimum Salary</Label>
                            <Input
                                id="salary-amount"
                                type="number"
                                value={personalInfo.constraints.salary_min.amount}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    constraints: {
                                        ...prev.constraints,
                                        salary_min: { ...prev.constraints.salary_min, amount: Number(e.target.value) }
                                    }
                                } : null)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="locations">Allowed Locations (comma-separated)</Label>
                            <Input
                                id="locations"
                                value={personalInfo.constraints.locations_allowed.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    constraints: {
                                        ...prev.constraints,
                                        locations_allowed: e.target.value.split(',').map(s => s.trim())
                                    }
                                } : null)}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={() => handleSave('constraints', personalInfo.constraints)}
                        disabled={saving && editedField === 'constraints'}
                    >
                        {saving && editedField === 'constraints' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Constraints
                    </Button>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Job Preferences</CardTitle>
                    <CardDescription>Your preferred roles and work environment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="roles">Preferred Roles (comma-separated)</Label>
                            <Input
                                id="roles"
                                value={personalInfo.preferences.roles.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, roles: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="seniority">Seniority Levels (comma-separated)</Label>
                            <Input
                                id="seniority"
                                value={personalInfo.preferences.seniority.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, seniority: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="company-size">Company Sizes (comma-separated)</Label>
                            <Input
                                id="company-size"
                                value={personalInfo.preferences.company_size.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, company_size: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="industries">Industries (comma-separated)</Label>
                            <Input
                                id="industries"
                                value={personalInfo.preferences.industries.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, industries: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={() => handleSave('preferences', personalInfo.preferences)}
                        disabled={saving && editedField === 'preferences'}
                    >
                        {saving && editedField === 'preferences' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Preferences
                    </Button>
                </CardContent>
            </Card>

            {/* Skills */}
            <Card>
                <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>Your technical and professional skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="skills-json">Skills (JSON format)</Label>
                        <Textarea
                            id="skills-json"
                            rows={8}
                            value={JSON.stringify(personalInfo.skills, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, skills: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('skills', personalInfo.skills)}
                        disabled={saving && editedField === 'skills'}
                    >
                        {saving && editedField === 'skills' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Skills
                    </Button>
                </CardContent>
            </Card>

            {/* Experience */}
            <Card>
                <CardHeader>
                    <CardTitle>Experience</CardTitle>
                    <CardDescription>Your professional experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="experience-json">Experience (JSON format)</Label>
                        <Textarea
                            id="experience-json"
                            rows={8}
                            value={JSON.stringify(personalInfo.experience, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, experience: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('experience', personalInfo.experience)}
                        disabled={saving && editedField === 'experience'}
                    >
                        {saving && editedField === 'experience' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Experience
                    </Button>
                </CardContent>
            </Card>

            {/* Education */}
            <Card>
                <CardHeader>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>Your educational background</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="education-json">Education (JSON format)</Label>
                        <Textarea
                            id="education-json"
                            rows={6}
                            value={JSON.stringify(personalInfo.education, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, education: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('education', personalInfo.education)}
                        disabled={saving && editedField === 'education'}
                    >
                        {saving && editedField === 'education' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Education
                    </Button>
                </CardContent>
            </Card>

            {/* Eligibility */}
            <Card>
                <CardHeader>
                    <CardTitle>Eligibility</CardTitle>
                    <CardDescription>Work authorization and availability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="eligibility-json">Eligibility (JSON format)</Label>
                        <Textarea
                            id="eligibility-json"
                            rows={10}
                            value={JSON.stringify(personalInfo.eligibility, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, eligibility: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('eligibility', personalInfo.eligibility)}
                        disabled={saving && editedField === 'eligibility'}
                    >
                        {saving && editedField === 'eligibility' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Eligibility
                    </Button>
                </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                    <CardDescription>Your professional certifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="certifications-json">Certifications (JSON format)</Label>
                        <Textarea
                            id="certifications-json"
                            rows={6}
                            value={JSON.stringify(personalInfo.certifications, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, certifications: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('certifications', personalInfo.certifications)}
                        disabled={saving && editedField === 'certifications'}
                    >
                        {saving && editedField === 'certifications' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Certifications
                    </Button>
                </CardContent>
            </Card>

            {/* Languages */}
            <Card>
                <CardHeader>
                    <CardTitle>Languages</CardTitle>
                    <CardDescription>Languages you speak</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="languages-json">Languages (JSON format)</Label>
                        <Textarea
                            id="languages-json"
                            rows={6}
                            value={JSON.stringify(personalInfo.languages_spoken, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, languages_spoken: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('languages_spoken', personalInfo.languages_spoken)}
                        disabled={saving && editedField === 'languages_spoken'}
                    >
                        {saving && editedField === 'languages_spoken' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Languages
                    </Button>
                </CardContent>
            </Card>

            {/* Exclusions */}
            <Card>
                <CardHeader>
                    <CardTitle>Exclusions</CardTitle>
                    <CardDescription>Things you want to avoid</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="avoid-roles">Avoid Roles (comma-separated)</Label>
                            <Input
                                id="avoid-roles"
                                value={personalInfo.exclusions.avoid_roles.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_roles: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="avoid-technologies">Avoid Technologies (comma-separated)</Label>
                            <Input
                                id="avoid-technologies"
                                value={personalInfo.exclusions.avoid_technologies.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_technologies: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="avoid-industries">Avoid Industries (comma-separated)</Label>
                            <Input
                                id="avoid-industries"
                                value={personalInfo.exclusions.avoid_industries.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_industries: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="avoid-companies">Avoid Companies (comma-separated)</Label>
                            <Input
                                id="avoid-companies"
                                value={personalInfo.exclusions.avoid_companies.join(', ')}
                                onChange={(e) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_companies: e.target.value.split(',').map(s => s.trim()) }
                                } : null)}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={() => handleSave('exclusions', personalInfo.exclusions)}
                        disabled={saving && editedField === 'exclusions'}
                    >
                        {saving && editedField === 'exclusions' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Exclusions
                    </Button>
                </CardContent>
            </Card>

            {/* Motivations */}
            <Card>
                <CardHeader>
                    <CardTitle>Motivations</CardTitle>
                    <CardDescription>What motivates you in your career</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="motivations-json">Motivations (JSON format)</Label>
                        <Textarea
                            id="motivations-json"
                            rows={6}
                            value={JSON.stringify(personalInfo.motivations, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, motivations: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('motivations', personalInfo.motivations)}
                        disabled={saving && editedField === 'motivations'}
                    >
                        {saving && editedField === 'motivations' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Motivations
                    </Button>
                </CardContent>
            </Card>

            {/* Career Goals */}
            <Card>
                <CardHeader>
                    <CardTitle>Career Goals</CardTitle>
                    <CardDescription>Your long-term career objectives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="career-goals-json">Career Goals (JSON format)</Label>
                        <Textarea
                            id="career-goals-json"
                            rows={6}
                            value={JSON.stringify(personalInfo.career_goals, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setPersonalInfo(prev => prev ? { ...prev, career_goals: parsed } : null);
                                } catch {
                                    // Invalid JSON, don't update
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => handleSave('career_goals', personalInfo.career_goals)}
                        disabled={saving && editedField === 'career_goals'}
                    >
                        {saving && editedField === 'career_goals' ? <LoaderCircle className="animate-spin" /> : <Save />}
                        Save Career Goals
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
