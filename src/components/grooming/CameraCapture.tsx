'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import styles from './CameraCapture.module.css'

interface CameraCaptureProps {
  /** 'face' shows oval guide, 'body' shows full-body guide */
  mode: 'face' | 'body'
  /** Called with the captured image blob */
  onCapture: (blob: Blob) => void
  /** Called when user cancels */
  onCancel?: () => void
}

export default function CameraCapture({ mode, onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('SECURE_CONTEXT_REQUIRED')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsReady(true)
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.message === 'SECURE_CONTEXT_REQUIRED') {
        setError('Live camera requires HTTPS or localhost. You can still upload a photo.')
      } else if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Could not access the live camera. You can upload a photo instead.')
      }
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [startCamera])

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleCapture = () => {
    // Start a 3-second countdown for body mode, instant for face
    if (mode === 'body') {
      setCountdown(3)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            doCapture()
            return null
          }
          return prev - 1
        })
      }, 1000)
    } else {
      doCapture()
    }
  }

  const doCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Center-crop to square
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2

    // If front-facing, mirror the image
    if (facingMode === 'user') {
      ctx.translate(size, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Stop the camera
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
          }
          onCapture(blob)
        }
      },
      'image/jpeg',
      0.92
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
    }
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>📷</span>
          <p className={styles.errorText}>{error}</p>
          
          <label className={styles.retryBtn} style={{ cursor: 'pointer', textAlign: 'center' }}>
            Upload or Take Photo
            <input 
              type="file" 
              accept="image/*" 
              capture={facingMode === 'user' ? 'user' : 'environment'} 
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>
          
          <button className={styles.cancelBtn} onClick={() => { setError(null); startCamera(); }} style={{ marginTop: '12px' }}>
            Retry Live Camera
          </button>
          
          {onCancel && (
            <button className={styles.cancelBtn} onClick={onCancel} style={{ marginTop: '8px' }}>Cancel</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.viewfinder}>
        <video
          ref={videoRef}
          className={`${styles.video} ${facingMode === 'user' ? styles.mirrored : ''}`}
          autoPlay
          playsInline
          muted
        />

        {/* Guide overlay */}
        {mode === 'face' && <div className={styles.faceGuide} />}
        {mode === 'body' && <div className={styles.bodyGuide} />}

        {/* Corner brackets */}
        <div className={`${styles.corner} ${styles.cornerTL}`} />
        <div className={`${styles.corner} ${styles.cornerTR}`} />
        <div className={`${styles.corner} ${styles.cornerBL}`} />
        <div className={`${styles.corner} ${styles.cornerBR}`} />

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className={styles.countdownOverlay}>
            <span className={styles.countdownNumber}>{countdown}</span>
          </div>
        )}

        {/* Instruction label */}
        <div className={styles.instructionBanner}>
          {mode === 'face'
            ? 'Align your face within the oval'
            : 'Stand with arms at your sides'}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {onCancel && (
          <button className={styles.controlBtn} onClick={onCancel}>
            ✕
          </button>
        )}
        <button
          className={styles.captureBtn}
          onClick={handleCapture}
          disabled={!isReady || countdown !== null}
        >
          <div className={styles.captureRing}>
            <div className={styles.captureCenter} />
          </div>
        </button>
        <button className={styles.controlBtn} onClick={handleFlipCamera}>
          🔄
        </button>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
