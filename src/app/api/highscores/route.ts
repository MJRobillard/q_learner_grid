import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface HighscoreEntry {
  id: string;
  name: string;
  score: number;
  episode: number;
  config: any;
  mode: 'easy' | 'complex';  // Track which mode was used
  timestamp: number;
}

const highscoresFile = path.join(process.cwd(), 'data', 'highscores.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(highscoresFile);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load highscores from file
async function loadHighscores(): Promise<HighscoreEntry[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(highscoresFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save highscores to file
async function saveHighscores(highscores: HighscoreEntry[]) {
  await ensureDataDir();
  await fs.writeFile(highscoresFile, JSON.stringify(highscores, null, 2));
}

export async function GET() {
  try {
    const highscores = await loadHighscores();
    return NextResponse.json(highscores);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load highscores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newEntry: HighscoreEntry = await request.json();
    
    // Validate required fields
    if (!newEntry.name || typeof newEntry.score !== 'number') {
      return NextResponse.json({ error: 'Invalid score data' }, { status: 400 });
    }

    // Load existing highscores
    const highscores = await loadHighscores();
    
    // Add new entry
    highscores.push(newEntry);
    
    // Sort by score (highest first) and keep top 50
    highscores.sort((a, b) => b.score - a.score);
    const topHighscores = highscores.slice(0, 50);
    
    // Save back to file
    await saveHighscores(topHighscores);
    
    return NextResponse.json({ success: true, position: topHighscores.findIndex(h => h.id === newEntry.id) + 1 });
  } catch (error) {
    console.error('Error saving highscore:', error);
    return NextResponse.json({ error: 'Failed to save highscore' }, { status: 500 });
  }
} 