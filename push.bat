@echo off
REM push.bat - D:\dakfarm ����, ����/���� Ǫ��

cd /d "D:\dakfarm"

REM ���� ���� (������ ����, ������ �߰�)
git init -b main 2>nul
git remote add origin https://github.com/bbibbubbang/dakfarm.git 2>nul
git remote set-url origin https://github.com/bbibbubbang/dakfarm.git

REM �׻� main���� �۾�
git checkout -B main

REM ���� ����ȭ: �� ���� �ӽ����� -> ���� �������� ���� -> ����
git add -A
git stash push -u -m pb >nul 2>&1

git fetch -v origin
git rebase origin/main || (git rebase --abort >nul 2>&1 & git pull --rebase --allow-unrelated-histories origin main)

git stash pop >nul 2>&1

REM Ŀ��(������ ������ �н�)
git add -A
git commit -m "�ڵ� ������Ʈ" 2>nul

REM Ǫ��(������ ù �ٷ� ���)
git push -u origin main || git push -u origin main --force-with-lease

echo [OK] done
pause
