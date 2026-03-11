'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductCatalog } from '@/components/ProductCatalog'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const jewelryImageRef = useRef<HTMLImageElement | null>(null)
  const faceDetectionRef = useRef<any>(null)
  const handDetectionRef = useRef<any>(null)
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [showUploadUI, setShowUploadUI] = useState(false)
  const [jewelryType, setJewelryType] = useState<'necklace' | 'earrings' | 'ring'>('necklace')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const jewelryTypeRef = useRef(jewelryType)
  useEffect(() => {
    jewelryTypeRef.current = jewelryType
  }, [jewelryType])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setUploadedImage(URL.createObjectURL(file))
      setShowUploadUI(false) // Optional: close UI after upload
    }
  }

  const handleProductSelect = (product: { name: string; image: string }) => {
    const productTypeMap: { [key: string]: 'necklace' | 'earrings' | 'ring' } = {
      Necklace: 'necklace',
      Ring: 'ring',
      Earring: 'earrings',
    }

    const newType = productTypeMap[product.name]
    if (newType) {
      setJewelryType(newType)
    }

    // Set the image from the catalog
    setUploadedImage(product.image)
  }

  useEffect(() => {
    const loadImage = async () => {
      // Define default images for each type
      const defaultImages: Record<string, string> = {
        necklace: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png',
        earrings: '/earing-removebg-preview.png',
        ring: '/ring-removebg-preview.png'
      }

      let imageUrl = uploadedImage || defaultImages[jewelryType]
      if (!imageUrl) return

      // Ensure local paths start with / to be found in public folder
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      console.log('[AR] Attempting to load image:', imageUrl)
      img.src = imageUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = (err) => {
          console.error(`[AR] Failed to load image at URL: ${imageUrl}. Make sure the file exists in the /public folder and the path is correct.`, err)
          reject(err)
        }
      })
      jewelryImageRef.current = img
    }
    loadImage().catch(() => { /* Error is now logged inside loadImage */ })
  }, [uploadedImage, jewelryType])
  
  useEffect(() => {
    const initAR = async () => {
      try {
        // Check camera permissions first
        try {
          const permission = await navigator.permissions.query({ name: 'camera' })
          if (permission.state === 'denied') {
            setPermissionState('denied')
            return
          }
        } catch (err) {
          // Fallback if permissions API is not supported
          console.log('[v0] Permissions API not available, proceeding with request')
        }

        // Load MediaPipe FaceMesh
        const faceMeshModule = await import('@mediapipe/tasks-vision')
        const { FaceLandmarker, HandLandmarker, FilesetResolver } = faceMeshModule

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          },
          numFaces: 1,
          runningMode: 'VIDEO',
        })

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          },
          numHands: 2,
          runningMode: 'VIDEO',
        })

        faceDetectionRef.current = faceLandmarker
        handDetectionRef.current = handLandmarker

        // Initialize video stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setPermissionState('granted')
          }
        }

        // Start AR rendering
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          canvas.width = window.innerWidth
          canvas.height = window.innerHeight

          const animate = async () => {
            if (!videoRef.current || !canvas) {
              requestAnimationFrame(animate)
              return
            }

            // Draw mirrored video
            ctx.save()
            ctx.scale(-1, 1)
            ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height)
            ctx.restore()

            // Run Detection based on selected jewelry type
            if (
              videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
              jewelryImageRef.current?.complete
            ) {
              // Handle Face Jewelry (Necklace, Earrings)
              if (jewelryTypeRef.current === 'necklace' || jewelryTypeRef.current === 'earrings') {
                const detectionResult = faceLandmarker.detectForVideo(videoRef.current, Date.now())
                
                if (detectionResult.faceLandmarks && detectionResult.faceLandmarks.length > 0) {
                  const landmarks = detectionResult.faceLandmarks[0]

                  if (jewelryTypeRef.current === 'necklace') {
                    const leftJaw = landmarks[172]
                    const rightJaw = landmarks[397]
                    const chin = landmarks[152]

                    const leftJawX = (1 - leftJaw.x) * canvas.width
                    const rightJawX = (1 - rightJaw.x) * canvas.width
                    const chinY = chin.y * canvas.height

                    const jawWidth = Math.abs(leftJawX - rightJawX)
                    const jawCenterX = (leftJawX + rightJawX) / 2

                    const necklaceWidth = jawWidth * 1.6
                    const necklaceHeight = (jewelryImageRef.current!.height / jewelryImageRef.current!.width) * necklaceWidth

                    const necklaceX = jawCenterX - necklaceWidth / 2
                    const necklaceY = chinY + necklaceHeight * 0.05

                    ctx.drawImage(jewelryImageRef.current!, necklaceX, necklaceY, necklaceWidth, necklaceHeight)
                  } else if (jewelryTypeRef.current === 'earrings') {
                    const leftEar = landmarks[361] // Left earlobe bottom
                    const rightEar = landmarks[132] // Right earlobe bottom
                    const leftEye = landmarks[446] // Left eye outer corner
                    const rightEye = landmarks[226] // Right eye outer corner

                    const leftEarX = (1 - leftEar.x) * canvas.width
                    const leftEarY = leftEar.y * canvas.height
                    const rightEarX = (1 - rightEar.x) * canvas.width
                    const rightEarY = rightEar.y * canvas.height
                    const leftEyeX = (1 - leftEye.x) * canvas.width
                    const rightEyeX = (1 - rightEye.x) * canvas.width

                    const faceWidth = Math.abs(leftEyeX - rightEyeX)
                    const earringWidth = faceWidth * 0.4
                    const earringHeight = (jewelryImageRef.current!.height / jewelryImageRef.current!.width) * earringWidth

                    // Draw left earring
                    ctx.drawImage(
                      jewelryImageRef.current!,
                      leftEarX - earringWidth / 2,
                      leftEarY,
                      earringWidth,
                      earringHeight,
                    )

                    // Draw right earring
                    ctx.drawImage(
                      jewelryImageRef.current!,
                      rightEarX - earringWidth / 2,
                      rightEarY,
                      earringWidth,
                      earringHeight,
                    )
                  }
                }
              } 
              // Handle Hand Jewelry (Ring)
              else if (jewelryTypeRef.current === 'ring') {
                const detectionResult = handLandmarker.detectForVideo(videoRef.current, Date.now())
                
                if (detectionResult.landmarks && detectionResult.landmarks.length > 0) {
                  for (const landmarks of detectionResult.landmarks) {
                    // Ring Finger MCP (13) and PIP (14)
                    const mcp = landmarks[13]
                    const pip = landmarks[14]

                    // Convert to canvas coords (mirrored)
                    const mcpX = (1 - mcp.x) * canvas.width
                    const mcpY = mcp.y * canvas.height
                    const pipX = (1 - pip.x) * canvas.width
                    const pipY = pip.y * canvas.height

                    // Calculate center position for the ring (midpoint between knuckle and joint)
                    const centerX = (mcpX + pipX) / 2
                    const centerY = (mcpY + pipY) / 2

                    // Calculate size based on finger segment length
                    const fingerSegmentLength = Math.sqrt(Math.pow(mcpX - pipX, 2) + Math.pow(mcpY - pipY, 2))
                    const ringWidth = fingerSegmentLength * 0.8 // Adjust scale as needed
                    const ringHeight = (jewelryImageRef.current!.height / jewelryImageRef.current!.width) * ringWidth

                    // --- Draw Ring with Rotation ---
                    // Calculate the angle of the finger segment
                    const angle = Math.atan2(pipY - mcpY, pipX - mcpX)

                    // Save the current canvas state
                    ctx.save()
                    // Translate to the center of the ring to rotate around this point
                    ctx.translate(centerX, centerY)
                    // Rotate the canvas to match the finger's angle
                    // Add Math.PI / 2 to make the ring horizontal across the finger
                    ctx.rotate(angle + Math.PI / 2)
                    // Draw the ring. Since we've translated the origin,
                    // we draw at (-width/2, -height/2) to center it.
                    ctx.drawImage(
                      jewelryImageRef.current!,
                      -ringWidth / 2,
                      -ringHeight / 2,
                      ringWidth,
                      ringHeight,
                    )
                    // Restore the canvas to its original state
                    ctx.restore()
                  }
                }
              }
            }

            requestAnimationFrame(animate)
          }

          animate()
        }
      } catch (error) {
        console.error('AR initialization error:', error)
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setPermissionState('denied')
        } else {
          setPermissionState('denied')
        }
      }
    }

    // Load MediaPipe module
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0'
    script.onload = initAR
    document.head.appendChild(script)

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={() => setShowUploadUI(!showUploadUI)} size="icon" variant="ghost" className="text-white rounded-full bg-black/20 hover:bg-white/20 hover:text-white">
          <Upload className="h-5 w-5" />
          <span className="sr-only">Upload Jewelry</span>
        </Button>
      </div>

      {showUploadUI && (
        <div className="absolute top-20 right-4 z-10 bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg shadow-lg w-72 space-y-4 border border-gray-700">
          <h3 className="text-white font-semibold">Try On Jewelry</h3>
          <div>
            <label htmlFor="jewelry-upload" className="text-sm font-medium text-gray-300 block mb-2">
              Upload Image (.png)
            </label>
            <input
              id="jewelry-upload"
              type="file"
              accept="image/png"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Jewelry Type</label>
            <Select onValueChange={(value) => setJewelryType(value as any)} defaultValue={jewelryType}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                <SelectItem value="necklace">Necklace</SelectItem>
                <SelectItem value="earrings">Earrings</SelectItem>
                <SelectItem value="ring">Ring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {permissionState === 'pending' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <p className="text-lg font-medium mb-2">Requesting Camera Access</p>
            <p className="text-sm text-gray-400">Please allow camera access in your browser</p>
          </div>
        </div>
      )}
      
      <ProductCatalog onProductSelect={handleProductSelect} />

      {permissionState === 'denied' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white max-w-sm">
            <p className="text-lg font-medium mb-4">Camera Access Required</p>
            <p className="text-sm text-gray-400 mb-6">
              Please enable camera permissions in your browser settings to use the AR necklace try-on.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
