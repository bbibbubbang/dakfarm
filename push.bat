@echo off
REM push.bat - D:\dakfarm 고정, 간단/안정 푸시

cd /d "D:\dakfarm"

REM 원격 고정 (있으면 무시, 없으면 추가)
git init -b main 2>nul
git remote add origin https://github.com/bbibbubbang/dakfarm.git 2>nul
git remote set-url origin https://github.com/bbibbubbang/dakfarm.git

REM 항상 main으로 작업
git checkout -B main

REM 안전 동기화: 내 변경 임시저장 -> 원격 기준으로 맞춤 -> 복원
git add -A
git stash push -u -m pb >nul 2>&1

git fetch -v origin
git rebase origin/main || (git rebase --abort >nul 2>&1 & git pull --rebase --allow-unrelated-histories origin main)

git stash pop >nul 2>&1

REM 커밋(없으면 조용히 패스)
git add -A
git commit -m "자동 업데이트" 2>nul

REM 푸시(보통은 첫 줄로 충분)
git push -u origin main || git push -u origin main --force-with-lease

echo [OK] done
pause
