from fastapi import APIRouter

from app.api.v1 import admin, auth, drivers, public, shippers, uploads

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(drivers.router)
api_router.include_router(shippers.router)
api_router.include_router(admin.router)
api_router.include_router(uploads.router)
api_router.include_router(public.router)
