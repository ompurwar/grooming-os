import { proxyActivities } from '@temporalio/workflow'
import type * as activities from './activities'

const { analyzeWardrobeItemImage, generateOutfitRecommendation } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function processWardrobeUploadWorkflow(imageUrl: string, userId: string): Promise<any> {
  // 1. Analyze the image using Vision AI
  const analysisResult = await analyzeWardrobeItemImage(imageUrl, userId)
  
  // 2. We could save to DB here via another activity or return the result
  return analysisResult
}

export async function generateStylingWorkflow(prompt: string, userId: string, wardrobeItems?: any[]): Promise<any> {
  // 1. Orchestrate LLM styling
  const outfitResult = await generateOutfitRecommendation(prompt, userId, wardrobeItems)
  return outfitResult
}
