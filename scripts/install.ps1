#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Info([string]$Message) { Write-Host "▸ $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "✔ $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Fail([string]$Message) { throw $Message }

$Repo = 'aj47/dotagents-mono'
$RepoUrl = "https://github.com/$Repo"
$ApiBaseUrl = "https://api.github.com/repos/$Repo/releases"
$InstallDir = if ($env:DOTAGENTS_DIR) { $env:DOTAGENTS_DIR } else { Join-Path $HOME '.dotagents' }
$FromSource = $env:DOTAGENTS_FROM_SOURCE -eq '1'
$ReleaseTag = if ($env:DOTAGENTS_RELEASE_TAG) { $env:DOTAGENTS_RELEASE_TAG } else { 'latest' }

function Get-TargetArchitecture {
  $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
  switch ($arch) {
    'X64' { return 'x64' }
    'Arm64' {
      Write-Warn 'Windows ARM64 will use the x64 desktop installer via emulation.'
      return 'x64'
    }
    default { Fail "Unsupported Windows architecture: $arch" }
  }
}

function Get-ReleaseMetadata {
  $apiUrl = if ($ReleaseTag -eq 'latest') { "$ApiBaseUrl/latest" } else { "$ApiBaseUrl/tags/$ReleaseTag" }
  Write-Info 'Fetching release metadata from GitHub...'
  try {
    return Invoke-RestMethod -Uri $apiUrl -Headers @{ Accept = 'application/vnd.github+json' }
  } catch {
    Fail "Failed to fetch release metadata from GitHub: $($_.Exception.Message)"
  }
}

function Select-ReleaseAsset([object]$Release, [string]$Arch) {
  $setup = $Release.assets | Where-Object { $_.name -match '^DotAgents-.*-setup\.exe$' } | Select-Object -First 1
  if ($setup) { return $setup }

  $portablePattern = "^DotAgents-.*-$Arch-portable\.exe$"
  $portable = $Release.assets | Where-Object { $_.name -match $portablePattern } | Select-Object -First 1
  if ($portable) { return $portable }

  Fail "No Windows release asset found for $Arch on $($Release.tag_name)."
}

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Install-Release {
  $arch = Get-TargetArchitecture
  $release = Get-ReleaseMetadata
  if (-not $release.tag_name) {
    Fail 'The GitHub release response did not include a tag_name.'
  }

  $asset = Select-ReleaseAsset -Release $release -Arch $arch
  $downloadUrl = $asset.browser_download_url
  $installerPath = Join-Path $InstallDir $asset.name
  Ensure-Directory $InstallDir

  Write-Info "Downloading $($asset.name)..."
  Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath

  $isPortable = $asset.name -match '-portable\.exe$'
  if ($isPortable) {
    Write-Ok "Portable build downloaded to $installerPath"
    Write-Info 'Run the downloaded executable to launch DotAgents.'
    return
  }

  $silent = $true
  if ($env:DOTAGENTS_WINDOWS_SILENT -eq '0') {
    $silent = $false
  }

  $arguments = if ($silent) { @('/S') } else { @() }
  Write-Info 'Starting the Windows installer...'
  $process = Start-Process -FilePath $installerPath -ArgumentList $arguments -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    Fail "Installer exited with code $($process.ExitCode)."
  }

  $knownPaths = @(
    (Join-Path $env:LOCALAPPDATA 'Programs/DotAgents/DotAgents.exe'),
    (Join-Path $env:ProgramFiles 'DotAgents/DotAgents.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'DotAgents/DotAgents.exe')
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  if ($knownPaths.Count -gt 0) {
    Write-Ok "DotAgents installed at $($knownPaths[0])"
  } else {
    Write-Ok 'DotAgents installer completed successfully.'
  }
}

function Resolve-PnpmCommand {
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    return @('pnpm')
  }

  if (Get-Command corepack -ErrorAction SilentlyContinue) {
    Write-Info 'Enabling pnpm via corepack...'
    & corepack enable | Out-Null
    & corepack pnpm --version | Out-Null
    return @('corepack', 'pnpm')
  }

  $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
  if ($npmCommand) {
    Write-Info 'Installing pnpm with npm...'
    & $npmCommand.Source install -g pnpm | Out-Null
    return @('pnpm')
  }

  Fail 'pnpm is required for DOTAGENTS_FROM_SOURCE=1, and neither pnpm, corepack, nor npm was found.'
}

function Invoke-Pnpm([string[]]$PnpmCommand, [string[]]$Arguments) {
  $command = $PnpmCommand[0]
  $baseArgs = @()
  if ($PnpmCommand.Count -gt 1) {
    $baseArgs += $PnpmCommand[1..($PnpmCommand.Count - 1)]
  }
  & $command @baseArgs @Arguments
}

function Install-FromSource {
  $gitCommand = Get-Command git -ErrorAction SilentlyContinue
  if (-not $gitCommand) { Fail 'Git is required for DOTAGENTS_FROM_SOURCE=1.' }

  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if (-not $nodeCommand) { Fail 'Node.js 20.19.4+ is required for DOTAGENTS_FROM_SOURCE=1.' }

  $nodeMajor = [int](& $nodeCommand.Source -p "process.versions.node.split('.')[0]")
  if ($nodeMajor -lt 20) {
    Fail 'Node.js 20.19.4+ is required for DOTAGENTS_FROM_SOURCE=1.'
  }

  $pnpmCommand = Resolve-PnpmCommand
  Ensure-Directory $InstallDir
  $repoPath = Join-Path $InstallDir 'repo'

  if (Test-Path -LiteralPath (Join-Path $repoPath '.git')) {
    Write-Info 'Updating existing repo...'
    Push-Location $repoPath
    & $gitCommand.Source pull --ff-only origin main
    Pop-Location
  } else {
    Write-Info 'Cloning DotAgents...'
    & $gitCommand.Source clone --depth 1 "$RepoUrl.git" $repoPath
  }

  Push-Location $repoPath
  try {
    Write-Info 'Installing dependencies...'
    Invoke-Pnpm -PnpmCommand $pnpmCommand -Arguments @('install', '--frozen-lockfile')
    Write-Info 'Building shared workspace package...'
    Invoke-Pnpm -PnpmCommand $pnpmCommand -Arguments @('build:shared')

    if (Get-Command cargo -ErrorAction SilentlyContinue) {
      Write-Info 'Building Rust desktop binary...'
      Invoke-Pnpm -PnpmCommand $pnpmCommand -Arguments @('--filter', '@dotagents/desktop', 'build-rs')
    } else {
      Write-Warn 'Cargo was not found. Voice-native features may be unavailable in source mode.'
    }
  } finally {
    Pop-Location
  }

  Write-Ok "Source checkout is ready at $repoPath"
  $pnpmDisplay = ($pnpmCommand -join ' ')
  Write-Info "Start the desktop app with: cd $repoPath; $pnpmDisplay dev"
}

Write-Host ''
Write-Host '  ┌──────────────────────────────────┐' -ForegroundColor Cyan
Write-Host '  │     .a  DotAgents Installer       │' -ForegroundColor Cyan
Write-Host '  └──────────────────────────────────┘' -ForegroundColor Cyan
Write-Host ''

if ($FromSource) {
  Install-FromSource
} else {
  Install-Release
}

Write-Host ''
Write-Host 'Done! Documentation: https://docs.dotagents.app' -ForegroundColor Green
Write-Host ''