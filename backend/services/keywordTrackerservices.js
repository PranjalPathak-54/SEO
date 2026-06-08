import { rankTracker } from "./rankTrackerservices.js";

export async function keyWordTracking(tracking) {
    try {
        const result = await rankTracker(tracking.keyword, tracking.domain);

        if (!result.success) {
            tracking.status = "failed";
            await tracking.save().catch(() => {});
            return { success: false, error: result.error };
        }

        const prev = tracking.currentPosition;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        tracking.currentPosition = result.data.position;
        tracking.currentPage = result.data.page;
        tracking.competitors = result.data.competitors;
        tracking.lastChecked = new Date();
        tracking.status = "completed";

        tracking.positionChange = prev && result.data.position ? prev - result.data.position : 0;

        if (result.data.position && (!tracking.bestPosition || result.data.position < tracking.bestPosition)) {
            tracking.bestPosition = result.data.position;
        }

        if (result.data.position) {
            const historyEntry = {
                date: today,
                position: result.data.position,
                page: result.data.page,
                title: result.data.title,
                snippet: result.data.snippet,
            };
            const idx = tracking.rankHistory.findIndex((h) => h.date.toDateString() === today.toDateString());
            if (idx >= 0) {
                tracking.rankHistory[idx] = historyEntry;
            } else {
                tracking.rankHistory.push(historyEntry);
            }
        }

        await tracking.save();
        return result;
    } catch (error) {
        console.error("Rank Update error:", error.message);
        tracking.status = "failed";
        await tracking.save().catch(() => {});
        return { success: false, error: error.message };
    }
}
