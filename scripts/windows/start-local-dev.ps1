param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\")).Path

function Get-ListeningProcessId {
  param([int]$Port)

  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($null -ne $connection -and $connection.OwningProcess -gt 0) {
      return [int]$connection.OwningProcess
    }
  } catch {
  }

  return $null
}

function Test-ListeningPort {
  param([int]$Port)

  return $null -ne (Get-ListeningProcessId -Port $Port)
}

function Stop-PortListener {
  param([int]$Port)

  $processId = Get-ListeningProcessId -Port $Port

  if ($null -ne $processId) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Start-Sleep -Seconds 1
    } catch {
      Write-Warning "停止端口 $Port 的进程失败，请手动关闭 PID $processId。"
    }
  }
}

function Wait-Until {
  param(
    [scriptblock]$Test,
    [int]$TimeoutSeconds = 15
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    if (& $Test) {
      return $true
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Test-DatabaseHealth {
  $nodeScript = @'
const dotenv = require("dotenv");
const mariadb = require("mariadb");
dotenv.config();
const u = new URL(process.env.DATABASE_URL);
async function main() {
  const conn = await mariadb.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectTimeout: 5000,
  });
  await conn.query("SELECT 1");
  await conn.end();
}
main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
'@

  $null = $nodeScript | node 2>$null
  return $LASTEXITCODE -eq 0
}

function Test-ApiHealth {
  param(
    [string]$Url = 'http://127.0.0.1:3001/api/dishes',
    [int]$TimeoutSeconds = 15
  )

  $client = New-Object System.Net.Http.HttpClient
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)

  try {
    $response = $client.GetAsync($Url).GetAwaiter().GetResult()
    return $response.IsSuccessStatusCode
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

$tunnelCommand = "Set-Location '$repoRoot'; ssh -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -N -L 3307:127.0.0.1:3306 root@43.132.224.154"
$devCommand = "Set-Location '$repoRoot'; npm run dev"

$tunnelHealthy = (Test-ListeningPort -Port 3307) -and (Test-DatabaseHealth)

if (-not $tunnelHealthy) {
  Stop-PortListener -Port 3307

  Start-Process pwsh -ArgumentList @(
    '-NoExit'
    '-Command'
    $tunnelCommand
  ) | Out-Null

  if (-not (Wait-Until -Test { (Test-ListeningPort -Port 3307) -and (Test-DatabaseHealth) } -TimeoutSeconds 20)) {
    Write-Warning 'SSH 隧道没有健康就绪，请检查弹出的隧道窗口。'
  }
} else {
  Write-Host 'SSH 隧道已健康运行。' -ForegroundColor Yellow
}

$apiHealthy = (Test-ListeningPort -Port 3001) -and (Test-ApiHealth)

if (-not $apiHealthy) {
  Stop-PortListener -Port 3001

  Start-Process pwsh -ArgumentList @(
    '-NoExit'
    '-Command'
    $devCommand
  ) | Out-Null

  if (-not (Wait-Until -Test { Test-ApiHealth } -TimeoutSeconds 40)) {
    Write-Warning '本地开发服务没有健康就绪，请检查弹出的开发窗口。'
  }
} else {
  Write-Host '本地开发服务已健康运行。' -ForegroundColor Yellow
}

if (-not $NoBrowser -and (Test-ApiHealth)) {
  Start-Process 'http://127.0.0.1:3001' | Out-Null
}

Write-Host ''

if ((Test-ListeningPort -Port 3307) -and (Test-ApiHealth)) {
  Write-Host '本地开发环境已启动：' -ForegroundColor Green
  Write-Host '  应用: http://127.0.0.1:3001' -ForegroundColor Green
  Write-Host '  数据库隧道: 127.0.0.1:3307 -> 43.132.224.154:3306' -ForegroundColor Green
} else {
  Write-Warning '本地开发环境仍未完全健康，请查看弹出的 SSH / dev 窗口日志。'
}
