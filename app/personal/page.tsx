'use client';

import { useCallback, useMemo, useRef, useState } from "react";
import useToUrl from "@/hooks/useToUrl";
import { type PersonalInformationSkill, type PersonalInformationExperience, type PersonalInformationEducation, PersonalInformationCertification, PersonalInformationLanguageSpoken, type PersonalInformationEligibility, type PersonalInformationMotivation, type PersonalInformationCareerGoal } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { AppExperienceEditor } from "@/components/ui/appExperienceEditor";
import AppEducationEditor from "@/components/ui/appEducationEditor";
import { normaliseExperienceItems, serializeExperienceItems, serializeCertifications } from "@/lib/personal";
import { normaliseEducationItems } from "@/lib/personal";
import usePersonal from "@/hooks/usePersonal";
import AppCertificationEditor from "@/components/ui/appCertificationEditor";
import AppLanguagesEditor from "@/components/ui/appLanguagesEditor";
import { AppEligibilityEditor } from "@/components/ui/AppEligibilityEditor";
import { AppExclusionsEditor } from "@/components/ui/AppExclusionsEditor";
import AppMotivationsEditor from "@/components/ui/appMotivationsEditor";
import AppCareerGoalsEditor from "@/components/ui/appCareerGoalsEditor";
import { AppCategoryCombobox } from "@/components/ui/appCategoryCombobox";
import { getCountryNames } from "@/lib/countries";

export default function PersonalPage() {
    const toUrl = useToUrl();
    const [saving, setSaving] = useState(false);
    const [editedField, setEditedField] = useState<string | null>(null);
    const [showAddressValidation, setShowAddressValidation] = useState(false);
    const openSkillsSheetRef = useRef<(() => void) | null>(null);
    const [canOpenSkillsSheet, setCanOpenSkillsSheet] = useState(false);

    const [personalInfo, setPersonalInfo, loading] = usePersonal();
    const countryNames = useMemo(() => getCountryNames(), []);

    const registerAddSkill = useCallback((handler: (() => void) | null) => {
        openSkillsSheetRef.current = handler;
        setCanOpenSkillsSheet(Boolean(handler));
    }, []);

    // Validate address fields (all required, trimmed, postal code no whitespace)
    const isAddressValid = useMemo(() => {
        if (!personalInfo?.contact.address) return false;
        const addr = personalInfo.contact.address;
        const street = (addr.streetAddress || '').trim();
        const locality = (addr.addressLocality || '').trim();
        const region = (addr.addressRegion || '').trim();
        const postal = (addr.postalCode || '').replace(/\s/g, '');
        const country = (addr.addressCountry || '').trim();
        return !!(street && locality && region && postal && country);
    }, [personalInfo?.contact.address]);

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
        // For contact, validate address fields first
        if (type === 'contact' && !isAddressValid) {
            setShowAddressValidation(true);
            return;
        }

        setSaving(true);
        setEditedField(type);
        setShowAddressValidation(false);
        try {
            // Sanitize contact address fields before saving
            let sanitizedValue = value;
            if (type === 'contact' && personalInfo?.contact.address) {
                const addr = personalInfo.contact.address;
                sanitizedValue = {
                    ...personalInfo.contact,
                    address: {
                        ...addr,
                        streetAddress: (addr.streetAddress || '').trim(),
                        addressLocality: (addr.addressLocality || '').trim(),
                        addressRegion: (addr.addressRegion || '').trim(),
                        postalCode: (addr.postalCode || '').replace(/\s/g, ''),
                        addressCountry: (addr.addressCountry || '').trim(),
                    }
                };
            }

            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, value: sanitizedValue })
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

    const persistExperience = async (nextItems: PersonalInformationExperience[]) => {
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

    const persistEducation = async (nextItems: PersonalInformationEducation[]) => {
        setSaving(true);
        setEditedField('education');
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'education', value: nextItems })
            });

            if (!response.ok) {
                let message = 'Failed to save education.';
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
            const normalizedEducation = normaliseEducationItems(updated.value);
            setPersonalInfo(prev => prev ? { ...prev, education: normalizedEducation } : null);
        } catch (error) {
            console.error('Error saving education:', error);
            throw (error instanceof Error ? error : new Error('Failed to save education.'));
        } finally {
            setSaving(false);
            setEditedField(null);
        }
    };

    const persistCertifications = async (nextCertifications: PersonalInformationCertification[]) => {
        setSaving(true);
        setEditedField('certifications');
        try {
            const payload = serializeCertifications(nextCertifications);
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'certifications', value: payload })
            });
            if (!response.ok) {
                let message = 'Failed to save certifications.';
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
        }
        catch (error) {
            console.error('Error saving certifications:', error);
            throw (error instanceof Error ? error : new Error('Failed to save certifications.'));
        }
        finally {
            setSaving(false);
            setEditedField(null);
        }
    };

    const persistLanguages = async (nextLanguages: PersonalInformationLanguageSpoken[]) => {
        setSaving(true);
        setEditedField('languages_spoken');
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'languages_spoken', value: nextLanguages })
            });
            if (!response.ok) {
                let message = 'Failed to save languages.';
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
        }
        catch (error) {
            console.error('Error saving languages:', error);
            throw (error instanceof Error ? error : new Error('Failed to save languages.'));
        }
        finally {
            setSaving(false);
            setEditedField(null);
        }
    };

    const persistEligibility = async (nextEligibility: PersonalInformationEligibility) => {
        setSaving(true);
        setEditedField('eligibility');
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'eligibility', value: nextEligibility })
            });
            if (!response.ok) {
                let message = 'Failed to save eligibility.';
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
            setPersonalInfo(prev => prev ? { ...prev, eligibility: updated.value } : null);
        }
        catch (error) {
            console.error('Error saving eligibility:', error);
            throw (error instanceof Error ? error : new Error('Failed to save eligibility.'));
        }
        finally {
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

    const persistMotivations = async (nextMotivations: PersonalInformationMotivation[]) => {
        setSaving(true);
        setEditedField('motivations');
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'motivations', value: nextMotivations })
            });
            if (!response.ok) {
                let message = 'Failed to save motivations.';
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
        }
        catch (error) {
            console.error('Error saving motivations:', error);
            throw (error instanceof Error ? error : new Error('Failed to save motivations.'));
        }
        finally {
            setSaving(false);
            setEditedField(null);
        }
    };

    const persistCareerGoals = async (nextCareerGoals: PersonalInformationCareerGoal[]) => {
        setSaving(true);
        setEditedField('career_goals');
        try {
            const response = await fetch(toUrl('/api/personal'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'career_goals', value: nextCareerGoals })
            });
            if (!response.ok) {
                let message = 'Failed to save career goals.';
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
        }
        catch (error) {
            console.error('Error saving career goals:', error);
            throw (error instanceof Error ? error : new Error('Failed to save career goals.'));
        }
        finally {
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

                    {/* Address Section */}
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium mb-3">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="streetAddress">Street Address *</Label>
                                <Input
                                    id="streetAddress"
                                    value={personalInfo.contact.address?.streetAddress || ''}
                                    onChange={(e) => {
                                        setPersonalInfo(prev => prev ? {
                                            ...prev,
                                            contact: {
                                                ...prev.contact,
                                                address: { ...prev.contact.address, streetAddress: e.target.value }
                                            }
                                        } : null);
                                    }}
                                    placeholder="123 Main Street"
                                    className={showAddressValidation && !(personalInfo.contact.address?.streetAddress || '').trim() ? 'border-destructive' : ''}
                                />
                                {showAddressValidation && !(personalInfo.contact.address?.streetAddress || '').trim() && (
                                    <p className="text-xs text-destructive mt-1">Street address is required</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="addressLocality">City *</Label>
                                <Input
                                    id="addressLocality"
                                    value={personalInfo.contact.address?.addressLocality || ''}
                                    onChange={(e) => {
                                        setPersonalInfo(prev => prev ? {
                                            ...prev,
                                            contact: {
                                                ...prev.contact,
                                                address: { ...prev.contact.address, addressLocality: e.target.value }
                                            }
                                        } : null);
                                    }}
                                    placeholder="New York"
                                    className={showAddressValidation && !(personalInfo.contact.address?.addressLocality || '').trim() ? 'border-destructive' : ''}
                                />
                                {showAddressValidation && !(personalInfo.contact.address?.addressLocality || '').trim() && (
                                    <p className="text-xs text-destructive mt-1">City is required</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="addressRegion">Region/State *</Label>
                                <Input
                                    id="addressRegion"
                                    value={personalInfo.contact.address?.addressRegion || ''}
                                    onChange={(e) => {
                                        setPersonalInfo(prev => prev ? {
                                            ...prev,
                                            contact: {
                                                ...prev.contact,
                                                address: { ...prev.contact.address, addressRegion: e.target.value }
                                            }
                                        } : null);
                                    }}
                                    placeholder="NY"
                                    className={showAddressValidation && !(personalInfo.contact.address?.addressRegion || '').trim() ? 'border-destructive' : ''}
                                />
                                {showAddressValidation && !(personalInfo.contact.address?.addressRegion || '').trim() && (
                                    <p className="text-xs text-destructive mt-1">Region is required</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="postalCode">Postal Code *</Label>
                                <Input
                                    id="postalCode"
                                    value={personalInfo.contact.address?.postalCode || ''}
                                    onChange={(e) => {
                                        const noWhitespace = e.target.value.replace(/\s/g, '');
                                        setPersonalInfo(prev => prev ? {
                                            ...prev,
                                            contact: {
                                                ...prev.contact,
                                                address: { ...prev.contact.address, postalCode: noWhitespace }
                                            }
                                        } : null);
                                    }}
                                    placeholder="10001"
                                    className={showAddressValidation && !(personalInfo.contact.address?.postalCode || '').replace(/\s/g, '') ? 'border-destructive' : ''}
                                />
                                {showAddressValidation && !(personalInfo.contact.address?.postalCode || '').replace(/\s/g, '') && (
                                    <p className="text-xs text-destructive mt-1">Postal code is required</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="addressCountry">Country *</Label>
                                <AppCategoryCombobox
                                    id="addressCountry"
                                    value={personalInfo.contact.address?.addressCountry || ''}
                                    options={countryNames}
                                    onChange={(country) => {
                                        setPersonalInfo(prev => prev ? {
                                            ...prev,
                                            contact: {
                                                ...prev.contact,
                                                address: { ...prev.contact.address, addressCountry: country }
                                            }
                                        } : null);
                                    }}
                                    placeholder="Select a country"
                                    allowCustomValue={false}
                                    error={showAddressValidation && !(personalInfo.contact.address?.addressCountry || '').trim() ? 'Country is required' : undefined}
                                />
                            </div>
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
                <CardContent>
                    <AppEducationEditor
                        education={personalInfo.education}
                        onChange={(items) => setPersonalInfo(prev => prev ? { ...prev, education: items } : prev)}
                        onPersist={persistEducation}
                    />
                </CardContent>
            </Card>

            {/* Eligibility */}
            <Card>
                <CardHeader>
                    <CardTitle>Eligibility</CardTitle>
                    <CardDescription>Work authorization and availability</CardDescription>
                </CardHeader>
                <CardContent>
                    <AppEligibilityEditor
                        eligibility={personalInfo.eligibility}
                        onChange={(eligibility) => setPersonalInfo(prev => prev ? { ...prev, eligibility } : prev)}
                        onPersist={persistEligibility}
                        saving={saving && editedField === 'eligibility'}
                    />
                </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                    <CardDescription>Your professional certifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AppCertificationEditor
                        certifications={personalInfo.certifications}
                        onChange={(items) => setPersonalInfo(prev => prev ? { ...prev, certifications: items } : prev)}
                        onPersist={persistCertifications}
                    />
                </CardContent>
            </Card>

            {/* Languages */}
            <Card>
                <CardHeader>
                    <CardTitle>Languages</CardTitle>
                    <CardDescription>Languages you speak</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AppLanguagesEditor
                        languages={personalInfo.languages_spoken}
                        onChange={(items) => setPersonalInfo(prev => prev ? { ...prev, languages_spoken: items } : prev)}
                        onPersist={persistLanguages}
                    />
                </CardContent>
            </Card>

            {/* Exclusions */}
            <Card>
                <CardHeader>
                    <CardTitle>Exclusions</CardTitle>
                    <CardDescription>Things you want to avoid</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AppExclusionsEditor
                        exclusions={personalInfo.exclusions}
                        onChange={(exclusions) => setPersonalInfo(prev => prev ? { ...prev, exclusions } : prev)}
                        onSave={() => handleSave('exclusions', personalInfo.exclusions)}
                        saving={saving && editedField === 'exclusions'}
                    />
                </CardContent>
            </Card>

            {/* Motivations */}
            <Card>
                <CardHeader>
                    <CardTitle>Motivations</CardTitle>
                    <CardDescription>What motivates you in your career</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AppMotivationsEditor
                        motivations={personalInfo.motivations}
                        onChange={(items) => setPersonalInfo(prev => prev ? { ...prev, motivations: items } : prev)}
                        onPersist={persistMotivations}
                    />
                </CardContent>
            </Card>

            {/* Career Goals */}
            <Card>
                <CardHeader>
                    <CardTitle>Career Goals</CardTitle>
                    <CardDescription>Your long-term career objectives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AppCareerGoalsEditor
                        careerGoals={personalInfo.career_goals}
                        onChange={(items) => setPersonalInfo(prev => prev ? { ...prev, career_goals: items } : prev)}
                        onPersist={persistCareerGoals}
                    />
                </CardContent>
            </Card>
        </>
    );
}
