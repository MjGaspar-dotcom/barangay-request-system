$ErrorActionPreference = 'Stop'

$backendRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot '..\..\barangay-request-system')
)
$artisanPath = Join-Path $backendRoot 'artisan'
$envPath = Join-Path $backendRoot '.env'
$autoloadPath = Join-Path $backendRoot 'vendor\autoload.php'

if (-not (Test-Path -LiteralPath $artisanPath -PathType Leaf)) {
    throw "Laravel project was not found at '$backendRoot'. Keep the mobile and API repositories in sibling folders."
}
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
    throw "Laravel .env is missing at '$envPath'. Copy .env.example to .env and configure it first."
}
if (-not (Test-Path -LiteralPath $autoloadPath -PathType Leaf)) {
    throw "Laravel dependencies are missing. Run 'composer install' in '$backendRoot'."
}

$server = Start-Process `
    -FilePath 'powershell.exe' `
    -WorkingDirectory $backendRoot `
    -ArgumentList @(
        '-NoExit',
        '-Command',
        'php artisan serve --host=0.0.0.0 --port=8000'
    ) `
    -PassThru

Write-Host "Started the local API in a separate PowerShell window (PID $($server.Id))."
Write-Host 'Keep that window open while using the app. The API URL is http://127.0.0.1:8000/api.'
