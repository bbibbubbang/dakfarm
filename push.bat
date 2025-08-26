@echo off
REM push.bat - ignore save/ and push (fixed path: D:\dakfarm)

cd /d "D:\dakfarm"

echo [*] ensure .gitignore has 'save/'
if not exist ".gitignore" type NUL > ".gitignore"
findstr /r /c:"^save/$" ".gitignore" >nul 2>&1 || echo save/>> ".gitignore"

echo [*] untrack already-committed files under save/
git rm --cached -r -- "save" 2>nul

echo [*] sync with remote (safe rebase)
git checkout -B main
git add -A
git stash push -u -m pb >nul 2>&1
git fetch -v origin
git rebase origin/main || (git rebase --abort >nul 2>&1 & git pull --rebase --allow-unrelated-histories origin main)
git stash pop >nul 2>&1

echo [*] commit and push
git add -A
git commit -m "chore: ignore save/ and update" 2>nul
git push -u origin main

echo [OK] done
pause
