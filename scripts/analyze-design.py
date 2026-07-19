#!/usr/bin/env python3
"""
Analyze the uploaded design image using OpenRouter API.
"""
import base64
import json
import urllib.request

# Read the image
with open('/home/z/my-project/upload/Untitled.png', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# Read API key
with open('/home/z/my-project/.z-ai-config', 'r') as f:
    config = json.load(f)

api_key = config['apiKey']
model = "qwen/qwen3-vl-8b-instruct"

prompt = """Describe this UI design in extreme detail. I need to recreate it in code.

Please describe:
1. Overall layout (columns, sections, positioning)
2. Every section from top to bottom, left to right
3. Colors used (background, text, accents, cards)
4. Typography (font sizes, weights, hierarchy)
5. Spacing and padding
6. Icons or visual elements
7. Any charts, badges, or special UI components
8. The medicine name and all visible text content

Be very specific — I need to write HTML/CSS/React code to match this design exactly."""

body = {
    "model": model,
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}}
            ]
        }
    ],
    "temperature": 0.1,
    "max_tokens": 4000,
}

req = urllib.request.Request(
    "https://openrouter.ai/api/v1/chat/completions",
    data=json.dumps(body).encode('utf-8'),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://medsnap.app",
        "X-Title": "MedSnap Design Analysis",
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=60) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(result['choices'][0]['message']['content'])
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
