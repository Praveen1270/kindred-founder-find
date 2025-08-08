# Founders Collaboration Platform

A modern web application that connects startup founders by matching them based on complementary skills, industry alignment, and startup stage compatibility. Built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### 🚀 Core Functionality
- **User Authentication**: Secure signup/login with Supabase Auth
- **Profile Creation**: Comprehensive founder profiles with skills and startup ideas
- **Smart Matching**: AI-powered matching algorithm based on:
  - Skill complementarity (40% weight)
  - Industry similarity (30% weight)
  - Stage alignment (30% weight)
- **Real-time Messaging**: In-app messaging system for matched founders
- **Notifications**: Email and in-app notifications for new matches
- **Dashboard**: Comprehensive dashboard with analytics and match management

### 🎯 Key Features
- **Founder Profiles**: Detailed profiles with skills, experience, and contact information
- **Startup Ideas**: Submit and manage startup ideas with industry and stage classification
- **Match Generation**: Automated matching with compatibility scores
- **Messaging System**: Real-time chat between matched founders
- **Search & Discovery**: Browse all available founders and their ideas
- **Notifications**: Stay updated with new matches and messages

### 🛠 Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query + React Hooks
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kindred-founder-find
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update `src/integrations/supabase/client.ts` with your credentials

4. **Run database migrations**
   ```bash
   # Apply the database schema
   # Copy the contents of supabase/migrations/001_initial_schema.sql
   # and run it in your Supabase SQL editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Database Schema

### Tables
- **profiles**: Founder profiles with personal information and skills
- **startup_ideas**: Startup ideas with industry and stage classification
- **matches**: Generated matches between founders with compatibility scores
- **messages**: Real-time messaging between matched founders
- **notifications**: In-app notifications for users

### Key Functions
- **calculate_compatibility_score()**: Calculates match compatibility (0-100)
- **generate_matches()**: Generates new matches between all founders
- **send_match_notification()**: Sends notifications when matches are created

## Usage

### For Founders

1. **Sign Up**: Create an account with your email and password
2. **Complete Profile**: Add your skills, experience, and contact information
3. **Submit Startup Idea**: Describe your startup idea, industry, and stage
4. **Generate Matches**: Click "Generate Matches" to find potential co-founders
5. **Connect**: Message matched founders and start conversations
6. **Stay Updated**: Check notifications for new matches and messages

### Matching Algorithm

The platform uses a sophisticated matching algorithm that considers:

- **Skill Complementarity (40%)**: Matches founders whose skills complement each other's needs
- **Industry Similarity (30%)**: Prefers founders in similar or related industries
- **Stage Alignment (30%)**: Matches founders at similar startup stages

### Security Features

- **Row Level Security (RLS)**: Database-level security policies
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Privacy**: Users can only see their own data and matches
- **GDPR Compliance**: Built-in data protection features

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Auth/          # Authentication components
│   ├── Dashboard/     # Main dashboard
│   ├── Profile/       # Profile management
│   └── ui/           # Reusable UI components
├── hooks/             # Custom React hooks
├── integrations/      # External service integrations
│   └── supabase/     # Supabase client and types
├── lib/              # Utility functions and services
│   ├── matching-service.ts
│   ├── notification-service.ts
│   └── messaging-service.ts
└── pages/            # Page components
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **AWS Amplify**: Full-stack deployment
- **Heroku**: Traditional hosting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@foundercollab.com or create an issue in this repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced filtering options
- [ ] Video call integration
- [ ] Startup idea validation
- [ ] Investor matching
- [ ] Mentorship program
- [ ] Events and meetups
- [ ] Analytics dashboard
- [ ] API for third-party integrations

---

Built with ❤️ for the startup community
