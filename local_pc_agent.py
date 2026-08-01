from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import subprocess
import os

app = FastAPI(title="EV Agent", description="Lightweight Windows Background Executor Service", version="1.0.0")
security = HTTPBearer()
TOKEN = "secret-ev-agent-token-12345"

class ExecutePayload(BaseModel):
    command: str

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")
    return credentials.credentials

@app.get("/")
def read_root():
    return {"name": "EV Agent", "status": "running"}

@app.post("/execute")
def execute_command(payload: ExecutePayload, token: str = Depends(verify_token)):
    try:
        # Run command in shell
        result = subprocess.run(
            payload.command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=30
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
