# AI-Powered Adaptive Graded Reader

An intelligent story generation platform that creates personalized reading content with dynamic difficulty levels using AI language models.

## Features

- Dynamic story generation using OpenAI's GPT-4-turbo
- Customizable story parameters (setting, characters, context)
- Multiple reading levels (A1-C2)
- Adjustable word count
- Story saving and management
- Modern, responsive UI

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Styling**: Tailwind CSS + shadcn/ui

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/beasting1231/genstory.git
cd genstory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_database_url
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Usage

1. Navigate to the "Create Story" page
2. Set your desired story parameters:
   - Story setting
   - Character names
   - Reading level
   - Word count
   - Additional context
3. Click "Generate Story" to create your personalized story
4. Save interesting stories to your collection

## License

MIT
