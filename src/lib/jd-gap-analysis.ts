

import { ParsedJD } from './jd-parser'

export interface CandidateProfile {
    skills: string[] // From user profile
    experienceYears?: number
    level?: string
    technologies?: string[] // Extracted from intro or profile
}

export interface JDGap {
    // Skills required by JD but not in candidate profile
    missingRequiredSkills: string[]
    // Skills preferred by JD but not in candidate profile
    missingPreferredSkills: string[]
    // Technologies required but candidate hasn't mentioned
    missingTechnologies: string[]
    // Experience gap (JD requires X years, candidate has Y)
    experienceGap?: {
        required: number
        candidate: number
        gap: number
    }
    // High-availability/scale requirements vs candidate background
    scaleGap?: {
        jdRequires: string[] // e.g., ["99.99% availability", "multi-region"]
        candidateBackground: string // e.g., "startup experience"
    }
    // Critical responsibilities candidate may not have experience with
    criticalGaps: string[]
    // Pressure points - areas where candidate is most likely to fail
    pressurePoints: string[]
}

/**
 * Analyze gaps between JD requirements and candidate profile
 * This identifies "pressure points" where the candidate is most likely to fail
 */
export function analyzeJDGaps(jd: ParsedJD, candidate: CandidateProfile): JDGap {
    const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase())
    const candidateTechLower = (candidate.technologies || []).map(t => t.toLowerCase())

    // Find missing required skills
    const missingRequiredSkills = jd.requiredSkills.filter(skill =>
        !candidateSkillsLower.some(cs =>
            cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
        )
    )

    // Find missing preferred skills
    const missingPreferredSkills = jd.preferredSkills.filter(skill =>
        !candidateSkillsLower.some(cs =>
            cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
        )
    )

    // Find missing technologies
    const missingTechnologies = jd.tools.filter(tool =>
        !candidateTechLower.some(ct =>
            ct.includes(tool.toLowerCase()) || tool.toLowerCase().includes(ct)
        )
    )

    // Experience gap
    let experienceGap: JDGap['experienceGap'] | undefined
    if (jd.experienceYears && candidate.experienceYears !== undefined) {
        const gap = jd.experienceYears - candidate.experienceYears
        if (gap > 0) {
            experienceGap = {
                required: jd.experienceYears,
                candidate: candidate.experienceYears,
                gap
            }
        }
    }

    // Scale/HA gap analysis
    let scaleGap: JDGap['scaleGap'] | undefined
    const jdText = JSON.stringify(jd).toLowerCase()
    const hasHighAvailability = jdText.includes('99.9') || jdText.includes('99.99') ||
        jdText.includes('high availability') || jdText.includes('ha') ||
        jdText.includes('multi-region') || jdText.includes('disaster recovery')

    if (hasHighAvailability && jd.companyStage === 'Startup') {
        // JD requires enterprise-scale but candidate has startup experience
        scaleGap = {
            jdRequires: ['High Availability', 'Multi-Region', '99.99% Uptime'],
            candidateBackground: candidate.level || 'Startup Experience'
        }
    }

    // Critical gaps - responsibilities candidate may not have experience with
    const criticalGaps: string[] = []
    const responsibilitiesLower = jd.responsibilities.map(r => r.toLowerCase())

    // Check for common critical requirements
    if (responsibilitiesLower.some(r => r.includes('disaster recovery') || r.includes('dr'))) {
        if (!candidateSkillsLower.some(s => s.includes('disaster') || s.includes('dr'))) {
            criticalGaps.push('Disaster Recovery')
        }
    }

    if (responsibilitiesLower.some(r => r.includes('multi-region') || r.includes('global'))) {
        if (!candidateTechLower.some(t => t.includes('multi-region') || t.includes('global'))) {
            criticalGaps.push('Multi-Region Architecture')
        }
    }

    if (responsibilitiesLower.some(r => r.includes('cost optimization') || r.includes('cost'))) {
        if (!candidateSkillsLower.some(s => s.includes('cost') || s.includes('optimization'))) {
            criticalGaps.push('Cost Optimization')
        }
    }

    if (responsibilitiesLower.some(r => r.includes('security') || r.includes('compliance'))) {
        if (!candidateSkillsLower.some(s => s.includes('security') || s.includes('compliance'))) {
            criticalGaps.push('Security & Compliance')
        }
    }

    // Pressure points - areas where candidate is most likely to fail
    const pressurePoints: string[] = []

    // Add missing required skills as pressure points
    if (missingRequiredSkills.length > 0) {
        pressurePoints.push(...missingRequiredSkills.slice(0, 3)) // Top 3
    }

    // Add critical gaps
    pressurePoints.push(...criticalGaps)

    // Add experience gap if significant
    if (experienceGap && experienceGap.gap >= 2) {
        pressurePoints.push(`${experienceGap.gap} years of experience gap`)
    }

    // Add scale gaps
    if (scaleGap) {
        pressurePoints.push('High Availability & Multi-Region')
    }

    return {
        missingRequiredSkills,
        missingPreferredSkills,
        missingTechnologies,
        experienceGap,
        scaleGap,
        criticalGaps,
        pressurePoints: [...new Set(pressurePoints)] // Remove duplicates
    }
}

/**
 * Generate gap analysis instructions for the interviewer prompt
 */
export function generateGapAnalysisInstructions(gap: JDGap): string {
    if (gap.pressurePoints.length === 0) {
        return 'No significant gaps identified. Focus on testing depth of knowledge in areas they claim expertise.'
    }

    const instructions: string[] = []

    instructions.push('**CRITICAL: JD GAP ANALYSIS - PRESSURE POINTS**')
    instructions.push('The candidate has gaps in the following areas. These are HIGH PRIORITY for testing:')
    instructions.push('')

    if (gap.missingRequiredSkills.length > 0) {
        instructions.push(`**Missing Required Skills:** ${gap.missingRequiredSkills.join(', ')}`)
        instructions.push(`→ You MUST test these areas. If they claim to know them, drill deep.`)
        instructions.push('')
    }

    if (gap.missingTechnologies.length > 0) {
        instructions.push(`**Missing Technologies:** ${gap.missingTechnologies.join(', ')}`)
        instructions.push(`→ Ask if they have experience. If yes, test thoroughly. If no, this is a red flag.`)
        instructions.push('')
    }

    if (gap.experienceGap) {
        instructions.push(`**Experience Gap:** JD requires ${gap.experienceGap.required} years, candidate has ${gap.experienceGap.candidate}`)
        instructions.push(`→ Test for depth and maturity, not just years. Look for advanced patterns.`)
        instructions.push('')
    }

    if (gap.scaleGap) {
        instructions.push(`**Scale Gap:** JD requires ${gap.scaleGap.jdRequires.join(', ')}, but candidate background suggests ${gap.scaleGap.candidateBackground}`)
        instructions.push(`→ CRITICAL: Test High Availability, Disaster Recovery, Multi-Region scenarios heavily.`)
        instructions.push(`→ This is where they're most likely to fail.`)
        instructions.push('')
    }

    if (gap.criticalGaps.length > 0) {
        instructions.push(`**Critical Gaps:** ${gap.criticalGaps.join(', ')}`)
        instructions.push(`→ These are MUST-HAVE for this role. Test extensively.`)
        instructions.push('')
    }

    instructions.push('**INTERVIEW STRATEGY:**')
    instructions.push('1. Start with pressure points early in the interview')
    instructions.push('2. Drill deep on gaps - don\'t accept surface-level answers')
    instructions.push('3. Use expert scenarios that test these specific gaps')
    instructions.push('4. If they can\'t answer pressure point questions, that\'s a major red flag')

    return instructions.join('\n')
}

