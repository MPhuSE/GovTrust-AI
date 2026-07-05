@echo off
setlocal
chcp 65001 >nul

:: GovTrust AI — QUICKSTART (Windows PowerShell / CMD)

echo ============================================================
echo  GovTrust AI - Cài dat va chay he thong (Windows)
echo ============================================================
echo.

:: Kiem tra Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Chua cai Docker. Vui long cai Docker Desktop va chay lai.
    pause
    exit /b 1
)

echo - Dang cau hinh moi truong (Sinh Key qua Docker Node)...
docker run --rm -v "%cd%:/app" -w /app node:20-alpine node scripts/setup.js

echo.
echo - Dang dung toan bo he thong (lan dau tai model se ton 5-10 phut)...
docker compose -f infra/docker-compose.yml up --build -d

echo.
echo [OK] He thong dang duoc khoi dong ngam.
echo.
echo ============================================================
echo  Diem truy cap:
echo    Nguoi dan   -^> http://localhost:3000
echo    API Gateway -^> http://localhost:8080/health
echo    Swagger API -^> http://localhost:4000/api/docs
echo.
echo  Lenh huu ich:
echo    Xem log: docker compose -f infra/docker-compose.yml logs -f
echo    Dung:    docker compose -f infra/docker-compose.yml down
echo ============================================================
pause
