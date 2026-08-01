from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import subprocess
import uvicorn

app = FastAPI()
security = HTTPBearer()

# Token configured in your cloud settings
TOKEN = "secret-ev-agent-token-12345"

class ExecutePayload(BaseModel):
    command: str

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")
    return credentials.credentials

@app.post("/execute")
def execute_command(payload: ExecutePayload, token: str = Depends(verify_token)):
    try:
        print(f"Executing: {payload.command}")
        # Run command on Windows
        result = subprocess.run(
            payload.command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=30
        )
        return {
            "output": result.stdout or "Command executed.",
            "error": result.stderr
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
