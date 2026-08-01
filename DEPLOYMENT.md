# Deployment Guide for E.V. (Telegram AI Assistant)

Since you want a completely **free** deployment where your data (database, settings, contacts) **does not get deleted** when the app sleeps, **Fly.io** is the best choice! 

Services like Render or Heroku on their free tiers delete files on restart (so your SQLite database would reset). Fly.io gives you a free 3GB persistent disk.

Here is the exact step-by-step guide to deploying it via GitHub to Fly.io.

### Step 1: Push your code to GitHub
1. Make sure all your code is pushed to a private GitHub repository.

### Step 2: Install Fly CLI & Login
1. Download and install Fly.io's command-line tool (`flyctl`):
   - **Windows:** Open PowerShell and run: `iwr https://fly.io/install.ps1 -useb | iex`
   - **Mac/Linux:** Open Terminal and run: `curl -L https://fly.io/install.sh | sh`
2. Run `fly auth login` in your terminal to create an account and log in.

### Step 3: Initialize Fly App
1. Open terminal in your project folder.
2. Run `fly launch`
3. It will detect the `Dockerfile`. Follow the prompts:
   - Choose a name (or leave blank for random).
   - Choose a region close to you.
   - **Important:** Say **No** to Postgres database and Redis.
   - Say **No** to deploying right now (we need to attach storage first).

### Step 4: Create Free Storage (Volume)
Run this command to create a 1GB free disk named "data":
```bash
fly volumes create data --size 1
```

### Step 5: Update `fly.toml`
Open the `fly.toml` file that was just created in your folder, and add this block at the very bottom so Fly knows where to mount the disk:

```toml
[mounts]
  source = "data"
  destination = "/data"
```

### Step 6: Set your Secrets
Run these commands in terminal to securely save your API keys (do not put them in code):
```bash
fly secrets set GEMINI_API_KEY="your_gemini_key"
fly secrets set TELEGRAM_API_ID="your_telegram_api_id"
fly secrets set TELEGRAM_API_HASH="your_telegram_api_hash"
# If you want to use Groq as fallback:
fly secrets set GROQ_API_KEY="your_groq_key"
```

### Step 7: Update Database Path for Production
In Fly.io, we need to save the SQLite database inside the `/data` folder we just mounted, otherwise it will get deleted.
Go to your `fly secrets` and set the database path:
```bash
fly secrets set DB_PATH="/data/database.sqlite"
```

### Step 8: Deploy!
Run this command to push your app live:
```bash
fly deploy
```

### Setting up Auto-Deploy from GitHub (Optional)
If you want it to automatically update every time you push to GitHub (like Vercel):
1. Go to your Fly.io dashboard -> Tokens -> Create a Deploy Token.
2. Go to your GitHub Repo -> Settings -> Secrets -> Actions -> New repository secret.
3. Name it `FLY_API_TOKEN` and paste the token.
4. Run `fly tokens deploy` locally and follow the instructions to set up the GitHub Action.

Your AI assistant will now run 24/7 (Fly apps auto-wake instantly) and your data will stay safe!
