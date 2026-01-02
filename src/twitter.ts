import fs from "fs";
import path from "path";
import pRetry, { AbortError } from "p-retry";
import { TwitterApi } from "twitter-api-v2";
import type { SendTweetV2Params } from "twitter-api-v2";
import { sleep } from "./utils/sleep.js"; 

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

  const client = this.client;
  if (!client) throw new Error("Twitter client not initialized");

  return await pRetry(
    async () => {
      let mediaIds: [string] | undefined;

      if (imagePath) {
        const mediaId = await this.uploadImage(imagePath);
        mediaIds = [mediaId];
      }

      const payload: SendTweetV2Params = { text };

      if (mediaIds) {
        payload.media = { media_ids: mediaIds };
      }

      const res = await client.v2.tweet(payload);
      return { id: res.data.id };
    },
    {
      retries: 3, 
      onFailedAttempt: async (error: any) => {
        const status =
          error?.response?.status ||
          error?.status ||
          error?.code;

        //Handle rate limiting explicitly
        if (status === 429) {
          const retryAfter =
            Number(error?.response?.headers?.["retry-after"]) || 60;

          console.warn(
            `Rate limit hit (429). Waiting ${retryAfter}s before retrying (attempt ${error.attemptNumber})`
          );

          await sleep(retryAfter * 1000);
          return;
        }

        //Non-retryable errors → stop immediately
        console.error("Non-retryable Twitter error:", error.message);
        throw new AbortError(error);
      }
    }
  );
}
}
