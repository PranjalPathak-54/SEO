export async function rankTracker(keyword, targetDomain) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cx) {
        console.error("[RankTracker] Missing GOOGLE_API_KEY or GOOGLE_CSE_ID in .env");
        return { success: false, error: "Google Search API not configured" };
    }

    const cleanTarget = targetDomain.replace("www.", "").toLowerCase();
    let found = null;
    const allResults = [];

    try {
        for (let page = 0; page < 3; page++) {
            const start = page * 10 + 1;
            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&start=${start}&num=10&gl=us&hl=en`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.error) {
                console.error("[RankTracker] Google API error:", data.error.message);
                break;
            }

            const items = data.items || [];
            if (!items.length) break;

            for (const item of items) {
                const position = allResults.length + 1;
                let domain = "";
                try {
                    domain = new URL(item.link).hostname.replace("www.", "").toLowerCase();
                } catch {
                    domain = (item.displayLink || "").replace("www.", "").toLowerCase();
                }

                const result = {
                    position,
                    url: item.link,
                    domain,
                    title: item.title || "",
                    snippet: item.snippet || "",
                };
                allResults.push(result);

                if (!found && (domain.includes(cleanTarget) || cleanTarget.includes(domain))) {
                    found = { ...result, page: page + 1 };
                }
            }

            if (found) break;
        }

        const competitors = allResults
            .filter((r) => !r.domain.includes(cleanTarget) && !cleanTarget.includes(r.domain))
            .slice(0, 10);

        return {
            success: true,
            data: {
                keyword,
                targetDomain,
                position: found?.position || null,
                page: found?.page || null,
                title: found?.title || "",
                snippet: found?.snippet || "",
                competitors,
                totalResultsScanned: allResults.length,
            },
        };
    } catch (error) {
        console.error("[RankTracker] Error:", error.message);
        return { success: false, error: error.message };
    }
}
