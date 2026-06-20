'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Trash2, Edit2 } from 'lucide-react'
import styles from './page.module.css'

export default function ItemActions({ itemData }: { itemData: any }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    category: itemData.category || '',
    sub_category: itemData.sub_category || '',
    primary_color: itemData.primary_color || ''
  })

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item from your wardrobe?')) return
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('wardrobe_items').delete().eq('id', itemData.id)
    if (error) {
      toast.error('Failed to delete item')
      setIsDeleting(false)
    } else {
      toast.success('Item deleted')
      router.push('/wardrobe')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('wardrobe_items').update({
      category: formData.category,
      sub_category: formData.sub_category,
      primary_color: formData.primary_color
    }).eq('id', itemData.id)

    if (error) {
      toast.error('Failed to update item')
      setIsSaving(false)
    } else {
      toast.success('Item updated successfully')
      setIsEditing(false)
      setIsSaving(false)
      router.refresh()
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setIsEditing(true)} className={styles.editBtn} disabled={isDeleting}>
          <Edit2 size={16} /> Edit
        </button>
        <button onClick={handleDelete} className={styles.deleteBtn} disabled={isDeleting}>
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {isEditing && (
        <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '16px', color: 'var(--color-text-primary)' }}>Edit Item</h2>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Category</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className={styles.input}
              >
                <option value="Top">Top</option>
                <option value="Bottom">Bottom</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Dress">Dress</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessory">Accessory</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Ethnic">Ethnic</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Sub Category</label>
              <input 
                type="text" 
                value={formData.sub_category} 
                onChange={e => setFormData({...formData, sub_category: e.target.value})}
                className={styles.input}
                placeholder="e.g. Oxford Shirt"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Primary Color</label>
              <input 
                type="text" 
                value={formData.primary_color} 
                onChange={e => setFormData({...formData, primary_color: e.target.value})}
                className={styles.input}
                placeholder="e.g. Navy Blue"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => setIsEditing(false)} 
                className={styles.editBtn}
                style={{ flex: 1, padding: '12px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className={styles.editBtn}
                disabled={isSaving}
                style={{ flex: 1, padding: '12px', background: 'var(--color-accent)', color: 'black', border: 'none' }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
