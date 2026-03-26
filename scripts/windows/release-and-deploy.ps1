param(
  [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\")).Path
Set-Location $ProjectDir

if (-not $CommitMessage) {
  $CommitMessage = "chore: release update " + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

Write-Host "[1/4] Building locally..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "[2/4] Checking local changes..." -ForegroundColor Cyan
$status = git status --porcelain
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if ($status) {
  Write-Host "[3/4] Committing and pushing..." -ForegroundColor Cyan
  git add -A
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} else {
  Write-Host "[3/4] No local changes to commit. Pushing current main..." -ForegroundColor Yellow
}

git push origin main
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "[4/4] Deploying on server..." -ForegroundColor Cyan
ssh root@43.132.224.154 "cd /var/www/choose-dish-app && git pull && npm run db:init && npm run build && pm2 restart choose-dish-app && pm2 status"
exit $LASTEXITCODE
