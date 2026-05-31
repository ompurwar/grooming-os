'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'
import { triggerHaptic, hapticPatterns } from '@/utils/haptics'
import getCroppedImg from '@/utils/cropImage'
import styles from './ImageCropper.module.css'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedFile: File) => void
  onCancel: () => void
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    triggerHaptic(hapticPatterns.light)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedBlob) {
        const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
        triggerHaptic(hapticPatterns.success)
        onCropComplete(croppedFile)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to crop image')
      triggerHaptic(hapticPatterns.error)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.cropperContainer}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={4 / 5} // Instagram portrait ratio
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
          showGrid={true}
        />
      </div>
      <div className={styles.controls}>
        <div className={styles.sliderContainer}>
          <span className={styles.sliderLabel}>Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.slider}
          />
        </div>
        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Confirm Crop
          </button>
        </div>
      </div>
    </div>
  )
}
