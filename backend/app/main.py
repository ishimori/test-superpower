from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import master

app = FastAPI(title="Housing E-Kintai API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(master.router)

@app.get("/health")
def health():
    return {"status": "ok"}
