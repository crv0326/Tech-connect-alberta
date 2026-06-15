export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.groq_api_key;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API key in environment' });
    }

    const { messages } = req.body;

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
                    { role: 'system', content: 'You are the Tech Connect Alberta assistant. Be warm and helpful. Keep responses under 100 words.' },
                    ...messages
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq error:', JSON.stringify(data));
            return res.status(response.status).json({ error: data.error?.message || 'Groq error' });
        }

        const reply = data.choices?.[0]?.message?.content || "Sorry, no response.";
        return res.status(200).json({ reply });

    } catch (err) {
        console.error('Handler error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
