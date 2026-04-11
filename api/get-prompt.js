JavaScript
export default function handler(req, res) {
    const userAgent = req.headers['user-agent'] || "";
    const referer = req.headers['referer'] || "";

    // Only allow Google to see the real image
    const isGoogle = userAgent.includes("Google") || referer.includes("google.com");

    if (isGoogle) {
        // Replace 'YOUR_USER' with your actual GitHub username
        res.redirect(`https://githubusercontent.com`);
    } else {
        res.redirect("https://placehold.co");
    }
}
