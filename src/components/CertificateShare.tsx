'use client'

import { useState } from 'react'
import { Share2, Linkedin, Copy, Check } from 'lucide-react'
import styles from './CertificateShare.module.css'

interface CertificateShareProps {
    certificateId: string
    shareToken: string
    certificateTitle: string
    score: number
}

export function CertificateShare({ certificateId, shareToken, certificateTitle, score }: CertificateShareProps) {
    const [copied, setCopied] = useState(false)
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/certificate/${shareToken}`
    
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const handleLinkedInShare = () => {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        window.open(linkedInUrl, '_blank', 'width=600,height=400')
    }

    return (
        <div className={styles.shareCard}>
            <div className={styles.shareHeader}>
                <Share2 size={20} className={styles.shareIcon} />
                <h3 className={styles.shareTitle}>Share Your Achievement</h3>
            </div>
            <p className={styles.shareDescription}>
                Share your certificate on LinkedIn or copy the link to share anywhere!
            </p>
            <div className={styles.shareActions}>
                <button 
                    onClick={handleLinkedInShare}
                    className={styles.linkedinButton}
                >
                    <Linkedin size={18} />
                    Share on LinkedIn
                </button>
                <button 
                    onClick={handleCopy}
                    className={styles.copyButton}
                >
                    {copied ? (
                        <>
                            <Check size={18} />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy size={18} />
                            Copy Link
                        </>
                    )}
                </button>
            </div>
            {copied && (
                <div className={styles.copiedMessage}>
                    Link copied to clipboard!
                </div>
            )}
        </div>
    )
}

