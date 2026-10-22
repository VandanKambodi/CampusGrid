/**
 * CampusGrid Platform Guide Assistant Controller
 * Provides interactive guidance, feature walkthroughs, and smart navigation assistance.
 */

const PLATFORM_KNOWLEDGE = [
    {
        id: 'vault',
        keywords: ['vault', 'notes', 'pdf', 'study material', 'pyq', 'question paper', 'chat with pdf', 'rag', 'upload notes'],
        title: 'Resource Vault & AI Study Notes',
        summary: `The **Resource Vault** is CampusGrid's academic repository where students share and search study notes, lab manuals, and previous year exam papers (PYQs).

### 🔑 Key Features:
• **PDF Uploads:** Upload study materials up to 15MB categorized by branch (CSE, ECE, ME, CE) and semester (1 to 8).
• **Chat with PDF (AI RAG):** Click the ✨ **Chat with AI** button on any document to ask questions, extract formulas, or summarize specific pages.
• **AI Vault Search:** Use the search bar at the top of the Vault to search text passages across all uploaded documents simultaneously.
• **Upvotes & Direct Downloads:** Upvote high-quality notes to recommend them to fellow students.

👉 Quick Link: [Open Resource Vault](/hub/vault)`,
        suggestions: ['How do I chat with a PDF?', 'How do I upload notes?', 'Where are placement drives?']
    },
    {
        id: 'placements',
        keywords: ['placement', 'job', 'internship', 'career', 'drive', 'hiring', 'company', 'apply'],
        title: 'Placements & Career Opportunities',
        summary: `The **Placements Cell** keeps you updated on active campus recruitment drives, internships, and entry-level career openings.

### 🔑 Key Features:
• **Verified Drives:** Filter drives by role type (**Internship**, **Full-Time**, or **Contract**).
• **Eligibility & Details:** View company background, job descriptions, and CTC/stipend info.
• **Direct Apply:** One-click external application links to official company job portals.

👉 Quick Link: [View Placement Drives](/hub/placements)`,
        suggestions: ['How to use Resource Vault?', 'How to connect with alumni & peers?', 'Check upcoming campus events']
    },
    {
        id: 'network',
        keywords: ['network', 'students', 'peer', 'classmate', 'find student', 'senior', 'search user', 'tech stack', 'skill'],
        title: 'Campus Network & Student Directory',
        summary: `The **Campus Network** allows you to discover and connect with fellow students across departments.

### 🔑 Key Features:
• **Skill & Tech Stack Search:** Filter classmates by technologies like React, Node.js, Python, Machine Learning, or Flutter.
• **Student Profiles:** View academic branch, roll number, project portfolio, GitHub, and LinkedIn links.
• **Follow & Connect:** Follow peers to see their updates on your home feed.

👉 Quick Link: [Explore Campus Network](/hub/network)`,
        suggestions: ['How do I chat with someone?', 'How to update my tech stack?', 'How do communities work?']
    },
    {
        id: 'chat',
        keywords: ['chat', 'message', 'messaging', 'dm', 'inbox', 'talk', 'conversation'],
        title: 'Real-Time Student Messaging',
        summary: `CampusGrid includes built-in **Real-Time Chat** powered by WebSockets so you can collaborate instantly.

### 🔑 Key Features:
• **Instant Direct Messaging:** Chat 1-on-1 with any student on campus.
• **Live Indicators:** Real-time typing indicators and online/offline status.
• **Unread Badges:** Clean message counters in the navigation bar to never miss a discussion.

👉 Quick Link: [Open Chat](/hub/chat)`,
        suggestions: ['How to find students in Network?', 'Where are clubs and communities?', 'How to use Vault?']
    },
    {
        id: 'communities',
        keywords: ['community', 'communities', 'club', 'clubs', 'society', 'groups', 'join club'],
        title: 'Clubs & Campus Communities',
        summary: `**Communities** bring campus societies, technical clubs, and interest groups into one central hub.

### 🔑 Key Features:
• **Club Directory:** Browse clubs across coding, robotics, cultural fests, sports, and entrepreneurship.
• **Join Requests:** Request to join a community and get approved by club administrators.
• **Exclusive Feeds & Files:** Access club-specific discussions, announcements, and study material.

👉 Quick Link: [Browse Communities](/hub/communities)`,
        suggestions: ['How to create a post?', 'Where are campus events?', 'How do Polls work?']
    },
    {
        id: 'polls',
        keywords: ['poll', 'polls', 'survey', 'surveys', 'vote', 'voting', 'feedback', 'opinion'],
        title: 'Campus Polls & Student Voice',
        summary: `The **Polls & Surveys** section gives every student an active voice in campus matters and department decisions.

### 🔑 Key Features:
• **Live Campus Polls:** Vote on active topics and view instant percentage-based distribution charts.
• **Targeted Surveys:** Participate in department or branch-specific academic surveys.
• **Anonymous Feedback:** Share constructive feedback on campus facilities and syllabus.

👉 Quick Link: [Go to Polls & Surveys](/hub/polls)`,
        suggestions: ['Where is the Campus Calendar?', 'How does the feed work?', 'How to view my notifications?']
    },
    {
        id: 'calendar',
        keywords: ['calendar', 'event', 'events', 'workshop', 'hackathon', 'fest', 'schedule', 'rsvp'],
        title: 'Campus Events & Calendar',
        summary: `Never miss a campus workshop, technical fest, hackathon, or seminar with the interactive **Campus Calendar**.

### 🔑 Key Features:
• **Monthly & List Views:** View all scheduled college activities at a glance.
• **RSVP & Registration:** Register for upcoming events directly from the event cards.
• **Category Filtering:** Filter events by technical workshops, cultural events, sports, and guest lectures.

👉 Quick Link: [Open Campus Calendar](/hub/calendar)`,
        suggestions: ['Where are placement drives?', 'How to join clubs?', 'How to use the feed?']
    },
    {
        id: 'feed',
        keywords: ['feed', 'post', 'posts', 'share', 'announcement', 'blog', 'lost', 'found'],
        title: 'Campus Social Feed & Lost & Found',
        summary: `The **Campus Feed** is the central town square for college discussions, student blogs, and announcements.

### 🔑 Key Features:
• **Create Posts:** Share project updates, blogs, questions, or campus announcements with images.
• **Lost & Found:** Report lost items (keys, ID cards, books) and mark them as resolved once returned.
• **Like & Comment:** Engage in discussions with classmates in comment threads.

👉 Quick Link: [Go to Feed](/hub/feed)`,
        suggestions: ['How to check notifications?', 'Where is Resource Vault?', 'How to find classmates?']
    },
    {
        id: 'notifications',
        keywords: ['notification', 'notifications', 'bell', 'alert', 'alerts', 'preferences'],
        title: 'Notifications & Alerts System',
        summary: `CampusGrid's **Notification Center** keeps you informed of all real-time activity on the platform.

### 🔑 Key Features:
• **Notification Bell:** Real-time badge in the top navigation bar showing unread alerts.
• **Categories:** Filter notifications by Social, Messages, Campus Events, Career/Placements, or System.
• **Custom Preferences:** Choose exactly which notifications you want to receive in your settings.

👉 Quick Link: [View Notifications](/hub/notifications)`,
        suggestions: ['How to customize my profile?', 'Where is the Resource Vault?', 'How to find placements?']
    },
    {
        id: 'profile',
        keywords: ['profile', 'bio', 'avatar', 'techstack', 'skills', 'github', 'portfolio', 'account'],
        title: 'Student Profile & Tech Portfolio',
        summary: `Your **Profile** serves as your campus digital identity and portfolio.

### 🔑 Key Features:
• **Tech Stack Badges:** Highlight your programming languages, frameworks, and tools.
• **Project Showcase:** List your best coding projects with live links and descriptions.
• **Social Handles:** Add your GitHub, LinkedIn, and personal portfolio links for recruiters and peers.

👉 Quick Link: [Edit My Profile](/hub/profile)`,
        suggestions: ['How to search peers in Network?', 'Where to find placement drives?', 'How to use Vault?']
    }
];

/**
 * Handle incoming questions for the Platform Guide Assistant
 */
const askPlatformAssistant = async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Please provide a question or topic.' });
    }

    const query = message.trim().toLowerCase();

    // 1. Check for quick intent matching in local knowledge base
    let bestMatch = null;
    let highestScore = 0;

    for (const item of PLATFORM_KNOWLEDGE) {
        let score = 0;
        for (const kw of item.keywords) {
            if (query.includes(kw)) {
                score += kw.length >= 4 ? 2 : 1;
            }
        }
        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }

    // Direct match found
    if (bestMatch && highestScore > 0) {
        return res.json({
            reply: bestMatch.summary,
            topic: bestMatch.title,
            suggestions: bestMatch.suggestions
        });
    }

    // 2. If no direct keyword match and GEMINI_API_KEY is available, synthesize with Gemini
    if (process.env.GEMINI_API_KEY) {
        try {
            const contextText = PLATFORM_KNOWLEDGE.map(k => `[${k.title}]\n${k.summary}`).join('\n\n');
            const promptText = `You are "CampusGrid Guide", the friendly, knowledgeable AI onboarding assistant for the CampusGrid student platform.
A student is asking: "${message}".

Use the following CampusGrid platform information to answer their question clearly, concisely, and helpfully.
Rules:
- Keep the response structured in clear bullet points or short paragraphs.
- If relevant, include internal markdown links like [Open Vault](/hub/vault), [View Placements](/hub/placements), [Explore Communities](/hub/communities), [Campus Network](/hub/network), [Go to Feed](/hub/feed), [Open Calendar](/hub/calendar), or [My Profile](/hub/profile).
- Be polite, welcoming, and encourage them to explore the features.

Platform Overview:
${contextText}`;

            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                }
            );

            if (geminiRes.ok) {
                const data = await geminiRes.json();
                const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiAnswer) {
                    return res.json({
                        reply: aiAnswer,
                        topic: 'Platform Assistant',
                        suggestions: [
                            'How to use Resource Vault?',
                            'Where are placement drives?',
                            'How to connect with classmates?'
                        ]
                    });
                }
            }
        } catch (apiErr) {
            console.warn('Platform Assistant Gemini fallback warning:', apiErr.message);
        }
    }

    // 3. Graceful fallback overview
    return res.json({
        reply: `👋 Hello! I'm your **CampusGrid Guide**. I can help you navigate all areas of our platform.

Here are the main features you can explore:
• 📚 **[Resource Vault](/hub/vault)**: Search semester study notes & chat with PDFs using AI.
• 💼 **[Placements](/hub/placements)**: Explore verified campus hiring drives and internships.
• 👥 **[Campus Network](/hub/network)**: Discover students by tech stack and branch.
• 💬 **[Direct Chat](/hub/chat)**: Real-time 1-on-1 messaging with peers.
• 🏆 **[Communities](/hub/communities)**: Join technical and cultural campus clubs.
• 🗳️ **[Polls & Surveys](/hub/polls)**: Vote on student issues and submit feedback.
• 📅 **[Campus Calendar](/hub/calendar)**: Stay updated on upcoming workshops and hackathons.
• 📰 **[Campus Feed](/hub/feed)**: Share announcements, project blogs, and Lost & Found notices.

What would you like to know more about?`,
        topic: 'CampusGrid Overview',
        suggestions: [
            'How to use Resource Vault?',
            'Where are placement drives?',
            'How to find peers in Network?',
            'How do communities work?'
        ]
    });
};

module.exports = {
    askPlatformAssistant,
    PLATFORM_KNOWLEDGE
};
