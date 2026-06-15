export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API key' });
    }

    const { messages } = req.body;

    const SYSTEM_PROMPT = `You are the Tech Connect Alberta community assistant — a friendly, knowledgeable helper for a Calgary-based tech community organization.

About Tech Connect Alberta:
- A community-driven social enterprise connecting tech job seekers, employers, entrepreneurs, and volunteers across Alberta
- Operated under the AMG Foundation, founded by Aniekan M. Greg
- Partners include: InceptionU, Platform Calgary, Gateway, AMG Foundation
- Over 5,000 community members, 500+ at companies, 10+ partners, 200+ success stories

Services:
1. Tech Consulting — free/low-cost tech support for nonprofits (websites, automation, IT helpdesk, AI onboarding, cybersecurity)
2. Find Talent — connecting employers with pre-vetted Alberta tech professionals at no cost to post
3. Join Talent Pool — helping career transitioners, new grads, and newcomers get visibility with Alberta employers

Community channels: Discord (2,000+ members), WhatsApp groups, biweekly newsletter
Events: Workshops, networking mixers, mentorship office hours — free for members

Upcoming events:
- Jun 24: Technical Interview Strategies workshop (Virtual, 6PM MST)
- Jul 8: Summer Tech Mixer at Platform Calgary (5:30PM MST)
- Jul 22: Career Transition Office Hours (Virtual)
- Aug 5: Intro to AI Tools for Non-Developers at InceptionU (6:30PM MST)

How to join: Visit the Join page on the website or reach out via Discord/WhatsApp. Membership is free.
How to volunteer: Submit via the Volunteer Registration page. Roles include mentorship, workshops, nonprofit project support, event help, resume reviewing.

Be warm, concise, and specific. Keep responses under 100 words unless the question truly requires more detail. Do not make up specific contact details.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                max_tokens: 1000,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messages
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq error:', JSON.stringify(data));
            return res.status(response.status).json({ error: data.error?.message || 'Groq error' });
        }

        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
        return res.status(200).json({ reply });

    } catch (err) {
        console.error('Handler error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
