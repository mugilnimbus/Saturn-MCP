# Register this checkout's installed CLI in the current user's existing uv bin directory, or remove it with -Remove.
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'User command registration supports Windows.' }
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Run registration from PowerShell 7.' }
$shell = Join-Path $PSHOME 'pwsh.exe'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$binDir = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.local/bin'
$target = Join-Path $binDir 'saturn.exe'
$receipt = Join-Path $binDir 'saturn-registration.json'
$registeredHere = (Test-Path -LiteralPath $receipt) -and
    ((Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json).root -eq $repoRoot)

if ($Remove) {
    if (-not $registeredHere) { Write-Output 'This checkout is not registered; nothing was removed.'; exit 0 }
    Remove-Item -LiteralPath $target -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $receipt
    # The folder stays on PATH: uv uses it for other tools.
    Write-Output "Removed saturn from $binDir."
    exit 0
}

$python = Join-Path $repoRoot 'services/saturn/.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Run uv sync in services/saturn before registering the command.' }
[IO.Directory]::CreateDirectory($binDir) | Out-Null
$source = Join-Path $repoRoot 'services/saturn/.venv/Scripts/saturn.exe'
if (-not (Test-Path -LiteralPath $source)) { throw 'The installed saturn console entry is missing; run uv sync in services/saturn.' }
if ((Test-Path -LiteralPath $target) -and -not $registeredHere) {
    throw "Another command already exists at $target; it was not replaced."
}
# uv resolves native executable entries; use the existing console launcher, whose interpreter is fixed to this environment.
Copy-Item -LiteralPath $source -Destination $target -Force
@{ root = $repoRoot; executable = $target; shell = $shell } | ConvertTo-Json | Set-Content -LiteralPath $receipt -Encoding UTF8
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$entries = @($userPath -split ';' | Where-Object { $_ })
if ($entries -notcontains $binDir) {
    [Environment]::SetEnvironmentVariable('Path', (($entries + $binDir) -join ';'), 'User')
}
if (($env:Path -split ';') -notcontains $binDir) { $env:Path += ";$binDir" }
Write-Output 'Registered saturn. Next: saturn setup'
