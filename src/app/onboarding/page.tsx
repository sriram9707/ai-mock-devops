'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveOnboarding } from '@/lib/onboarding'
import styles from './page.module.css'
import { 
    User, 
    Briefcase, 
    Code, 
    FileText, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft,
    Upload,
    Sparkles
} from 'lucide-react'

const STEPS = [
    { id: 'role', title: 'Your Role', icon: Briefcase },
    { id: 'level', title: 'Experience', icon: User },
    { id: 'skills', title: 'Skills', icon: Code },
    { id: 'resume', title: 'Resume', icon: FileText }
]

const ROLES = ['DevOps Engineer', 'SRE', 'Cloud Engineer', 'Cloud Architect']
const LEVELS = [
    { value: 'Entry', label: 'Entry / Junior', description: '0-2 years' },
    { value: 'Mid', label: 'Mid-Level', description: '2-5 years' },
    { value: 'Senior', label: 'Senior', description: '5-8 years' },
    { value: 'Principal', label: 'Principal / Staff', description: '8+ years' }
]

const SKILL_CATEGORIES = [
    {
        title: 'Cloud Providers',
        skills: ['AWS', 'GCP', 'Azure']
    },
    {
        title: 'Orchestration & Containers',
        skills: ['Kubernetes', 'Docker', 'ECS', 'Nomad']
    },
    {
        title: 'IaC & CI/CD',
        skills: ['Terraform', 'CloudFormation', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'ArgoCD']
    },
    {
        title: 'Observability & Scripting',
        skills: ['Prometheus', 'Grafana', 'Datadog', 'ELK', 'Bash', 'Python', 'Go']
    }
]

export default function OnboardingPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState({
        roles: [] as string[],
        level: '',
        skills: [] as string[],
        cvFile: null as File | null
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleRoleToggle = (role: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
        }))
        setErrors(prev => ({ ...prev, roles: '' }))
    }

    const handleLevelSelect = (level: string) => {
        setFormData(prev => ({ ...prev, level }))
        setErrors(prev => ({ ...prev, level: '' }))
    }

    const handleSkillToggle = (skill: string, category: string) => {
        const skillValue = `${category.toLowerCase().replace(/\s+/g, '_')}:${skill}`
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skillValue)
                ? prev.skills.filter(s => s !== skillValue)
                : [...prev.skills, skillValue]
        }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormData(prev => ({ ...prev, cvFile: file }))
        }
    }

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {}
        
        if (step === 0) {
            if (formData.roles.length === 0) {
                newErrors.roles = 'Please select at least one role'
            }
        } else if (step === 1) {
            if (!formData.level) {
                newErrors.level = 'Please select your experience level'
            }
        } else if (step === 2) {
            if (formData.skills.length === 0) {
                newErrors.skills = 'Please select at least one skill'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < STEPS.length - 1) {
                setCurrentStep(currentStep + 1)
            } else {
                handleSubmit()
            }
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return

        setIsSubmitting(true)
        try {
            const formDataToSubmit = new FormData()
            
            formData.roles.forEach(role => {
                formDataToSubmit.append('roles', role)
            })
            
            formDataToSubmit.append('level', formData.level)
            
            formData.skills.forEach(skill => {
                formDataToSubmit.append('skills', skill)
            })
            
            if (formData.cvFile) {
                formDataToSubmit.append('cv', formData.cvFile)
            }

            await saveOnboarding(formDataToSubmit)
            router.push('/dashboard')
        } catch (error) {
            console.error('Failed to save onboarding:', error)
            setErrors({ submit: 'Failed to save profile. Please try again.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const progress = ((currentStep + 1) / STEPS.length) * 100
    const CurrentIcon = STEPS[currentStep].icon

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Progress Bar */}
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill} 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className={styles.stepIndicators}>
                        {STEPS.map((step, index) => {
                            const StepIcon = step.icon
                            const isActive = index === currentStep
                            const isCompleted = index < currentStep
                            
                            return (
                                <div 
                                    key={step.id} 
                                    className={`${styles.stepIndicator} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                                >
                                    <div className={styles.stepIcon}>
                                        {isCompleted ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <StepIcon size={20} />
                                        )}
                                    </div>
                                    <span className={styles.stepLabel}>{step.title}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <CurrentIcon className={styles.headerIcon} />
                        <Sparkles className={styles.sparkle} />
                    </div>
                    <h1 className={styles.title}>{STEPS[currentStep].title}</h1>
                    <p className={styles.subtitle}>
                        {currentStep === 0 && 'Select the roles you\'re interested in or currently work in'}
                        {currentStep === 1 && 'Tell us about your experience level'}
                        {currentStep === 2 && 'Select the technologies you\'re familiar with'}
                        {currentStep === 3 && 'Upload your resume for personalized interview questions (optional)'}
                    </p>
                </header>

                {/* Form Content */}
                <div className={styles.formContent}>
                    {/* Step 1: Roles */}
                    {currentStep === 0 && (
                        <div className={styles.stepContent}>
                            <div className={styles.grid}>
                                {ROLES.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => handleRoleToggle(role)}
                                        className={`${styles.optionCard} ${formData.roles.includes(role) ? styles.selected : ''}`}
                                    >
                                        <Briefcase size={24} />
                                        <span>{role}</span>
                                        {formData.roles.includes(role) && (
                                            <CheckCircle className={styles.checkIcon} size={20} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {errors.roles && <p className={styles.error}>{errors.roles}</p>}
                        </div>
                    )}

                    {/* Step 2: Experience Level */}
                    {currentStep === 1 && (
                        <div className={styles.stepContent}>
                            <div className={styles.levelGrid}>
                                {LEVELS.map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => handleLevelSelect(level.value)}
                                        className={`${styles.levelCard} ${formData.level === level.value ? styles.selected : ''}`}
                                    >
                                        <div className={styles.levelHeader}>
                                            <User size={24} />
                                            <h3>{level.label}</h3>
                                        </div>
                                        <p className={styles.levelDescription}>{level.description}</p>
                                        {formData.level === level.value && (
                                            <CheckCircle className={styles.checkIcon} size={24} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {errors.level && <p className={styles.error}>{errors.level}</p>}
                        </div>
                    )}

                    {/* Step 3: Skills */}
                    {currentStep === 2 && (
                        <div className={styles.stepContent}>
                            <div className={styles.skillsContainer}>
                                {SKILL_CATEGORIES.map((category, catIndex) => (
                                    <div key={catIndex} className={styles.skillCategory}>
                                        <h3 className={styles.categoryTitle}>{category.title}</h3>
                                        <div className={styles.skillGrid}>
                                            {category.skills.map(skill => {
                                                const categoryKey = category.title.toLowerCase().replace(/\s+/g, '_')
                                                const skillValue = `${categoryKey}:${skill}`
                                                const isSelected = formData.skills.includes(skillValue)
                                                
                                                return (
                                                    <button
                                                        key={skill}
                                                        type="button"
                                                        onClick={() => handleSkillToggle(skill, category.title)}
                                                        className={`${styles.skillTag} ${isSelected ? styles.selected : ''}`}
                                                    >
                                                        {skill}
                                                        {isSelected && <CheckCircle size={16} />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.skills && <p className={styles.error}>{errors.skills}</p>}
                            {formData.skills.length > 0 && (
                                <div className={styles.selectedCount}>
                                    {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} selected
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Resume */}
                    {currentStep === 3 && (
                        <div className={styles.stepContent}>
                            <div className={styles.uploadContainer}>
                                <input
                                    type="file"
                                    id="cv"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className={styles.fileInput}
                                />
                                <label htmlFor="cv" className={styles.uploadLabel}>
                                    <div className={styles.uploadIcon}>
                                        <Upload size={48} />
                                    </div>
                                    {formData.cvFile ? (
                                        <>
                                            <h3>{formData.cvFile.name}</h3>
                                            <p className={styles.fileSize}>
                                                {(formData.cvFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h3>Upload Your Resume</h3>
                                            <p className={styles.uploadHint}>
                                                Drag and drop your resume here, or click to browse
                                            </p>
                                            <p className={styles.fileTypes}>PDF, DOC, or DOCX (Max 10MB)</p>
                                        </>
                                    )}
                                </label>
                            </div>
                            <p className={styles.optionalNote}>
                                💡 Your resume helps us tailor interview questions to your experience
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className={styles.navigation}>
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className={styles.navButton}
                            disabled={isSubmitting}
                        >
                            <ArrowLeft size={20} />
                            Previous
                        </button>
                    )}
                    <div className={styles.navSpacer} />
                    <button
                        type="button"
                        onClick={handleNext}
                        className={`${styles.navButton} ${styles.primary}`}
                        disabled={isSubmitting}
                    >
                        {currentStep === STEPS.length - 1 ? (
                            <>
                                {isSubmitting ? 'Saving...' : 'Complete Profile'}
                                {!isSubmitting && <CheckCircle size={20} />}
                            </>
                        ) : (
                            <>
                                Next
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>

                {errors.submit && <p className={styles.error}>{errors.submit}</p>}
            </div>
        </div>
    )
}
