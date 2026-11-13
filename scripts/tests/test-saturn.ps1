# Exercise the Windows launcher against a real server and unrelated port/process fixtures.
$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$launcher = Join-Path $repoRoot 'scripts/saturn.ps1'
$runtimeDir = Join-Path $repoRoot '.artifacts/server'
$stateFile = Join-Path $runtimeDir 'state.json'
if (Test-Path -LiteralPath $stateFile) { throw 'Stop the managed server before running launcher integration tests.' }

function Invoke-Launcher([hashtable]$Options, [int]$ExpectedExit = 0) {
    $global:LASTEXITCODE = 0
    $output = & $launcher @Options -Json
    if ($LASTEXITCODE -ne $ExpectedExit) { throw "Launcher exit $LASTEXITCODE; expected $ExpectedExit. Output: $output" }
    return $output | ConvertFrom-Json
}

function Assert([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$started = $false
try {
    [IO.Directory]::CreateDirectory($runtimeDir) | Out-Null
    $operationLock = [IO.File]::Open((Join-Path $runtimeDir 'launcher.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    try {
        $locked = Invoke-Launcher @{ Action = 'start' } 1
        Assert ($locked.status -eq 'error' -and -not (Test-Path -LiteralPath $stateFile)) 'Concurrent launcher operations must be refused.'
    } finally { $operationLock.Dispose() }
    $listener.Start()
    $testPort = $listener.LocalEndpoint.Port
    $status = Invoke-Launcher @{ Action = 'status'; Port = $testPort }
    Assert ($status.status -eq 'unmanaged') 'An unrelated listener must be reported as unmanaged.'
    $refusal = Invoke-Launcher @{ Action = 'start'; Port = $testPort } 1
    Assert ($refusal.status -eq 'error' -and $listener.Server.IsBound) 'An occupied port must be refused without affecting its listener.'
    $listener.Stop()

    # A stale/tampered PID record must not target another executable, even with a matching creation time.
    $runId = [Guid]::NewGuid().ToString('N')
    $control = Join-Path $runtimeDir $runId
    [IO.Directory]::CreateDirectory($control) | Out-Null
    $current = Get-Process -Id $PID
    @{ root = $repoRoot; run_id = $runId; pid = $PID; host = '127.0.0.1'; port = $testPort;
        start_ticks = $current.StartTime.ToUniversalTime().Ticks.ToString() } |
        ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
    $stopped = Invoke-Launcher @{ Action = 'stop'; TimeoutSeconds = 1 }
    Assert ($stopped.status -eq 'stopped' -and -not (Test-Path -LiteralPath (Join-Path $control 'stop'))) 'Stop must refuse to signal an unrelated executable.'

    $started = $true # ensure cleanup even if a launch times out after recording the process
    $first = Invoke-Launcher @{ Action = 'start'; Port = $testPort }
    Assert ($first.status -eq 'running' -and $first.store -eq 'ok') 'Start must wait for server health.'
    $second = Invoke-Launcher @{ Action = 'start'; Port = $testPort }
    Assert ($second.pid -eq $first.pid) 'Repeated start must not create a second process.'
    $status = Invoke-Launcher @{ Action = 'status' }
    Assert ($status.status -eq 'running' -and $status.pid -eq $first.pid) 'Status must identify the managed process.'
    $stopped = Invoke-Launcher @{ Action = 'stop' }
    Assert ($stopped.status -eq 'stopped' -and -not (Test-Path -LiteralPath $stateFile)) 'Stop must wait for exit and clear ownership.'
    $started = $false
    $stopped = Invoke-Launcher @{ Action = 'stop' }
    Assert ($stopped.status -eq 'stopped') 'Repeated stop must be harmless.'
    $status = Invoke-Launcher @{ Action = 'status'; Port = $testPort }
    Assert ($status.status -eq 'stopped') 'The test port must be released after shutdown.'
    $log = Get-Content -LiteralPath $first.stderr_log -Raw
    Assert ($log.Contains('Application shutdown complete.')) 'Application lifespan cleanup must complete.'
    Write-Output 'Launcher integration checks passed: operation lock, occupied port, ownership guard, start, status, idempotence, graceful stop, port release.'
} finally {
    $listener.Stop()
    if ($started) { & $launcher stop -TimeoutSeconds 60 }
}
