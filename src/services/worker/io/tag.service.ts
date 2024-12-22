/// <reference lib="webworker" />
import type { tag } from '@stitches/io'

import { AbstractService } from './abstract.service'

export class TagService extends AbstractService {
  async getTags(): Promise<tag.Tag[]> {
    const tags = await this.io.repo.tags.all()
    return tags
  }
}
