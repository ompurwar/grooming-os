'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import ImageCropper from '@/components/shared/ImageCropper'
import styles from './page.module.css'

export default function AddWardrobeItemPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // AI Extracted Tags
  const [tags, setTags] = useState({
    category: '',
    subCategory: '',
    color: '',
    pattern: '',
    material: '',
    formality: 3,
    aiTags: [] as string[]
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show Cropper instead of uploading immediately
    const reader = new FileReader()
    reader.onload = (event) => {
      setCropSrc(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedFile: File) => {
    setCropSrc(null) // Close cropper
    
    // 1. Show Preview
    setImagePreview(URL.createObjectURL(croppedFile))

    // 2. Trigger Upload & AI Analysis
    setIsAnalyzing(true)
    
    try {
      const supabase = createClient()
      
      // Upload to 'wardrobe-images' bucket
      const fileExt = 'jpg'
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(filePath, croppedFile)

      if (uploadError) {
        throw new Error('Upload failed: ' + uploadError.message)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(filePath)
        
      setUploadedUrl(publicUrl)

      // Get user ID
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')
      const userId = userData.user.id

      // Call AI analysis API
      const res = await fetch('/api/analyze/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl, userId })
      })

      const result = await res.json()
      
      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed')
      }

      // Update UI with real AI tags
      const metadata = result.data
      setTags({
        category: metadata.category || 'Top',
        subCategory: metadata.subCategory || '',
        color: metadata.primaryColor || '',
        pattern: metadata.pattern || '',
        material: metadata.material || '',
        formality: Math.round(metadata.formalityScore || 3),
        aiTags: metadata.aiTags || []
      })
    } catch (error: any) {
      console.error('Failed to analyze image', error)
      alert(error.message || 'Analysis failed. Did you create the wardrobe-images bucket?')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRetake = () => {
    setImagePreview(null)
    setUploadedUrl(null)
    setTags({ category: '', subCategory: '', color: '', pattern: '', material: '', formality: 3, aiTags: [] })
  }

  const handleSave = async () => {
    if (!uploadedUrl) return
    setIsSaving(true)
    
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: userData.user.id,
          image_url: uploadedUrl,
          category: tags.category,
          sub_category: tags.subCategory,
          primary_color: tags.color,
          pattern: tags.pattern,
          material: tags.material,
          formality_score: Math.round(tags.formality),
          ai_tags: tags.aiTags,
          brand: 'Unknown'
        })

      if (error) throw error

      router.push('/wardrobe')
    } catch (error) {
      console.error('Save failed', error)
      alert('Failed to save to database.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Add Item</h1>
        <Link href="/wardrobe" className={styles.backBtn}>Cancel</Link>
      </header>

      {cropSrc && (
        <ImageCropper 
          imageSrc={cropSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropSrc(null)} 
        />
      )}

      {!imagePreview && !cropSrc ? (
        <div 
          className={styles.uploadCard}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.cameraIcon}>📸</div>
          <h3 className={styles.uploadTitle}>Tap to photograph</h3>
          <p className={styles.uploadSub}>Or choose from library</p>
          <input 
            type="file" 
            accept="image/*"
            className={styles.hiddenInput}
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
        </div>
      ) : (
        <>
          <div className={styles.previewContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Item preview" className={styles.previewImage} />
            <button 
              className={styles.retakeBtn}
              onClick={handleRetake}
            >
              Retake Photo
            </button>
          </div>

          <div className={styles.taggingSection}>
            <div className={styles.tagHeader}>
              <span className={styles.aiBadge}>✨ AI Tags</span>
              {isAnalyzing && <span className={styles.uploadSub}>Analyzing fabric, fit, and style...</span>}
            </div>

            <div className={styles.tagGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Category</label>
                <select 
                  className={styles.select}
                  value={tags.category}
                  onChange={(e) => setTags({...tags, category: e.target.value})}
                  disabled={isAnalyzing}
                >
                  <option value="">Select...</option>
                  <option value="Top">Top</option>
                  <option value="Bottom">Bottom</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessory">Accessory</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Style Details</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={tags.subCategory}
                  onChange={(e) => setTags({...tags, subCategory: e.target.value})}
                  placeholder="e.g. Quarter-Zip Polo"
                  disabled={isAnalyzing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Primary Color</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={tags.color}
                  onChange={(e) => setTags({...tags, color: e.target.value})}
                  placeholder="e.g. Navy"
                  disabled={isAnalyzing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Pattern</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={tags.pattern}
                  onChange={(e) => setTags({...tags, pattern: e.target.value})}
                  placeholder="e.g. Solid"
                  disabled={isAnalyzing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Material</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={tags.material}
                  onChange={(e) => setTags({...tags, material: e.target.value})}
                  placeholder="e.g. Cotton"
                  disabled={isAnalyzing}
                />
              </div>

              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Formality (1-5)</label>
                <input 
                  type="range" 
                  min="1" 
                  max="5"
                  value={tags.formality}
                  onChange={(e) => setTags({...tags, formality: parseInt(e.target.value)})}
                  disabled={isAnalyzing}
                />
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-gray-400)'}}>
                  <span>Casual</span>
                  <span>Formal</span>
                </div>
              </div>

              {tags.aiTags.length > 0 && (
                <div className={`${styles.field} ${styles.full}`}>
                  <label className={styles.label}>Technical Details (Auto-detected)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {tags.aiTags.map(tag => (
                      <span key={tag} style={{ background: 'var(--color-bg-hover)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={isAnalyzing || isSaving || !uploadedUrl}
          >
            {isSaving ? <div className={styles.loadingSpinner} /> : 'Save to Wardrobe'}
          </button>
        </>
      )}
    </div>
  )
}
