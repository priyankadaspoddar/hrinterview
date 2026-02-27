# HR Interview Practice App

An AI-powered HR interview practice application that helps users prepare for behavioral interviews using the STAR method.

## Features

- **AI-Generated Questions**: Get personalized behavioral interview questions across various categories
- **Real-time Feedback**: Receive instant AI evaluation using the STAR (Situation, Task, Action, Result) method
- **Emotion Tracking**: Vision-based emotion analysis for body language assessment
- **Voice Input**: Speak your answers naturally with speech recognition
- **PDF Reports**: Generate comprehensive interview performance reports
- **Progress Tracking**: Monitor your improvement across multiple sessions

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: Google Gemini 1.5 Flash for question generation and evaluation
- **Computer Vision**: MediaPipe for emotion tracking
- **Database**: Supabase for user management and data storage

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd hrinterview
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:
- Create a new Supabase project
- Deploy the edge function from `supabase/functions/hr-interview/`
- Set the `gemini` secret in Supabase with your Google Gemini API key

5. Start the development server:
```bash
npm run dev
```

## Deployment

This app can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

For production deployment:
1. Build the app: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are set in your deployment platform

## Usage

1. **Sign Up/Login**: Create an account to track your progress
2. **Start Interview**: Click "Start Interview" to begin
3. **Answer Questions**: Respond to AI-generated questions using the STAR method
4. **Receive Feedback**: Get real-time evaluation and improvement suggestions
5. **Generate Report**: Download a comprehensive PDF report of your performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

## License

This project is licensed under the MIT License.
