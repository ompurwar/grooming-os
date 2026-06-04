'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { triggerHaptic, hapticPatterns } from '@/utils/haptics'
import styles from './page.module.css'

export default function DeleteCapsuleButton({ capsuleId }: { capsuleId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this travel capsule? This cannot be undone.')) {
      return
    }
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/style/capsule/${capsuleId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete capsule')
      }
      
      triggerHaptic(hapticPatterns.success)
      toast.success('Capsule deleted successfully')
      router.push('/style')
    } catch (err: any) {
      console.error(err)
      triggerHaptic(hapticPatterns.error)
      toast.error(err.message)
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className={styles.deleteBtn}
      title="Delete Capsule"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        background: 'transparent',
        border: '1px solid var(--color-danger)',
        color: 'var(--color-danger)',
        borderRadius: '8px',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        opacity: isDeleting ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <Trash2 size={18} />
    </button>
  )
}
