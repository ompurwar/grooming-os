import Replicate from 'replicate'

export interface VTOProvider {
  /**
   * Generates a Virtual Try-On image asynchronously.
   * @param humanImgUrl URL of the person's photo
   * @param garmImgUrl URL of the garment photo
   * @param garmentDescription Text description of the garment (e.g., 'red polo shirt')
   * @param webhookUrl The URL the provider should POST to when finished
   * @returns The provider-specific Job ID
   */
  generate(humanImgUrl: string, garmImgUrl: string, garmentDescription: string, webhookUrl: string): Promise<string>
}

class ReplicateVTOProvider implements VTOProvider {
  private replicate: Replicate;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  }

  async generate(humanImgUrl: string, garmImgUrl: string, garmentDescription: string, webhookUrl: string): Promise<string> {
    const prediction = await this.replicate.predictions.create({
      version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", // kwai-kolors/kolors-virtual-try-on
      input: {
        human_img: humanImgUrl,
        garm_img: garmImgUrl,
        garment_des: garmentDescription,
        is_checked: true,
        is_checked_crop: false
      },
      webhook: webhookUrl,
      webhook_events_filter: ["completed"]
    })

    return prediction.id
  }
}

// Add FalProvider, FashnProvider, etc. here in the future...

export function getVTOProvider(): VTOProvider {
  const providerType = process.env.VTO_PROVIDER || 'replicate'
  
  switch (providerType) {
    case 'replicate':
      return new ReplicateVTOProvider()
    // case 'fal':
    //   return new FalVTOProvider()
    default:
      return new ReplicateVTOProvider()
  }
}
