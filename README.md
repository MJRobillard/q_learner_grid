# Q-Learning Grid World

An interactive visualization of Q-Learning algorithm in a grid world environment. Users can experiment with different hyperparameters and compete for high scores.

## Features

- **Interactive Grid World**: Visualize the Q-Learning agent navigating through a grid with hazards and goals
- **Hyperparameter Tuning**: Adjust learning rate, discount factor, epsilon, and reward structures
- **Real-time Visualization**: Watch the agent learn and improve over episodes
- **Highscore System**: Submit and compare scores with other users
  - **Local Scores**: Stored in browser localStorage
  - **Global Scores**: Shared across all users via server
- **Advanced Features**: Directional heuristics, reward normalization, and convergence tracking

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

1. **Run Episodes**: Use the control buttons to run single or multiple episodes
2. **Adjust Parameters**: Modify hyperparameters in the right panel to experiment
3. **Submit Scores**: After achieving a good score, click "Submit Score" to enter the leaderboard
4. **Compare Results**: Switch between local and global scoreboards

## Highscore System

The highscore feature allows users to:
- Submit scores with their name and hyperparameter configuration
- View both local (browser-stored) and global (server-stored) leaderboards
- See the hyperparameter settings used for each score
- Track their position in the global rankings

Scores are automatically sorted by total reward achieved, and the system keeps track of the top 50 global scores.

## Technical Details

- Built with Next.js 15 and React 19
- TypeScript for type safety
- Tailwind CSS for styling
- File-based storage for highscores (JSON)
- LocalStorage fallback for offline functionality

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
