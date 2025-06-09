"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrgencyService = exports.Sentiment = void 0;
var Sentiment;
(function (Sentiment) {
    Sentiment["POSITIVE"] = "POSITIVE";
    Sentiment["NEGATIVE"] = "NEGATIVE";
    Sentiment["NEUTRAL"] = "NEUTRAL";
})(Sentiment || (exports.Sentiment = Sentiment = {}));
class UrgencyService {
    isUrgent(sentiment) {
        return sentiment === 'NEGATIVE';
    }
}
exports.UrgencyService = UrgencyService;
//# sourceMappingURL=urgency.service.js.map