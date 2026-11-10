# CityFix local AI service

This service runs only on the local Windows PC. It uses FastAPI and Ollama with
`qwen3-vl:8b`; it does not replace Neon and it is not required by the Vercel app.

## Setup in PowerShell

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
ollama pull qwen3-vl:8b
ollama serve
```

In another PowerShell window:

```powershell
cd C:\Users\STORM\Desktop\KomunaRaportAI\ai-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Check `http://127.0.0.1:8001/health`. The RTX 5070 can be used by Ollama
automatically; the service never exposes Ollama beyond localhost.

The Next.js app uses `AI_ENABLED=true` and `AI_SERVICE_URL=http://127.0.0.1:8001`
only in local `.env.local`. Set the same `AI_SERVICE_SECRET` in both local
environment files. Vercel must use `AI_ENABLED=false`.

## Tests

```powershell
python -m pytest
```
