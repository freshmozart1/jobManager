'use client';

import { useCallback, useRef, useState } from "react";
import useToUrl from "@/hooks/useToUrl";
import { type PersonalInformationSkill, type PersonalInformationExperienceItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Save, ChevronDown, Phone, Globe, MapPin, Users, Briefcase, Building, Plus } from "lucide-react";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/inputGroup";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import BadgeInput from "@/components/ui/badgeInput";
import { AppSkillsEditor } from "@/components/ui/appSkillsEditor";
import AppExperienceEditor from "@/components/ui/appExperienceEditor";
import { normaliseExperienceItems, serializeExperienceItems } from "@/lib/experience";
import usePersonal from "@/hooks/usePersonal";

export default function PersonalPage() {
    const toUrl = useToUrl();
    const [saving, setSaving] = useState(false);
    const [editedField, setEditedField] = useState<string | null>(null);
    const openSkillsSheetRef = useRef<(() => void) | null>(null);
    const [canOpenSkillsSheet, setCanOpenSkillsSheet] = useState(false);

    const [personalInfo, setPersonalInfo, loading] = usePersonal();
    const registerAddSkill = useCallback((handler: (() => void) | null) => {
        openSkillsSheetRef.current = handler;
        setCanOpenSkillsSheet(Boolean(handler));
    }, []);

    const handleCurrencyChange = (currency: string) => {
        setPersonalInfo(prev => {
            if (!prev || !prev.constraints.salary_min) return prev;
            return {
                ...prev,
                constraints: {
                    ...prev.constraints,
                    salary_min: { ...prev.constraints.salary_min, currency }
                }
            };
        });
    };

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

    const persistExperience = async (nextItems: PersonalInformationExperienceItem[]) => {
        setSaving(true);
        setEditedField('experience');
        try {
            const payload = serializeExperienceItems(nextItems);
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'experience', value: payload })
            });

            if (!response.ok) {
                let message = 'Failed to save experience.';
                try {
                    const parsed = await response.json();
                    if (parsed?.error) {
                        message = parsed.error;
                    }
                } catch {
                    try {
                        const text = await response.text();
                        if (text) message = text;
                    } catch {
                        // ignore
                    }
                }
                throw new Error(message);
            }

            const updated = await response.json();
            const normalizedExperience = normaliseExperienceItems(updated.value);
            setPersonalInfo(prev => prev ? { ...prev, experience: normalizedExperience } : null);
        } catch (error) {
            console.error('Error saving experience:', error);
            throw (error instanceof Error ? error : new Error('Failed to save experience.'));
        } finally {
            setSaving(false);
            setEditedField(null);
        }
    };

    const persistSkills = async (nextSkills: PersonalInformationSkill[]) => {
        setSaving(true);
        setEditedField('skills');
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'skills', value: nextSkills })
            });

            if (!response.ok) {
                const payload = await response.text();
                throw new Error(payload || 'Failed to save skills');
            }

            const updated = await response.json();
            setPersonalInfo(prev => prev ? { ...prev, skills: updated.value } : null);
        } catch (error) {
            console.error('Error saving skills:', error);
            throw (error instanceof Error ? error : new Error(String(error)));
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
        <>
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
                            <InputGroup className="[--radius:0.5rem]">
                                <InputGroupAddon align="inline-start" className="px-4 py-2">
                                    <Phone className="size-4 text-muted-foreground" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="phone"
                                    type="tel"
                                    value={personalInfo.contact.phone}
                                    onChange={(e) => setPersonalInfo(prev => prev ? {
                                        ...prev,
                                        contact: { ...prev.contact, phone: e.target.value }
                                    } : null)}
                                />
                            </InputGroup>
                        </div>
                        <div>
                            <BadgeInput
                                id="portfolio"
                                label="Portfolio URLs"
                                value={personalInfo.contact.portfolio_urls}
                                onChange={(urls) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    contact: { ...prev.contact, portfolio_urls: urls }
                                } : null)}
                                placeholder="Type URL and press ','"
                                icon={Globe}
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
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="salary-amount">Minimum Salary</Label>
                            <InputGroup className="[--radius:0.5rem]">
                                <InputGroupAddon align="inline-start">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <InputGroupButton variant="ghost" className="!pl-3 !pr-2 text-sm min-w-[3rem]">
                                                {personalInfo.constraints.salary_min.currency || '$'} <ChevronDown className="size-3 ml-1" />
                                            </InputGroupButton>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="[--radius:0.5rem]">
                                            <DropdownMenuItem onClick={() => handleCurrencyChange('$')}>$</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleCurrencyChange('€')}>€</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="salary-amount"
                                    type="number"
                                    placeholder="Enter minimum salary"
                                    value={personalInfo.constraints.salary_min.amount}
                                    onChange={(e) => setPersonalInfo(prev => prev ? {
                                        ...prev,
                                        constraints: {
                                            ...prev.constraints,
                                            salary_min: { ...prev.constraints.salary_min, amount: Number(e.target.value) }
                                        }
                                    } : null)}
                                />
                            </InputGroup>
                        </div>
                        <div>
                            <BadgeInput
                                id="locations"
                                label="Allowed Locations"
                                value={personalInfo.constraints.locations_allowed}
                                onChange={(locations) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    constraints: {
                                        ...prev.constraints,
                                        locations_allowed: locations
                                    }
                                } : null)}
                                placeholder="Type location and press ','"
                                icon={MapPin}
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
                            <BadgeInput
                                id="roles"
                                label="Preferred Roles"
                                value={personalInfo.preferences.roles}
                                onChange={(roles) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, roles }
                                } : null)}
                                placeholder="Type role and press ','"
                                icon={Briefcase}
                            />
                        </div>
                        <div>
                            <BadgeInput
                                id="seniority"
                                label="Seniority Levels"
                                value={personalInfo.preferences.seniority}
                                onChange={(seniority) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, seniority }
                                } : null)}
                                placeholder="Type level and press ','"
                            />
                        </div>
                        <div>
                            <BadgeInput
                                id="company-size"
                                label="Company Sizes"
                                value={personalInfo.preferences.company_size}
                                onChange={(company_size) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, company_size }
                                } : null)}
                                placeholder="Type size and press ','"
                                icon={Users}
                            />
                        </div>
                        <div>
                            <BadgeInput
                                id="industries"
                                label="Industries"
                                value={personalInfo.preferences.industries}
                                onChange={(industries) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    preferences: { ...prev.preferences, industries }
                                } : null)}
                                placeholder="Type industry and press ','"
                                icon={Building}
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
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle>Your skills</CardTitle>
                    <Button
                        type="button"
                        variant="default"
                        size="icon"
                        aria-label="Add skill"
                        onClick={() => openSkillsSheetRef.current?.()}
                        disabled={!canOpenSkillsSheet}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <AppSkillsEditor
                        skills={personalInfo.skills}
                        onChange={(nextSkills) => {
                            setPersonalInfo(prev => prev ? { ...prev, skills: nextSkills } : prev);
                        }}
                        onPersist={persistSkills}
                        onRegisterAddSkill={registerAddSkill}
                    />
                </CardContent>
            </Card>

            {/* Experience */}
            <Card>
                <CardHeader>
                    <CardTitle>Experience</CardTitle>
                    <CardDescription>Your professional experience</CardDescription>
                </CardHeader>
                <CardContent>
                    <AppExperienceEditor
                        experience={personalInfo.experience}
                        onChange={(items) => setPersonalInfo(prev => prev ? { ...prev, experience: items } : prev)}
                        onPersist={persistExperience}
                    />
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
                        {personalInfo.education?.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                                No education information added yet.
                            </div>
                        ) : <Textarea
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
                        />}
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
                            <BadgeInput
                                id="avoid-roles"
                                label="Avoid Roles"
                                value={personalInfo.exclusions.avoid_roles}
                                onChange={(avoid_roles) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_roles }
                                } : null)}
                                placeholder="Type role and press ','"
                            />
                        </div>
                        <div>
                            <BadgeInput
                                id="avoid-technologies"
                                label="Avoid Technologies"
                                value={personalInfo.exclusions.avoid_technologies}
                                onChange={(avoid_technologies) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_technologies }
                                } : null)}
                                placeholder="Type technology and press ','"
                            />
                        </div>
                        <div>
                            <BadgeInput
                                id="avoid-industries"
                                label="Avoid Industries"
                                value={personalInfo.exclusions.avoid_industries}
                                onChange={(avoid_industries) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_industries }
                                } : null)}
                                placeholder="Type industry and press ','"
                            />
                        </div>
                        <div>
                            <BadgeInput
                                id="avoid-companies"
                                label="Avoid Companies"
                                value={personalInfo.exclusions.avoid_companies}
                                onChange={(avoid_companies) => setPersonalInfo(prev => prev ? {
                                    ...prev,
                                    exclusions: { ...prev.exclusions, avoid_companies }
                                } : null)}
                                placeholder="Type company and press ','"
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
        </>
    );
}
