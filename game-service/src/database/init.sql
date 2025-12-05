CREATE TABLE IF NOT EXISTS matches (
  match_id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'in_progress', 'finished')),
  mode VARCHAR(100) NOT NULL,
  tournament_id VARCHAR(255),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

-- Create players_in_match table (to store the players array)
CREATE TABLE IF NOT EXISTS players_in_match (
  id SERIAL PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  team VARCHAR(50),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, user_id)
);

-- Create index for players lookup
CREATE INDEX IF NOT EXISTS idx_players_match_id ON players_in_match(match_id);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players_in_match(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_matches_updated_at 
  BEFORE UPDATE ON matches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();