"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishToSocialMedia = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const client_1 = require("@prisma/client");
const twitter_api_v2_1 = require("twitter-api-v2");
const prisma = new client_1.PrismaClient();
class TwitterPublishingAdapter {
    constructor(config) {
        this.client = new twitter_api_v2_1.TwitterApi({
            appKey: config.apiKey,
            appSecret: config.apiSecret,
            accessToken: config.accessToken,
            accessSecret: config.apiSecret, // Assuming apiSecret is the access token secret
        });
    }
    async publish(listing, config, message) {
        const tweet = `${message}\n\n${listing.title}\n${listing.description}\n\nPrice: $${listing.price}`;
        const { data: createdTweet } = await this.client.v2.tweet(tweet);
        return { success: true, url: `https://twitter.com/someuser/status/${createdTweet.id}` };
    }
}
const getPlatformAdapter = (platform, config) => {
    switch (platform) {
        case 'twitter':
            return new TwitterPublishingAdapter(config);
        default:
            throw new errorMiddleware_1.AppError(`Platform not supported: ${platform}`, 400);
    }
};
const publishToSocialMedia = async (listingId, platforms, message) => {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
        throw new errorMiddleware_1.AppError('Listing not found', 404);
    }
    const results = {};
    for (const platform of platforms) {
        try {
            const config = await prisma.socialMediaPlatformConfig.findUnique({ where: { platformName: platform } });
            if (!config || !config.isEnabled) {
                throw new errorMiddleware_1.AppError(`Platform not configured or disabled: ${platform}`, 400);
            }
            const adapter = getPlatformAdapter(platform, config);
            const result = await adapter.publish(listing, config, message);
            results[platform] = { success: true, data: result };
        }
        catch (error) {
            results[platform] = { success: false, error: error.message };
        }
    }
    return results;
};
exports.publishToSocialMedia = publishToSocialMedia;
//# sourceMappingURL=socialMediaService.js.map