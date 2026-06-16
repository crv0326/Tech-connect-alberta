 
// api/chat.js — Vercel Serverless Function (our AI backend)
//
// This file runs on Vercel's servers, NOT in the browser.
// That's important because our Groq API key lives here as an
// environment variable — it's never sent to the user's browser.
//
// When the chat widget sends a message, it hits this endpoint.
// We take that message, add our system prompt (the AI's personality
// and rules), send it to Groq, and return the reply.
 

export default async function handler(req, res) {

    // Only accept POST requests — this isn't a page you can visit in a browser
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Grab the Groq API key from Vercel's environment variables
    // We check both uppercase and lowercase versions just in case
    // (Vercel was being weird about key naming during setup)
    const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;

    // If the key is missing, stop immediately — nothing will work without it
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API key' });
    }

    // The conversation history comes from the frontend (script.js)
    // It includes every message sent so far so the AI has context
    const { messages } = req.body;

    // This is the AI's "personality file" — it tells Groq exactly
    // who the assistant is, what it knows, and how it should behave.
    // Any time you want to change how the AI responds, edit this.
    const SYSTEM_PROMPT = `You are the Tech Connect Alberta community assistant on the website tech-connect-alberta.vercel.app. You ONLY direct people to pages on THIS website. NEVER mention or link to any other website. NEVER say "visit techconnectalberta.org" or make up URLs.

About Tech Connect Alberta:
- A community-driven social enterprise connecting tech job seekers, employers, entrepreneurs, and volunteers across Alberta
- Operated under the AMG Foundation
- Nearly 3,000 members across WhatsApp and Discord
- Partners: InceptionU, Platform Calgary, Gateway, AMG Foundation

Pages on THIS website (tech-connect-alberta.vercel.app):
- Home: main landing page with this chat
- Join Us: all social media links (Discord, WhatsApp, LinkedIn, Instagram) and newsletter signup
- Tech Consulting: free/low-cost tech help for nonprofits (websites, automation, IT, AI, cybersecurity)
- Find Talent: employers post roles to find pre-vetted Alberta tech professionals
- Join Talent Pool: job seekers and career transitioners submit their profile
- Events: upcoming workshops, networking nights, mentorship sessions (all free)
- Volunteer: register to mentor, facilitate workshops, or support nonprofit tech projects
- Community Projects: nonprofit website rebuilds, AI for nonprofits pilot, tech career curriculum
- Partners: InceptionU, Platform Calgary, Gateway, AMG Foundation
- Newsletter: subscribe for biweekly updates on jobs, events, and community news
- Mission: community first, breaking barriers, sustainable impact

Services offered:
1. Tech Consulting — free/low-cost for nonprofits: websites, automation, IT helpdesk, AI onboarding, cybersecurity
2. Find Talent — connect employers with pre-vetted Alberta tech professionals, free to post
3. Join Talent Pool — career transitioners, new grads, newcomers get visibility with Alberta employers

Upcoming events (all free for members):
- Jun 24: Technical Interview Strategies workshop (Virtual, 6PM MST)
- Jul 8: Summer Tech Mixer at Platform Calgary (5:30PM MST)
- Jul 22: Career Transition Office Hours (Virtual)
- Aug 5: Intro to AI Tools for Non-Developers at InceptionU (6:30PM MST)

STRICT RULES — follow every single time, no exceptions:
- NEVER paste any URL or link in your response, not even short ones
- NEVER mention any email address
- NEVER share any information about the founder, team, or executive staff — if asked, say exactly: "Our Team page is currently being built — check back soon! In the meantime, learn more about our mission by clicking Community in the menu above."
- For social media: say the platform name only and send them to Join Us. Example: "You can find our Discord, WhatsApp, LinkedIn and Instagram links on the Join Us page — click Join Us in the menu above."
- For services: direct to the specific page by name (e.g. "Check out the Tech Consulting page in the Services menu")
- For jobs/talent: direct to Join Talent Pool under Services in the menu
- For events: direct to the Events page under Community in the menu
- For volunteering: direct to the Volunteer page under Community in the menu
- For newsletter: direct to the Newsletter page under Community in the menu
- Always end with which page or menu item to click — make it easy for the user to take action
- Be warm, friendly and concise — keep responses under 80 words
- Do not make up any details not listed above`;

    try {
        // Send the conversation to Groq's API with our system prompt on top
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // fast, free Groq model
                max_tokens: 1000,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT }, // personality + rules go first
                    ...messages // then the actual conversation history
                ]
            })
        });

        const data = await response.json();

        // If Groq returned an error, log it and pass it back to the frontend
        if (!response.ok) {
            console.error('Groq error:', JSON.stringify(data));
            return res.status(response.status).json({ error: data.error?.message || 'Groq error' });
        }

        // Pull the AI's text reply out of Groq's response format
        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

        // Send just the reply text back to the frontend
        return res.status(200).json({ reply });

    } catch (err) {
        // Catch any unexpected errors (network issues, etc.)
        console.error('Handler error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
