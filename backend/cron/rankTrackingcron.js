import cron from 'node-cron';
import keywordTracking from '../models/keywordTracking.js';
import { keyWordTracking } from '../services/keywordTrackerservices.js';

export function startRankTrackingCron() {
    cron.schedule("0 6 * * *", async () => {
        console.log('Start Daily rank tracking...');
        try {
            const activeRankings = await keywordTracking.find({ active: true });
            for (const tracking of activeRankings) {
                try {
                    tracking.status = "checking";
                    await tracking.save();
                    await keyWordTracking(tracking);
                    await new Promise((r) => setTimeout(r, 10000 + Math.random() * 5000));
                } catch (error) {
                    console.error(`[CRON] Failed for keyword "${tracking.keyword}":`, error.message);
                }
            }
        } catch (error) {
            console.error("[CRON] Rank tracking cron error:", error.message);
        }
    });
    console.log('Rank Tracking job scheduled');
}
