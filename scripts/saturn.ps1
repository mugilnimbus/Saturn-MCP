# Manage this checkout's local Saturn process; no dependency installation or port-wide killing.
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action = 'status',
    [ValidateRange(0, 65535)]
    [int]$Port = 0,
    [ValidateRange(1, 600)]
    [int]$TimeoutSeconds = 30,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$serviceDir = Join-Path $repoRoot 'services/saturn'
$python = Join-Path $serviceDir '.venv/Scripts/python.exe'
$runtimeDir = Join-Path $repoRoot '.artifacts/server'
$stateFile = Join-Path $runtimeDir 'state.json'
$lockFile = Join-Path $runtimeDir 'launcher.lock'

function Read-State {
    if (-not (Test-Path -LiteralPath $stateFile)) { return $null }
    $record = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    if ($record.run_id -notmatch '^[a-f0-9]{32}$' -or $record.pid -lt 1 -or
        $record.port -lt 1 -or $record.port -gt 65535 -or $record.root -ne $repoRoot) {
        throw 'Invalid launcher state. Inspect .artifacts/server/state.json before continuing.'
    }
    return $record
}

function Owned-Process($record) {
    if ($null -eq $record) { return $null }
    $owned = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($null -eq $owned) { return $null }
    # PID alone is insufficient: Windows can reuse it after a process exits.
    if ($owned.StartTime.ToUniversalTime().Ticks.ToString() -ne $record.start_ticks -or
        $owned.Path -ne $python) {
        return $null
    }
    return $owned
}

function Control-Dir($record) { return Join-Path $runtimeDir $record.run_id }

function Endpoint($record) {
    $address = $record.host
    if ($address -eq '0.0.0.0') { $address = '127.0.0.1' }
    if ($address -eq '::') { $address = '::1' }
    if ($address.Contains(':')) { $address = "[$address]" }
    return "http://${address}:$($record.port)"
}

function Health($record) {
    try {
        $answer = Invoke-RestMethod -Uri "$(Endpoint $record)/api/health" -TimeoutSec 2
        return $answer.status -eq 'ok'
    } catch { return $false }
}

function Port-In-Use([string]$address, [int]$listenPort) {
    if ($address -eq '0.0.0.0') { $address = '127.0.0.1' }
    if ($address -eq '::') { $address = '::1' }
    $socket = [Net.Sockets.TcpClient]::new()
    try {
        $connection = $socket.ConnectAsync($address, $listenPort)
        return $connection.Wait(1000) -and $socket.Connected
    } catch { return $false }
    finally { $socket.Dispose() }
}

function Show-Status($record, [string]$label) {
    $details = [ordered]@{ status = $label; pid = $null; dashboard_url = $null; mcp_url = $null }
    if ($null -ne $record) {
        $details.pid = $record.pid
        $details.dashboard_url = "$(Endpoint $record)/"
        $details.mcp_url = "$(Endpoint $record)/mcp"
        $details.stdout_log = Join-Path (Control-Dir $record) 'stdout.log'
        $details.stderr_log = Join-Path (Control-Dir $record) 'stderr.log'
    }
    if ($label -eq 'running') {
        try {
            $ready = Invoke-RestMethod -Uri "$(Endpoint $record)/api/ready" -TimeoutSec 10
            $details.store = $ready.store
            $details.local_server = $ready.local_server
        } catch {
            $details.store = 'unknown'
            $details.local_server = @{ reachable = $null; error = 'Dependency status unavailable; server health passed.' }
        }
    }
    if ($Json) { $details | ConvertTo-Json -Depth 5; return }
    Write-Output "Saturn: $label"
    if ($null -ne $record) {
        Write-Output "PID: $($record.pid)"
        Write-Output "Dashboard: $($details.dashboard_url)"
        Write-Output "MCP: $($details.mcp_url)"
        Write-Output "Logs: $(Control-Dir $record)"
    }
    if ($label -eq 'running') {
        Write-Output "Store: $($details.store)"
        $modelState = if ($details.local_server.reachable -eq $true -and $details.local_server.authorized -eq $true) {
            'available'
        } else { 'unavailable (code-only digests still work)' }
        Write-Output "Local server: $modelState"
    }
}

function Status-Label($record) {
    if ($null -eq (Owned-Process $record)) { return 'stopped' }
    $control = Control-Dir $record
    if (Test-Path -LiteralPath (Join-Path $control 'stop')) { return 'stopping' }
    if ((Test-Path -LiteralPath (Join-Path $control 'ready')) -and (Health $record)) { return 'running' }
    return 'unhealthy'
}

function Read-Configuration {
    if (-not (Test-Path -LiteralPath $python)) {
        throw 'Python environment missing. Run uv sync in services/saturn first.'
    }
    Push-Location $serviceDir
    try {
        $raw = & $python -c 'import json; from saturn.infrastructure.config import get_settings; s=get_settings(); print(json.dumps({"host":s.host,"port":s.port}))'
        if ($LASTEXITCODE -ne 0) { throw 'Could not load Saturn configuration.' }
        return $raw | ConvertFrom-Json
    } finally { Pop-Location }
}

function Show-Unmanaged-Or-Stopped {
    if (-not (Test-Path -LiteralPath $python)) { Show-Status $null 'stopped'; return }
    $config = Read-Configuration
    $listenPort = if ($Port -gt 0) { $Port } else { [int]$config.port }
    if (-not (Port-In-Use $config.host $listenPort)) { Show-Status $null 'stopped'; return }
    $address = Endpoint @{ host = $config.host; port = $listenPort }
    if ($Json) {
        @{ status = 'unmanaged'; pid = $null; port = $listenPort; url = $address;
            message = 'Port occupied by a process this launcher does not own.' } | ConvertTo-Json
    } else {
        Write-Output "Saturn: unmanaged port occupant at $address. Stop it from its original terminal; this launcher will not stop it."
    }
}

function Start-Saturn {
    $record = Read-State
    if ($null -ne (Owned-Process $record)) {
        if ($Port -gt 0 -and $record.port -ne $Port) {
            throw "This checkout already has a managed server on port $($record.port). Stop it before choosing another port."
        }
        $label = Status-Label $record
        if ($label -ne 'running') {
            throw "The managed server is $label. Inspect status/logs and stop it before starting again."
        }
        Show-Status $record $label
        return
    }
    # Load the exact application's configuration without printing credentials or parsing .env twice.
    $config = Read-Configuration
    $listenPort = if ($Port -gt 0) { $Port } else { [int]$config.port }
    if ($listenPort -lt 1 -or $listenPort -gt 65535) { throw 'SATURN_PORT must be between 1 and 65535.' }
    if (Port-In-Use $config.host $listenPort) {
        throw "Port $listenPort is already occupied. No process was stopped. Use -Port to choose another port."
    }
    $runId = [Guid]::NewGuid().ToString('N')
    $control = Join-Path $runtimeDir $runId
    [IO.Directory]::CreateDirectory($control) | Out-Null
    # Start-Process joins its argument array; explicitly quote paths containing spaces.
    $arguments = @('-m', 'saturn.bootstrap.cli', 'serve', '--host', ('"' + $config.host + '"'),
        '--port', $listenPort.ToString(), '--control-dir', ('"' + $control + '"'))
    $owned = Start-Process -FilePath $python -ArgumentList $arguments -WorkingDirectory $serviceDir -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $control 'stdout.log') -RedirectStandardError (Join-Path $control 'stderr.log')
    $record = [ordered]@{ root = $repoRoot; run_id = $runId; pid = $owned.Id;
        start_ticks = $owned.StartTime.ToUniversalTime().Ticks.ToString(); host = $config.host; port = $listenPort }
    $temporary = Join-Path $runtimeDir 'state.tmp'
    $record | ConvertTo-Json | Set-Content -LiteralPath $temporary -Encoding UTF8
    Move-Item -LiteralPath $temporary -Destination $stateFile -Force
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        $owned.Refresh()
        if ($owned.HasExited) {
            throw "Saturn exited during startup (exit $($owned.ExitCode)). Inspect $control/stderr.log."
        }
        if ((Test-Path -LiteralPath (Join-Path $control 'ready')) -and (Health $record)) {
            Show-Status $record 'running'
            return
        }
        Start-Sleep -Milliseconds 200
    }
    # Keep the ownership record and ask for shutdown, so a slow startup is never orphaned.
    [IO.File]::WriteAllText((Join-Path $control 'stop'), '')
    throw "Startup exceeded $TimeoutSeconds seconds; graceful stop requested. Inspect $control/stderr.log and run status."
}

function Stop-Saturn {
    $record = Read-State
    $owned = Owned-Process $record
    if ($null -eq $owned) {
        if ($null -ne $record) { Remove-Item -LiteralPath $stateFile }
        Show-Status $null 'stopped'
        return
    }
    $control = Control-Dir $record
    if (-not (Test-Path -LiteralPath $control -PathType Container)) { throw 'Control directory missing; refusing to stop an unverified process.' }
    [IO.File]::WriteAllText((Join-Path $control 'stop'), '')
    if (-not $owned.WaitForExit($TimeoutSeconds * 1000)) {
        throw "Saturn is still shutting down. Run 'uv run saturn stop --timeout 120' to wait for cleanup. No process was killed."
    }
    Remove-Item -LiteralPath $stateFile
    Show-Status $null 'stopped'
}

$lock = $null
try {
    if ($env:OS -ne 'Windows_NT') { throw 'This launcher supports Windows. Use uv run saturn serve on other platforms.' }
    if ($Action -eq 'status') {
        $record = Read-State
        if ($null -eq (Owned-Process $record)) {
            Show-Unmanaged-Or-Stopped
        } else {
            Show-Status $record (Status-Label $record)
        }
    } else {
        [IO.Directory]::CreateDirectory($runtimeDir) | Out-Null
        try { $lock = [IO.File]::Open($lockFile, 'OpenOrCreate', 'ReadWrite', 'None') }
        catch { throw 'Another launcher operation is in progress. Retry after it finishes.' }
        if ($Action -eq 'start') { Start-Saturn } else { Stop-Saturn }
    }
} catch {
    if ($Json) { @{ status = 'error'; error = $_.Exception.Message } | ConvertTo-Json }
    else { Write-Error $_ -ErrorAction Continue }
    exit 1
} finally {
    if ($null -ne $lock) { $lock.Dispose() }
}
