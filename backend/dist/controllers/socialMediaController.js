"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishListing = void 0;
const socialMediaQueue_1 = require("../queues/socialMediaQueue");
const publishListing = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const { platforms, message } = req.body;
        await socialMediaQueue_1.socialMediaQueue.add('publish', { listingId, platforms, message });
        res.json({ message: 'Publishing job has been queued.' });
    }
    catch (error) {
        next(error);
    }
};
exports.publishListing = publishListing;
//# sourceMappingURL=socialMediaController.js.map