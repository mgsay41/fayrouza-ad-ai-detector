Create a simple, modern web application for testing an AI ad moderation system. Requirements:

FUNCTIONALITY:
1. A form to submit ad details:
   - Ad Title (text input)
   - Ad Description (textarea)
   - Price (number input)
   - Category (dropdown with options: Electronics, Vehicles, Real Estate, Clothing, Home & Garden, Services, Other)
   - Image Upload (file input - accept images only)

2. Submit button that sends data to n8n webhook

3. Results display section showing:
   - AI Decision (Approve/Review/Reject) with color coding:
     * Approve: Green
     * Review: Orange  
     * Reject: Red
   - Confidence Score (with progress bar)
   - Reasoning (detailed explanation)
   - Violations (if any)
   - Recommendations (if any)
   - Full AI Response (collapsible JSON viewer)

DESIGN:
- Modern, clean UI using Tailwind CSS
- Responsive design (mobile-friendly)
- RTL support for Arabic (toggle button)
- Dark/Light mode toggle
- Loading state with spinner during API call
- Error handling with user-friendly messages
- Form validation before submission

TECHNICAL:
- Single HTML file with embedded CSS and JavaScript
- Use Fetch API to send multipart/form-data to n8n webhook
- Convert image to base64 for sending
- Handle CORS appropriately
- Show/hide results section based on submission state
- Add ability to test multiple ads without page reload
- Include sample test data button for quick testing

ADDITIONAL FEATURES:
- History of tested ads (stored in localStorage)
- Export results as JSON
- Clear form button
- Copy AI response to clipboard
- Response time display

Make it production-quality, visually appealing, and easy to use for testing purposes.