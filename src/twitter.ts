import fs from "fs";
import path from "path";
import pRetry from "p-retry";
import { TwitterApi } from "twitter-api-v2";
import type { SendTweetV2Params } from "twitter-api-v2";

export type TwitterConfig = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
  dryRun: boolean;
};

export class TwitterPoster {
  private client?: TwitterApi;
  private dryRun: boolean;

  constructor(cfg: TwitterConfig) {
    this.dryRun = cfg.dryRun;

    if (!cfg.dryRun) {
      this.client = new TwitterApi({
        appKey: cfg.appKey,
        appSecret: cfg.appSecret,
        accessToken: cfg.accessToken,
        accessSecret: cfg.accessSecret
      });
    }
  }

  private async uploadImage(imagePath: string): Promise<string> {
    if (!this.client) throw new Error("Twitter client not initialized");

    const absolutePath = path.resolve(imagePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Image not found: ${absolutePath}`);
    }

    const imageBuffer = fs.readFileSync(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();

    const mimeType =
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

    return await this.client.v1.uploadMedia(imageBuffer, { mimeType });
  }

  async postTweet(
    text: string,
    imagePath?: string
  ): Promise<{ id?: string }> {
    if (this.dryRun) {
      console.log("[DRY_RUN] tweet:", text);
      if (imagePath) console.log("[DRY_RUN] image:", imagePath);
      return {};
    }

    if (!this.client) throw new Error("Twitter client not initialized");

    return await pRetry(
      async () => {
        let mediaIds: string[] | undefined;

        if (imagePath) {
          const mediaId = await this.uploadImage(imagePath);
          mediaIds = [mediaId];
        }

        const payload: SendTweetV2Params = { text };

        if (mediaIds) {
          payload.media = { media_ids: [mediaIds[0]] };
        }

        const res = await this.client!.v2.tweet(payload);
        return { id: res.data.id };
      },
      {
        retries: 5,
        minTimeout: 1_000,
        maxTimeout: 30_000,
        onFailedAttempt: (err) => {
          console.warn(
            `Tweet failed (attempt ${err.attemptNumber}):`,
            err.message
          );
        }
      }
    );
  }
}
